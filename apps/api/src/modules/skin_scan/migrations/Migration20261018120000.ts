import { Migration } from "@medusajs/framework/mikro-orm/migrations";

// Skin advisors and the advisor each scan is given to (see models/skin-advisor.ts)
export class Migration20261018120000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "skin_advisor" ("id" text not null, "name" text not null, "whatsapp" text not null, "active" boolean not null default true, "password_hash" text null, "session_version" integer not null default 0, "last_assigned_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "skin_advisor_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_skin_advisor_deleted_at" ON "skin_advisor" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_skin_advisor_whatsapp_unique" ON "skin_advisor" ("whatsapp") WHERE deleted_at IS NULL;`);
    this.addSql(`alter table if exists "skin_scan" add column if not exists "advisor_id" text null, add column if not exists "advisor_notified_at" timestamptz null;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_skin_scan_advisor_id" ON "skin_scan" ("advisor_id") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index if exists "IDX_skin_scan_advisor_id";`);
    this.addSql(`alter table if exists "skin_scan" drop column if exists "advisor_id", drop column if exists "advisor_notified_at";`);
    this.addSql(`drop table if exists "skin_advisor" cascade;`);
  }

}
