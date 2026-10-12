import { Migration } from "@medusajs/framework/mikro-orm/migrations";

// Audit trail and pilot review of each Skin Coach diagnostic (see models/skin-scan.ts)
export class Migration20261012100000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "skin_scan" add column if not exists "responses" jsonb null, add column if not exists "analysis_log" jsonb null, add column if not exists "notices" jsonb null, add column if not exists "review_status" text null, add column if not exists "reviewed_routine" jsonb null, add column if not exists "review_corrections" jsonb null, add column if not exists "reviewed_by" text null, add column if not exists "reviewed_at" timestamptz null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "skin_scan" drop column if exists "responses", drop column if exists "analysis_log", drop column if exists "notices", drop column if exists "review_status", drop column if exists "reviewed_routine", drop column if exists "review_corrections", drop column if exists "reviewed_by", drop column if exists "reviewed_at";`);
  }

}
