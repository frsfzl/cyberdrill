-- CyberDrill Database Schema for Supabase (Postgres)

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── Employees ───────────────────────────────────────────────────────
create table employees (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null unique,
  phone text not null default '',
  department text not null default '',
  position text not null default '',
  manager_email text,
  opted_out boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Campaigns ───────────────────────────────────────────────────────
create table campaigns (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  status text not null default 'draft'
    check (status in ('draft','capturing','generating','ready','delivering','active','closed')),
  pretext_scenario text not null default '',
  company_name text not null default '',
  industry text not null default '',
  login_page_url text not null default '',
  captured_html_path text,
  ngrok_url text,
  generated_email jsonb,
  generated_vishing_script text,
  delivery_method text not null default 'email'
    check (delivery_method in ('email','vapi','both')),
  vapi_delay_minutes integer not null default 5,
  target_employee_ids uuid[] not null default '{}',
  delivery_window jsonb not null default '{"start":"","end":""}',
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

-- ─── Interactions ────────────────────────────────────────────────────
create table interactions (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  tracking_token uuid not null unique default uuid_generate_v4(),
  state text not null default 'PENDING'
    check (state in ('PENDING','DELIVERED','LINK_CLICKED','CREDENTIALS_SUBMITTED','REPORTED','NO_INTERACTION')),
  email_delivered_at timestamptz,
  link_clicked_at timestamptz,
  form_submitted_at timestamptz,
  vishing_call_id text,
  vishing_outcome text,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Logs ────────────────────────────────────────────────────────────
create table logs (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid references campaigns(id) on delete set null,
  level text not null default 'info' check (level in ('info','warn','error')),
  action text not null,
  message text not null,
  metadata jsonb,
  timestamp timestamptz not null default now()
);

-- Indexes
create index idx_interactions_campaign on interactions(campaign_id);
create index idx_interactions_token on interactions(tracking_token);
create index idx_interactions_employee on interactions(employee_id);
create index idx_logs_campaign on logs(campaign_id);
create index idx_employees_email on employees(email);
