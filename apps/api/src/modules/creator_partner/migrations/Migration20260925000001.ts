import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260925000001 extends Migration {

  override async up(): Promise<void> {
    // creator_partner
    this.addSql(`create table if not exists "creator_partner" ("id" text not null, "application_id" text null, "customer_id" text null, "first_name" text not null, "last_name" text not null, "email" text not null, "phone" text null, "code" text not null, "referral_link" text null, "status" text check ("status" in ('active', 'suspended', 'ambassador')) not null default 'active', "is_creator_of_month" boolean not null default false, "creator_of_month_until" timestamptz null, "creator_of_month_bonus_pct" real null, "creator_of_month_free_shipping" boolean not null default false, "instagram" text null, "tiktok" text null, "youtube" text null, "other_link" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "creator_partner_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_creator_partner_code" ON "creator_partner" ("code") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_creator_partner_deleted_at" ON "creator_partner" ("deleted_at") WHERE deleted_at IS NULL;`);
    
    // creator_click
    this.addSql(`create table if not exists "creator_click" ("id" text not null, "creator_id" text not null, "ip_hash" text null, "user_agent" text null, "referrer" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "creator_click_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_creator_click_creator_id" ON "creator_click" ("creator_id") WHERE deleted_at IS NULL;`);
    
    // creator_order
    this.addSql(`create table if not exists "creator_order" ("id" text not null, "creator_id" text not null, "order_id" text not null, "order_status" text not null default 'pending', "gross_products_amount" real not null default 0, "discount_applied" real not null default 0, "payment_fee_amount" real not null default 0, "payment_fee_rate" real not null default 0, "eligible_revenue" real not null default 0, "commission_rate" real not null default 3, "commission_amount" real not null default 0, "commission_status" text check ("commission_status" in ('pending', 'validated', 'paid', 'cancelled', 'adjusted')) not null default 'pending', "is_new_customer" boolean not null default false, "year" integer not null, "month" integer not null, "refund_adjustment" real not null default 0, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "creator_order_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_creator_order_order_id" ON "creator_order" ("order_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_creator_order_creator_id" ON "creator_order" ("creator_id") WHERE deleted_at IS NULL;`);
    
    // creator_monthly_summary
    this.addSql(`create table if not exists "creator_monthly_summary" ("id" text not null, "creator_id" text not null, "year" integer not null, "month" integer not null, "total_eligible_revenue" real not null default 0, "commission_rate" real not null default 3, "total_commission" real not null default 0, "total_orders" integer not null default 0, "total_new_customers" integer not null default 0, "total_clicks" integer not null default 0, "rank" integer null, "commission_paid_at" timestamptz null, "commission_status" text check ("commission_status" in ('pending', 'validated', 'paid')) not null default 'pending', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "creator_monthly_summary_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_creator_monthly_summary_unique" ON "creator_monthly_summary" ("creator_id", "year", "month") WHERE deleted_at IS NULL;`);
    
    // program_config
    this.addSql(`create table if not exists "program_config" ("id" text not null, "key" text not null, "value" text not null, "description" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "program_config_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_program_config_key" ON "program_config" ("key") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "creator_partner" cascade;`);
    this.addSql(`drop table if exists "creator_click" cascade;`);
    this.addSql(`drop table if exists "creator_order" cascade;`);
    this.addSql(`drop table if exists "creator_monthly_summary" cascade;`);
    this.addSql(`drop table if exists "program_config" cascade;`);
  }

}
