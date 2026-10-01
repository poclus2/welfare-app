import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261001192308 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "delivery_city" ("id" text not null, "name" text not null, "has_neighborhoods" boolean not null default false, "fixed_price" integer null, "is_active" boolean not null default true, "estimated_time" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "delivery_city_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_delivery_city_deleted_at" ON "delivery_city" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "delivery_neighborhood" ("id" text not null, "name" text not null, "price" integer not null default 0, "is_active" boolean not null default true, "estimated_time" text null, "city_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "delivery_neighborhood_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_delivery_neighborhood_city_id" ON "delivery_neighborhood" ("city_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_delivery_neighborhood_deleted_at" ON "delivery_neighborhood" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "delivery_setting" ("id" text not null, "free_shipping_threshold" integer not null default 0, "cod_fee" integer not null default 0, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "delivery_setting_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_delivery_setting_deleted_at" ON "delivery_setting" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "pickup_point" ("id" text not null, "name" text not null, "address" text not null, "city" text not null, "phone" text null, "opening_hours" text null, "price" integer not null default 0, "is_active" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "pickup_point_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_pickup_point_deleted_at" ON "pickup_point" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "weight_rule" ("id" text not null, "min_weight" integer not null, "max_weight" integer null, "additional_fee" integer not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "weight_rule_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_weight_rule_deleted_at" ON "weight_rule" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "delivery_neighborhood" add constraint "delivery_neighborhood_city_id_foreign" foreign key ("city_id") references "delivery_city" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "delivery_neighborhood" drop constraint if exists "delivery_neighborhood_city_id_foreign";`);

    this.addSql(`drop table if exists "delivery_city" cascade;`);

    this.addSql(`drop table if exists "delivery_neighborhood" cascade;`);

    this.addSql(`drop table if exists "delivery_setting" cascade;`);

    this.addSql(`drop table if exists "pickup_point" cascade;`);

    this.addSql(`drop table if exists "weight_rule" cascade;`);
  }

}
