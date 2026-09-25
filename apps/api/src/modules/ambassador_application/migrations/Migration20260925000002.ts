import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260925000002 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`alter table "ambassador_application" add column if not exists "country" text null;`);
    this.addSql(`alter table "ambassador_application" add column if not exists "city" text null;`);
    this.addSql(`alter table "ambassador_application" add column if not exists "media_kit_url" text null;`);
  }
  override async down(): Promise<void> {
    this.addSql(`alter table "ambassador_application" drop column if exists "country";`);
    this.addSql(`alter table "ambassador_application" drop column if exists "city";`);
    this.addSql(`alter table "ambassador_application" drop column if exists "media_kit_url";`);
  }
}
