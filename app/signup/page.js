"use client"

import { useState } from "react"
import { auth } from "../../lib/firebase"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { useRouter } from "next/navigation"

export default function Signup() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSignup = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password)
      router.push("/chat") // redirect to chat after signup
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <main style={{ padding: 40, maxWidth: 400, margin: "auto" }}>
      <h2>Sign Up</h2>
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
      <button onClick={handleSignup} style={{ padding: "10px 20px" }}>
        Sign Up
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </main>
  )
}
