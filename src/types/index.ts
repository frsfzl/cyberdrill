// ─── Employee ────────────────────────────────────────────────────────
export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  manager_email?: string;
  opted_out: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Campaign ────────────────────────────────────────────────────────
export type CampaignStatus =
  | "draft"
  | "capturing"
  | "generating"
  | "ready"
  | "delivering"
  | "active"
  | "closed";

export type DeliveryMethod = "email" | "vapi" | "both";

export interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  pretext_scenario: string;
  company_name: string;
  industry: string;
  login_page_url: string;
  captured_html_path?: string;
  ngrok_url?: string;
  generated_email?: {
    subject: string;
    body: string;
  };
  generated_vishing_script?: string;
  delivery_method?: DeliveryMethod;
  vapi_delay_minutes?: number;
  target_employee_ids: string[];
  delivery_window: {
    start: string;
    end: string;
  };
  created_at: string;
  closed_at?: string;
}

// ─── Interaction ─────────────────────────────────────────────────────
export type InteractionState =
  | "PENDING"
  | "DELIVERED"
  | "LINK_CLICKED"
  | "CREDENTIALS_SUBMITTED"
  | "LEARNING_VIEWED"
  | "REPORTED"
  | "NO_INTERACTION";

export interface Interaction {
  id: string;
  campaign_id: string;
  employee_id: string;
  tracking_token: string;
  state: InteractionState;
  email_delivered_at?: string;
  link_clicked_at?: string;
  form_submitted_at?: string;
  learning_viewed_at?: string;
  vishing_call_id?: string;
  vishing_outcome?: string;
  user_agent?: string;
  created_at: string;
  updated_at: string;
}

// ─── Log ─────────────────────────────────────────────────────────────
export interface Log {
  id: string;
  campaign_id?: string;
  level: "info" | "warn" | "error";
  action: string;
  message: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}
