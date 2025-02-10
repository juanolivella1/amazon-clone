import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Add error handling for connection issues
let isConnected = false
let connectionCheckPromise = null

async function checkConnection() {
  try {
    const { data, error } = await supabase.from('products').select('id').limit(1)
    if (error) throw error
    isConnected = true
    return true
  } catch (error) {
    console.error('Supabase connection error:', error.message || 'Unknown error')
    isConnected = false
    return false
  }
}

export async function ensureConnection() {
  if (isConnected) return true
  
  // If there's already a connection check in progress, wait for it
  if (connectionCheckPromise) {
    return await connectionCheckPromise
  }

  // Start a new connection check
  connectionCheckPromise = checkConnection()
  try {
    const result = await connectionCheckPromise
    return result
  } finally {
    connectionCheckPromise = null
  }
}

// Initialize connection check
ensureConnection()