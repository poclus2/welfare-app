"""
Odoo -> Welfare (Medusa) stock sync.

Runs on the PC that hosts a shop's Odoo database. Every `interval_seconds` it reads the sellable
stock of that shop from PostgreSQL and pushes it to the Welfare API (/odoo-sync).

    odoo_sync.exe                  loop forever (normal mode)
    odoo_sync.exe --once           one cycle then exit
    odoo_sync.exe --dry-run        read Odoo, print what would be sent, send nothing (use to check the config)
    odoo_sync.exe --config X.ini   use another config file (default: config.ini next to the program)

What is sent per barcode: the AVAILABLE quantity = on-hand - reserved, over the configured stock
location AND its sub-locations, never below 0. Every active product with a barcode is sent, including
those at 0, so a product that sells out is set back to 0 online.
"""
import argparse
import configparser
import logging
import os
import sys
import time
from logging.handlers import RotatingFileHandler

import psycopg2
import requests

BASE_DIR = os.path.dirname(os.path.abspath(sys.executable if getattr(sys, "frozen", False) else __file__))
log = logging.getLogger("odoo_sync")

# One row per barcode. The LEFT JOIN keeps products that have no stock line at all (-> 0).
# parent_path ("1/5/12/") makes "this location and everything under it" a simple prefix match.
STOCK_SQL = """
    SELECT pp.barcode,
           COALESCE(SUM(sq.quantity), 0)                            AS on_hand,
           COALESCE(SUM(sq.quantity - sq.reserved_quantity), 0)     AS available
    FROM product_product pp
    LEFT JOIN stock_quant sq
           ON sq.product_id = pp.id
          AND sq.location_id IN (
                SELECT c.id
                FROM stock_location c
                JOIN stock_location r ON c.parent_path LIKE r.parent_path || '%%'
                WHERE r.complete_name = %(loc)s AND r.active AND c.usage = 'internal'
          )
    WHERE pp.active AND pp.barcode IS NOT NULL AND TRIM(pp.barcode) <> ''
    GROUP BY pp.barcode
"""


def setup_logging():
    fmt = logging.Formatter("%(asctime)s %(levelname)s %(message)s")
    log.setLevel(logging.INFO)
    file_handler = RotatingFileHandler(os.path.join(BASE_DIR, "odoo_sync.log"), maxBytes=1_000_000, backupCount=3, encoding="utf-8")
    file_handler.setFormatter(fmt)
    console = logging.StreamHandler()
    console.setFormatter(fmt)
    log.addHandler(file_handler)
    log.addHandler(console)


def load_config(path):
    cfg = configparser.ConfigParser(inline_comment_prefixes=(";",))
    if not cfg.read(path, encoding="utf-8"):
        sys.exit(f"Config file not found: {path}")
    return cfg


def connect(cfg):
    db = cfg["odoo_db"]
    return psycopg2.connect(
        dbname=db["name"], user=db["user"], password=db["password"],
        host=db.get("host", "localhost"), port=db.get("port", "5432"), connect_timeout=10,
    )


def read_stock(conn, location_name):
    """Returns [{barcode, quantity}] or None if the stock location doesn't exist in this database."""
    with conn.cursor() as cur:
        cur.execute("SELECT 1 FROM stock_location WHERE complete_name = %s AND active", (location_name,))
        if cur.fetchone() is None:
            cur.execute("SELECT complete_name FROM stock_location WHERE usage = 'internal' AND active ORDER BY complete_name LIMIT 30")
            names = [r[0] for r in cur.fetchall()]
            log.error("Stock location '%s' not found in this database. Internal locations: %s", location_name, names)
            return None
        cur.execute(STOCK_SQL, {"loc": location_name})
        rows = cur.fetchall()

    stock, negative = [], 0
    for barcode, on_hand, available in rows:
        if float(on_hand) < 0:
            negative += 1
        stock.append({"barcode": str(barcode).strip(), "quantity": max(0, int(float(available)))})
    if negative:
        log.warning("%d products have a NEGATIVE on-hand quantity in Odoo (sent as 0) - fix them in Odoo inventory.", negative)
    return stock


