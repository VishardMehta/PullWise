import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          github_username: string | null
          gitlab_username: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          github_username?: string | null
          gitlab_username?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          github_username?: string | null
          gitlab_username?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      organizations: {
        Row: {
          id: string
          name: string
          description: string | null
          owner_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          owner_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          owner_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      repositories: {
        Row: {
          id: string
          name: string
          full_name: string
          description: string | null
          provider: 'github' | 'gitlab'
          provider_id: string
          organization_id: string | null
          owner_id: string
          is_private: boolean
          default_branch: string
          webhook_url: string | null
          webhook_secret: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          full_name: string
          description?: string | null
          provider: 'github' | 'gitlab'
          provider_id: string
          organization_id?: string | null
          owner_id: string
          is_private?: boolean
          default_branch?: string
          webhook_url?: string | null
          webhook_secret?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          full_name?: string
          description?: string | null
          provider?: 'github' | 'gitlab'
          provider_id?: string
          organization_id?: string | null
          owner_id?: string
          is_private?: boolean
          default_branch?: string
          webhook_url?: string | null
          webhook_secret?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      pull_requests: {
        Row: {
          id: string
          repository_id: string
          provider_pr_id: string
          title: string
          description: string | null
          author: string
          base_branch: string
          head_branch: string
          status: 'open' | 'closed' | 'merged'
          files_changed: number
          lines_added: number
          lines_deleted: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          repository_id: string
          provider_pr_id: string
          title: string
          description?: string | null
          author: string
          base_branch: string
          head_branch: string
          status?: 'open' | 'closed' | 'merged'
          files_changed?: number
          lines_added?: number
          lines_deleted?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          repository_id?: string
          provider_pr_id?: string
          title?: string
          description?: string | null
          author?: string
          base_branch?: string
          head_branch?: string
          status?: 'open' | 'closed' | 'merged'
          files_changed?: number
          lines_added?: number
          lines_deleted?: number
          created_at?: string
          updated_at?: string
        }
      }
      analysis_jobs: {
        Row: {
          id: string
          pull_request_id: string
          status: 'pending' | 'running' | 'completed' | 'failed'
          started_at: string | null
          completed_at: string | null
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          pull_request_id: string
          status?: 'pending' | 'running' | 'completed' | 'failed'
          started_at?: string | null
          completed_at?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          pull_request_id?: string
          status?: 'pending' | 'running' | 'completed' | 'failed'
          started_at?: string | null
          completed_at?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      static_analysis_results: {
        Row: {
          id: string
          analysis_job_id: string
          file_path: string
          line_number: number
          column_number: number | null
          rule_id: string
          severity: 'error' | 'warning' | 'info'
          message: string
          suggestion: string | null
          is_fixed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          analysis_job_id: string
          file_path: string
          line_number: number
          column_number?: number | null
          rule_id: string
          severity: 'error' | 'warning' | 'info'
          message: string
          suggestion?: string | null
          is_fixed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          analysis_job_id?: string
          file_path?: string
          line_number?: number
          column_number?: number | null
          rule_id?: string
          severity?: 'error' | 'warning' | 'info'
          message?: string
          suggestion?: string | null
          is_fixed?: boolean
          created_at?: string
        }
      }
      ml_suggestions: {
        Row: {
          id: string
          analysis_job_id: string
          file_path: string
          line_start: number
          line_end: number
          original_code: string
          suggested_code: string
          explanation: string
          confidence_score: number
          effort_score: 'low' | 'medium' | 'high'
          impact_score: 'low' | 'medium' | 'high'
          category: 'security' | 'performance' | 'maintainability' | 'bug' | 'style'
          is_applied: boolean
          created_at: string
        }
        Insert: {
          id?: string
          analysis_job_id: string
          file_path: string
          line_start: number
          line_end: number
          original_code: string
          suggested_code: string
          explanation: string
          confidence_score: number
          effort_score: 'low' | 'medium' | 'high'
          impact_score: 'low' | 'medium' | 'high'
          category: 'security' | 'performance' | 'maintainability' | 'bug' | 'style'
          is_applied?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          analysis_job_id?: string
          file_path?: string
          line_start?: number
          line_end?: number
          original_code?: string
          suggested_code?: string
          explanation?: string
          confidence_score?: number
          effort_score?: 'low' | 'medium' | 'high'
          impact_score?: 'low' | 'medium' | 'high'
          category?: 'security' | 'performance' | 'maintainability' | 'bug' | 'style'
          is_applied?: boolean
          created_at?: string
        }
      }
      sandbox_branches: {
        Row: {
          id: string
          ml_suggestion_id: string
          branch_name: string
          commit_sha: string | null
          pull_request_url: string | null
          status: 'created' | 'committed' | 'pr_opened' | 'merged' | 'failed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ml_suggestion_id: string
          branch_name: string
          commit_sha?: string | null
          pull_request_url?: string | null
          status?: 'created' | 'committed' | 'pr_opened' | 'merged' | 'failed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ml_suggestion_id?: string
          branch_name?: string
          commit_sha?: string | null
          pull_request_url?: string | null
          status?: 'created' | 'committed' | 'pr_opened' | 'merged' | 'failed'
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}