'use client'

import { useState } from 'react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showLoginForm, setShowLoginForm] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const supabaseAvailable = isSupabaseConfigured()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) {
      setError('Authentication is not configured. Please play as guest.')
      return
    }
    setLoading(true)
    setError(null)

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        setError('Check your email for a confirmation link!')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        router.push('/play')
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    if (!supabase) {
      setError('Authentication is not configured. Please play as guest.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  // Show initial choice screen (Play Now vs Sign In)
  if (!showLoginForm) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center mb-8">
          <h1
            className="text-5xl mb-2"
            style={{ fontFamily: "'Fredoka One', cursive", color: '#FF8BA7' }}
          >
            ABC Fun Cards
          </h1>
          <p className="text-lg text-gray-600">Learn letters with fun!</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md">
          {/* Primary action - Play Now */}
          <Link
            href="/play"
            className="block w-full py-5 rounded-xl text-white text-2xl font-bold text-center no-underline transition-transform active:scale-95"
            style={{
              fontFamily: "'Fredoka One', cursive",
              backgroundColor: '#5FD3BC',
              boxShadow: '0 5px 0 rgba(0,0,0,0.1)',
            }}
          >
            Play Now!
          </Link>

          <p className="text-center text-gray-500 text-sm mt-3 mb-6">
            No account needed - start learning right away!
          </p>

          {supabaseAvailable && (
            <>
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>

              {/* Secondary action - Sign In */}
              <button
                onClick={() => setShowLoginForm(true)}
                className="w-full py-4 rounded-xl bg-white border-2 border-[#A0C4FF] text-[#A0C4FF] text-lg font-semibold cursor-pointer transition-transform active:scale-95"
                style={{ fontFamily: "'Fredoka One', cursive" }}
              >
                Sign In to Save Progress
              </button>
            </>
          )}
        </div>

        <p className="mt-8 text-sm text-gray-500 text-center max-w-md">
          {supabaseAvailable
            ? 'Create an account to save progress across devices and never lose your stars!'
            : 'Progress is saved locally on this device.'}
        </p>
      </div>
    )
  }

  // Show login/signup form
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <h1
          className="text-5xl mb-2"
          style={{ fontFamily: "'Fredoka One', cursive", color: '#FF8BA7' }}
        >
          ABC Fun Cards
        </h1>
        <p className="text-lg text-gray-600">Learn letters with fun!</p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md">
        <button
          onClick={() => setShowLoginForm(false)}
          className="mb-4 text-[#5FD3BC] font-bold text-sm cursor-pointer bg-transparent border-none"
        >
          ← Back
        </button>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Parent's Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-[#A0C4FF] focus:border-[#5FD3BC] outline-none text-lg"
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-[#A0C4FF] focus:border-[#5FD3BC] outline-none text-lg"
              required
              minLength={6}
            />
          </div>

          {error && (
            <p className={`text-center ${error.includes('Check your email') ? 'text-green-600' : 'text-red-500'}`}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl text-white text-xl font-bold cursor-pointer disabled:opacity-50 transition-transform active:scale-95"
            style={{
              fontFamily: "'Fredoka One', cursive",
              backgroundColor: '#5FD3BC',
              boxShadow: '0 5px 0 rgba(0,0,0,0.1)',
            }}
          >
            {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-[#FF8BA7] underline cursor-pointer bg-transparent border-none text-base"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>

        <div className="mt-6 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">or</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="mt-4 w-full py-4 rounded-xl bg-white border-2 border-gray-300 text-lg font-semibold cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 transition-transform active:scale-95"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>
      </div>

      <p className="mt-8 text-sm text-gray-500 text-center max-w-md">
        Sign in to save progress across devices and never lose your stars!
      </p>
    </div>
  )
}
