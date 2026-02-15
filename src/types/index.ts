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
  | "REPORTED"
  | "NO_INTERACTION";

export interface CallAnalytics {
  "Phishing Susceptibility Analysis"?: {
    fellForPhish: boolean;
    suspicionLevel: "none" | "low" | "medium" | "high";
    timeToSuspicion?: number;
    agreedToAction: boolean;
    riskLevel: "critical" | "high" | "medium" | "low";
  };
  "Red Flags Recognition"?: {
    redFlagsIdentified: string[];
    redFlagsMissed: string[];
    verificationAttempted: boolean;
  };
  "Employee Response Analysis"?: {
    responseType: "complied_immediately" | "asked_questions" | "requested_verification" | "refused_politely" | "hung_up" | "reported_to_it";
    questionsAsked?: string[];
    emotionalState: "calm" | "nervous" | "confused" | "defensive" | "cooperative";
    informationShared: boolean;
  };
  "Call Quality Metrics"?: {
    callDuration: number;
    employeeSpeakingPercentage?: number;
    engagementLevel: "high" | "medium" | "low";
    callOutcome: "completed_successfully" | "employee_hung_up" | "voicemail" | "no_answer" | "technical_issue";
    conversationNaturalness?: number;
  };
  "Training Recommendations"?: {
    strongPoints: string[];
    weaknesses: string[];
    trainingModules?: string[];
    riskScore: number;
    followUpRequired: boolean;
  };
}

export interface Interaction {
  id: string;
  campaign_id: string;
  employee_id: string;
  tracking_token: string;
  state: InteractionState;
  email_delivered_at?: string;
  link_clicked_at?: string;
  form_submitted_at?: string;
  vishing_call_id?: string;
  vishing_outcome?: string;
  call_transcript?: string;
  call_recording_url?: string;
  call_duration?: number;
  call_analytics?: CallAnalytics;
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
