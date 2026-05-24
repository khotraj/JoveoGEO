// Placeholder types — regenerate with: supabase gen types typescript --project-id <id>
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: { id: string; name: string; created_at: string; created_by: string };
        Insert: { id?: string; name: string; created_at?: string; created_by: string };
        Update: { id?: string; name?: string; created_at?: string; created_by?: string };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string; tenant_id: string; slug: string; display_name: string;
          root_url: string; mode: "live" | "discovery";
          company_name: string | null; country_code: string | null;
          sector: string | null; language_codes: string[] | null;
          created_at: string; last_synced_at: string | null;
          last_discovery_run_id: string | null;
        };
        Insert: {
          id?: string; tenant_id: string; slug: string; display_name: string;
          root_url: string; mode?: "live" | "discovery";
          company_name?: string | null; country_code?: string | null;
          sector?: string | null; language_codes?: string[] | null;
          created_at?: string; last_synced_at?: string | null;
          last_discovery_run_id?: string | null;
        };
        Update: {
          tenant_id?: string; slug?: string; display_name?: string;
          root_url?: string; mode?: "live" | "discovery";
          company_name?: string | null; country_code?: string | null;
          sector?: string | null; language_codes?: string[] | null;
          last_synced_at?: string | null; last_discovery_run_id?: string | null;
        };
        Relationships: [];
      };
      recommendations: {
        Row: {
          id: string; project_id: string; wave_number: 1 | 2 | 3;
          kind: string; title: string; page_url: string | null;
          cms_path: string | null; impact_text: string | null;
          impact_score: number; effort: "XS" | "S" | "M" | "L";
          owner: string | null; eta: string | null;
          status: "open" | "scheduled" | "in_progress" | "done" | "wontfix";
          fix_steps: Json | null; resolves_issue_ids: string[] | null;
          evidence_source: string | null; pillar_id: string | null;
          created_at: string; last_modified_at: string;
        };
        Insert: {
          id?: string; project_id: string; wave_number: 1 | 2 | 3;
          kind: string; title: string; page_url?: string | null;
          cms_path?: string | null; impact_text?: string | null;
          impact_score: number; effort: "XS" | "S" | "M" | "L";
          owner?: string | null; eta?: string | null;
          status?: "open" | "scheduled" | "in_progress" | "done" | "wontfix";
          fix_steps?: Json | null; resolves_issue_ids?: string[] | null;
          evidence_source?: string | null; pillar_id?: string | null;
        };
        Update: {
          wave_number?: 1 | 2 | 3; kind?: string; title?: string; page_url?: string | null;
          cms_path?: string | null; impact_text?: string | null; impact_score?: number;
          effort?: "XS" | "S" | "M" | "L"; owner?: string | null; eta?: string | null;
          status?: "open" | "scheduled" | "in_progress" | "done" | "wontfix";
          fix_steps?: Json | null; resolves_issue_ids?: string[] | null;
          evidence_source?: string | null; pillar_id?: string | null;
        };
        Relationships: [];
      };
      issues: {
        Row: {
          id: string; project_id: string; category: string;
          severity: "critical" | "high" | "medium" | "low";
          title: string; user_sees: string | null; ai_sees: string | null;
          pages: string[] | null; cwv: Json | null;
          detected_at: string; source: string;
          status: "open" | "in_progress" | "resolved" | "wontfix";
        };
        Insert: {
          id?: string; project_id: string; category: string;
          severity: "critical" | "high" | "medium" | "low";
          title: string; user_sees?: string | null; ai_sees?: string | null;
          pages?: string[] | null; cwv?: Json | null;
          detected_at?: string; source: string;
          status?: "open" | "in_progress" | "resolved" | "wontfix";
        };
        Update: {
          category?: string; severity?: "critical" | "high" | "medium" | "low";
          title?: string; user_sees?: string | null; ai_sees?: string | null;
          pages?: string[] | null; cwv?: Json | null; source?: string;
          status?: "open" | "in_progress" | "resolved" | "wontfix";
        };
        Relationships: [];
      };
      connections: {
        Row: {
          id: string; project_id: string;
          provider: "gsc" | "ga4" | "rankscale" | "ahrefs" | "screaming_frog";
          status: "not_connected" | "connecting" | "connected" | "error" | "expired";
          external_property_id: string | null;
          scopes: string[] | null;
          last_synced_at: string | null;
          last_error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string; project_id: string;
          provider: "gsc" | "ga4" | "rankscale" | "ahrefs" | "screaming_frog";
          status?: "not_connected" | "connecting" | "connected" | "error" | "expired";
          external_property_id?: string | null;
          scopes?: string[] | null;
          last_synced_at?: string | null;
          last_error?: string | null;
          created_at?: string; updated_at?: string;
        };
        Update: {
          provider?: "gsc" | "ga4" | "rankscale" | "ahrefs" | "screaming_frog";
          status?: "not_connected" | "connecting" | "connected" | "error" | "expired";
          external_property_id?: string | null;
          scopes?: string[] | null;
          last_synced_at?: string | null; last_error?: string | null;
        };
        Relationships: [];
      };
      oauth_tokens: {
        Row: {
          id: string; connection_id: string;
          access_token_enc: string; refresh_token_enc: string | null;
          token_type: string; scope: string | null;
          expires_at: string | null; created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; connection_id: string;
          access_token_enc: string; refresh_token_enc?: string | null;
          token_type?: string; scope?: string | null;
          expires_at?: string | null; created_at?: string; updated_at?: string;
        };
        Update: {
          access_token_enc?: string; refresh_token_enc?: string | null;
          token_type?: string; scope?: string | null;
          expires_at?: string | null;
        };
        Relationships: [];
      };
      gsc_queries_daily: {
        Row: {
          id: string; project_id: string; date: string;
          query: string; device: string; country: string;
          page: string | null; impressions: number; clicks: number;
          ctr: number; position: number;
        };
        Insert: {
          id?: string; project_id: string; date: string;
          query: string; device: string; country: string;
          page?: string | null; impressions: number; clicks: number;
          ctr: number; position: number;
        };
        Update: {
          impressions?: number; clicks?: number; ctr?: number; position?: number;
        };
        Relationships: [];
      };
      gsc_pages_daily: {
        Row: {
          id: string; project_id: string; date: string;
          page: string; impressions: number; clicks: number;
          ctr: number; position: number;
        };
        Insert: {
          id?: string; project_id: string; date: string;
          page: string; impressions: number; clicks: number;
          ctr: number; position: number;
        };
        Update: {
          impressions?: number; clicks?: number; ctr?: number; position?: number;
        };
        Relationships: [];
      };
      gsc_coverage: {
        Row: {
          id: string; project_id: string; date: string;
          status: string; reason: string | null; page_count: number;
        };
        Insert: {
          id?: string; project_id: string; date: string;
          status: string; reason?: string | null; page_count: number;
        };
        Update: { status?: string; reason?: string | null; page_count?: number };
        Relationships: [];
      };
      ga4_sessions_daily: {
        Row: {
          id: string; project_id: string; date: string;
          source: string; medium: string; campaign: string | null;
          sessions: number; users: number; new_users: number;
          engagement_time_avg_sec: number | null;
          bounce_rate: number | null;
        };
        Insert: {
          id?: string; project_id: string; date: string;
          source?: string; medium?: string; campaign?: string | null;
          sessions: number; users: number; new_users: number;
          engagement_time_avg_sec?: number | null;
          bounce_rate?: number | null;
        };
        Update: {
          sessions?: number; users?: number; new_users?: number;
          engagement_time_avg_sec?: number | null; bounce_rate?: number | null;
        };
        Relationships: [];
      };
      ga4_conversions_daily: {
        Row: {
          id: string; project_id: string; date: string;
          event_name: string; count: number;
          conversion_value: number | null;
        };
        Insert: {
          id?: string; project_id: string; date: string;
          event_name: string; count: number;
          conversion_value?: number | null;
        };
        Update: { count?: number; conversion_value?: number | null };
        Relationships: [];
      };
      insights_band: {
        Row: {
          id: string; project_id: string;
          category: "seasonal" | "quick_win" | "competitor" | "content_gap";
          title: string; body: string;
          projected_impact: string | null;
          source_query: string | null;
          generated_by: string;
          generated_at: string;
          added_to_tracker: boolean;
          created_at: string;
        };
        Insert: {
          id?: string; project_id: string;
          category: "seasonal" | "quick_win" | "competitor" | "content_gap";
          title: string; body: string;
          projected_impact?: string | null;
          source_query?: string | null;
          generated_by: string;
          generated_at?: string;
          added_to_tracker?: boolean;
          created_at?: string;
        };
        Update: {
          category?: "seasonal" | "quick_win" | "competitor" | "content_gap";
          title?: string; body?: string;
          projected_impact?: string | null;
          source_query?: string | null;
          generated_by?: string;
          added_to_tracker?: boolean;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
