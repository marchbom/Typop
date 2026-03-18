import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { User } from "@supabase/supabase-js"
import { supabase } from "../lib/supabase"

interface AuthContextType {
  user: User | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })

    // OAuth 콜백: main 프로세스에서 URL 받아서 세션 설정
    window.api.auth.onCallback((url: string) => {
      const fragment = url.split("#")[1] ?? url.split("?")[1] ?? ""
      const params = new URLSearchParams(fragment)
      const access_token = params.get("access_token")
      const refresh_token = params.get("refresh_token")
      if (access_token && refresh_token) {
        supabase.auth.setSession({ access_token, refresh_token })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = async (): Promise<void> => {
    const { data } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "typop://auth/callback",
        skipBrowserRedirect: true
      }
    })
    if (data.url) await window.api.auth.openGoogle(data.url)
  }

  const signOut = async (): Promise<void> => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
