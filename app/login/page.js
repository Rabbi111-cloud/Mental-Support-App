"use client"

import { useState } from "react"
import { auth } from "../../lib/firebase"
import { signInWithEmailAndPassword } from "firebase/auth"
import { useRouter } from "next/navigation"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
      router.push("/chat") // redirect to chat after login
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
