import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/play'

  if (code) {
    const supabase = await createClient()
    if (!supabase) {
      // Supabase not configured, redirect to play as guest
      return NextResponse.redirect(`${origin}/play`)
    }
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return to home page on error
  return NextResponse.redirect(`${origin}/?error=auth`)
}
