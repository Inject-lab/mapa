import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      units: {
        Row: {
          id: string
          cnpj: string
          trade_name: string
          corporate_name: string
          company_type: 'bello' | 'pluma' | 'plusval'
          activity: string | null
          address: {
            street?: string
            number?: string
            neighborhood?: string
            city?: string
            state?: string
            zipCode?: string
          } | null
          coordinates: {
            lat?: number
            lng?: number
          } | null
          contact: {
            phone?: string
            email?: string
            website?: string
          } | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cnpj: string
          trade_name: string
          corporate_name: string
          company_type: 'bello' | 'pluma' | 'plusval'
          activity?: string | null
          address?: {
            street?: string
            number?: string
            neighborhood?: string
            city?: string
            state?: string
            zipCode?: string
          } | null
          coordinates?: {
            lat?: number
            lng?: number
          } | null
          contact?: {
            phone?: string
            email?: string
            website?: string
          } | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cnpj?: string
          trade_name?: string
          corporate_name?: string
          company_type?: 'bello' | 'pluma' | 'plusval'
          activity?: string | null
          address?: {
            street?: string
            number?: string
            neighborhood?: string
            city?: string
            state?: string
            zipCode?: string
          } | null
          coordinates?: {
            lat?: number
            lng?: number
          } | null
          contact?: {
            phone?: string
            email?: string
            website?: string
          } | null
          created_at?: string
          updated_at?: string
        }
      }
      cnpj_cache: {
        Row: {
          id: string
          cnpj: string
          data: any
          cached_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          cnpj: string
          data: any
          cached_at?: string
          expires_at: string
        }
        Update: {
          id?: string
          cnpj?: string
          data?: any
          cached_at?: string
          expires_at?: string
        }
      }
    }
  }
}

export type Unit = Database['public']['Tables']['units']['Row']
export type UnitInsert = Database['public']['Tables']['units']['Insert']
export type UnitUpdate = Database['public']['Tables']['units']['Update']
export type CNPJCache = Database['public']['Tables']['cnpj_cache']['Row']