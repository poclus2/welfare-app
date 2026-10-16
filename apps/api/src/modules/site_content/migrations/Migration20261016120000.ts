import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261016120000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "home_banner" ("id" text not null, "position" integer not null default 0, "is_active" boolean not null default true, "title" text not null, "description" text null, "cta_label" text not null, "cta_href" text not null, "image_url" text null, "image_desktop_url" text null, "image_alt" text null, "bg_color" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "home_banner_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_home_banner_deleted_at" ON "home_banner" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "launch_subscriber" ("id" text not null, "campaign" text not null default 'sekoria', "first_name" text null, "phone" text null, "email" text null, "consent_text" text not null, "consented_at" timestamptz not null, "source" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "launch_subscriber_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_launch_subscriber_deleted_at" ON "launch_subscriber" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_launch_subscriber_campaign_phone" ON "launch_subscriber" ("campaign", "phone") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "home_banner" cascade;`);
    this.addSql(`drop table if exists "launch_subscriber" cascade;`);
  }

}
