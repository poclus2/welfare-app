import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260930000001 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "creator_partner" add column if not exists "code_returning" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "creator_partner" drop column if exists "code_returning";`);
  }

}