def post_chunk(session, url, token, location_id, chunk, attempts=3):
    """POST one chunk with retries. Returns the parsed JSON on success, None on failure."""
    for attempt in range(1, attempts + 1):
        try:
            resp = session.post(
                url,
                json={"location_id": location_id, "stock": chunk},
                headers={"x-odoo-token": token},
                timeout=90,
            )
            if resp.status_code == 200:
                return resp.json()
            if resp.status_code in (400, 401):  # config problem: retrying won't help
                log.error("Server refused the sync (HTTP %s): %s", resp.status_code, resp.text[:300])
                return None
            log.warning("HTTP %s from server (attempt %d/%d): %s", resp.status_code, attempt, attempts, resp.text[:200])
        except requests.RequestException as e:
            log.warning("Network error (attempt %d/%d): %s", attempt, attempts, e)
        if attempt < attempts:
            time.sleep(5 * 3 ** (attempt - 1))  # 5s, 15s
    return None


def sync_once(cfg, dry_run=False):
    started = time.time()
    try:
        conn = connect(cfg)
    except Exception as e:
        log.error("Cannot connect to the Odoo database: %s", e)
        return False
    try:
        stock = read_stock(conn, cfg["stock"]["location_name"])
        if dry_run:
            with conn.cursor() as cur:
                cur.execute("SELECT datname FROM pg_database WHERE NOT datistemplate ORDER BY 1")
                log.info("PostgreSQL databases on this server: %s", [r[0] for r in cur.fetchall()])
    except Exception as e:
        log.error("Error reading stock from Odoo: %s", e)
        return False
    finally:
        conn.close()

    if not stock:
        log.error("Nothing to send (no products read) - sync skipped.")
        return False

    in_stock = sum(1 for s in stock if s["quantity"] > 0)
    log.info("Read %d products from Odoo (%d in stock, %d at 0). Database: %s, location: %s",
             len(stock), in_stock, len(stock) - in_stock, cfg["odoo_db"]["name"], cfg["stock"]["location_name"])
    if dry_run:
        log.info("Dry run - sample: %s", stock[:5])
        return True

    m = cfg["medusa"]
    size = cfg["sync"].getint("chunk_size", 500)
    ok = True
    totals = {"updated_count": 0, "unchanged_count": 0, "not_found_count": 0}
    session = requests.Session()
    for i in range(0, len(stock), size):
        result = post_chunk(session, m["url"], m["token"], m["location_id"], stock[i:i + size])
        if result is None:
            ok = False
            break
        for k in totals:
            totals[k] += result.get(k, 0)
        if result.get("errors"):
            ok = False
            log.error("Server reported errors: %s", result["errors"][:5])
        if result.get("not_found_sample"):
            log.info("Barcodes unknown to the website (sample): %s", result["not_found_sample"][:10])

    log.info("%s in %.1fs - changed online: %d, already up to date: %d, unknown barcodes: %d",
             "Sync OK" if ok else "Sync INCOMPLETE", time.time() - started,
             totals["updated_count"], totals["unchanged_count"], totals["not_found_count"])
    return ok


def main():
    parser = argparse.ArgumentParser(description="Odoo -> Welfare stock sync")
    parser.add_argument("--config", default=os.path.join(BASE_DIR, "config.ini"))
    parser.add_argument("--once", action="store_true", help="run one cycle then exit")
    parser.add_argument("--dry-run", action="store_true", help="read Odoo and print, send nothing")
    args = parser.parse_args()

    setup_logging()
    cfg = load_config(args.config)
    interval = max(60, cfg["sync"].getint("interval_seconds", 300))
    log.info("odoo_sync started (config: %s, every %ds)", args.config, interval)

    if args.once or args.dry_run:
        sys.exit(0 if sync_once(cfg, dry_run=args.dry_run) else 1)

    while True:
        try:
            sync_once(cfg)
        except Exception:
            log.exception("Unexpected error in sync cycle")
        time.sleep(interval)


if __name__ == "__main__":
    main()
