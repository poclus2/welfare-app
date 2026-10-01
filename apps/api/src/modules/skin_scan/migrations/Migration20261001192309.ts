import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261001192309 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "skin_scan" ("id" text not null, "customer_id" text null, "final_skin_type" text not null, "estimated_skin_age" integer not null, "melanin_phototype" text null, "concerns" jsonb null, "metrics" jsonb null, "routine" jsonb null, "images" jsonb null, "qwen_raw_summary" text null, "claude_raw_summary" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "skin_scan_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_skin_scan_deleted_at" ON "skin_scan" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "skin_scan" cascade;`);
  }

}
