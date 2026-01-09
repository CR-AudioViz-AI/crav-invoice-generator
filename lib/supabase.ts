/**
 * CR AudioViz AI - Invoice System Database Functions
 * ====================================================
 * 
 * This file contains app-specific data functions for Javari Invoice.
 * For authentication, credits, and central services, use:
 * 
 *   import { CentralServices, CentralAuth, CentralCredits } from './central-services';
 * 
 * Auth, payments, and credits should ALWAYS go through central services.
 */

// Re-export admin utilities from central services  
export { isAdmin, shouldChargeCredits, ADMIN_EMAILS } from './central-services';


import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Central platform Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kteobfyferrukqeolofj.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Singleton instances
let browserClient: SupabaseClient | null = null
let serverClient: SupabaseClient | null = null

// ============================================================================
// STANDARD CLIENTS
// ============================================================================

/**
 * Standard Supabase client for general use
 * Uses anon key - respects RLS policies
 */
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

/**
 * Admin client for server-side operations
 * Uses service role key - bypasses RLS (use carefully!)
 */
export const supabaseAdmin: SupabaseClient = SUPABASE_SERVICE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : supabase

// ============================================================================
// CLIENT FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a new Supabase client (zero-argument version)
 * Used by pages that import { createClient } from '@/lib/supabase'
 */
export function createSupabaseClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}

/**
 * Alias for createSupabaseClient
 */
export { createSupabaseClient as createClient }

/**
 * Browser client with auth persistence (singleton)
 * Use for client-side auth operations
 */
export function createSupabaseBrowserClient(): SupabaseClient {
  if (typeof window === 'undefined') {
    // Server-side: return new client each time
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  }
  
  // Client-side: return singleton for performance
  if (!browserClient) {
    browserClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  }
  return browserClient
}

/**
 * Server client for API routes
 * Uses service role key if available
 */
export function createSupabaseServerClient(): SupabaseClient {
  if (!serverClient) {
    const key = SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY
    serverClient = createClient(SUPABASE_URL, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }
  return serverClient
}

/**
 * Get Supabase admin client (for API routes)
 */
export function getSupabaseAdmin(): SupabaseClient {
  return supabaseAdmin
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// Common types that apps might expect
export type Book = {
  id: string
  title: string
  slug: string
  description: string
  category: string
  tags: string[]
  price: number
  is_free: boolean
  storage_path: string
  audio_path?: string
  created_at: string
  word_count?: number
  chapter_count?: number
}

export type Card = {
  id: string
  name: string
  set_name: string
  card_number: string
  rarity: string
  image_url?: string
  market_price?: number
  condition?: string
  grade?: string
  grading_company?: string
  user_id?: string
  created_at: string
}

export type UserProfile = {
  id: string
  email: string
  display_name?: string
  avatar_url?: string
  subscription_tier: 'free' | 'starter' | 'pro' | 'enterprise'
  created_at: string
}

// ============================================================================
// EXPORTS
// ============================================================================

export { SUPABASE_URL, SUPABASE_ANON_KEY }

// Default export for ESM compatibility
export default supabase
