"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [auth, setAuth] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const loadFirebase = async () => {
      const firebase = await import("firebase/app")
      await import("firebase/auth")
      const app = !firebase.getApps().length
        ? firebase.initializeApp({
            apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
            authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
          })
        : firebase.getApps()[0]
      setAuth(firebase.getAuth(app))
    }
    loadFirebase()
  }, [])

  const handleLogin = async () => {
    if (!auth) return
    try {
      await auth.signInWithEmailAndPassword(auth, email, password)
      router.push("/chat")
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <main style={{ padding: 40, maxWidth: 400, margin: "auto" }}>
      <h2>Login</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ width: "100%", margin: "10px 0", padding: 8 }}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: "100%", margin: "10px 0", padding: 8 }}
      />
      <button onClick={handleLogin} style={{ padding: "10px 20px" }}>
        Login
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </main>
  )
}
