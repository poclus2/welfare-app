import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260915183639 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "ambassador_application" ("id" text not null, "first_name" text not null, "last_name" text not null, "email" text not null, "phone" text null, "instagram" text null, "tiktok" text null, "youtube" text null, "other_link" text null, "followers" text not null, "content_type" text not null, "motivation" text not null, "status" text check ("status" in ('pending', 'approved', 'rejected')) not null default 'pending', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "ambassador_application_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ambassador_application_deleted_at" ON "ambassador_application" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "ambassador_application" cascade;`);
  }

}
