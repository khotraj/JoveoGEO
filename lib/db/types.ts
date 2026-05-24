// Auto-generated from Supabase schema — regenerate with: supabase gen types typescript
// For now, using a minimal typed placeholder until we run the migration.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: { id: string; name: string; created_at: string; created_by: string };
        Insert: { id?: string; name: string; created_at?: string; created_by: string };
        Update: Partial<Database["public"]["Tables"]["tenants"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["projects"]["Row"], "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["projects"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["recommendations"]["Row"], "id" | "created_at" | "last_modified_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["recommendations"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["issues"]["Row"], "id"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["issues"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
