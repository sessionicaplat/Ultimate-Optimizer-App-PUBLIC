/**
 * Database type definitions
 */

export type JobStatus = 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED' | 'CANCELED';
export type ItemStatus = 'PENDING' | 'RUNNING' | 'PROCESSING' | 'DONE' | 'FAILED';

export interface Plan {
  id: string;
  name: string;
  price_cents: number;
  monthly_credits: number;
}

export interface AppInstance {
  instance_id: string;
  site_host: string;
  site_id?: string;
  default_writer_name?: string | null;
  default_writer_email?: string | null;
  default_writer_member_id?: string | null;
  access_token: string;
  refresh_token: string;
  token_expires_at: Date;
  plan_id: string;
  credits_total: number;
  credits_used_month: number;
  credits_reset_on: Date;
  subscription_start_date?: Date | null; // When user first subscribed to a paid plan
  next_billing_date?: Date | null; // When next billing cycle occurs (30 days from start)
  owner_email?: string; // Site owner's email (used to get/create Site Member for blog posts)
  owner_member_id?: string; // Site owner's Site Member ID (required for blog publishing)
  catalog_version?: string | null; // 'V1' | 'V3' - Wix Stores catalog version
  created_at: Date;
  updated_at: Date;
}

export interface Job {
  id: number;
  instance_id: string;
  status: JobStatus;
  source_scope: string;
  source_ids: any; // JSONB
  attributes: any; // JSONB
  target_lang: string;
  user_prompt: string;
  created_at: Date;
  started_at?: Date;
  finished_at?: Date;
  error?: string;
}

export interface JobItem {
  id: number;
  job_id: number;
  instance_id: string; // Added for multi-store fairness
  product_id: string;
  attribute: string;
  before_value?: string;
  after_value?: string;
  status: ItemStatus;
  error?: string;
  created_at: Date;
  updated_at: Date;
}

export interface PublishLog {
  id: number;
  instance_id: string;
  product_id: string;
  attribute: string;
  applied_value: string;
  applied_at: Date;
  job_item_id?: number | null;
}
