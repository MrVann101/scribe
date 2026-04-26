'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { BookOpen } from 'lucide-react'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleLogin = async () => {
    setLoading(true)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${baseUrl}/api/auth/callback?next=/dashboard`
      }
    })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg-base p-4">
      <div className="w-full max-w-sm flex flex-col items-center">
        <div className="mb-8 flex flex-col items-center">
          <div className="h-16 w-16 bg-accent-blue/10 rounded-2xl flex items-center justify-center mb-4 text-accent-blue border border-accent-blue/20">
            <BookOpen className="h-8 w-8" />
          </div>
          <h1 className="font-display text-3xl font-bold text-text-primary">Scribe</h1>
          <p className="text-text-secondary mt-2 text-center">Your AI-powered study companion</p>
        </div>
        
        <Button 
          onClick={handleLogin} 
          loading={loading}
          className="w-full h-12 text-base"
        >
          Sign in with Google
        </Button>
      </div>
    </div>
  )
}
