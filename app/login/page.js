"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { auth } from "../../lib/firebase"
import { signInWithEmailAndPassword } from "firebase/auth"

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  async function handleLogin(e) {
    e.preventDefault()
    try {
      await signInWithEmailAndPassword(auth, email, password)
      // ✅ Redirect to onboarding instead of chat
      router.push("/onboarding")
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f0f4f8",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "white",
          padding: 36,
          borderRadius: 16,
          boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <h2 style={{ textAlign: "center", color: "#1f2937", fontSize: 24, fontWeight: "bold" }}>
          Welcome Back
        </h2>
        <p style={{ textAlign: "center", color: "#64748b", fontSize: 14 }}>
          Login to continue to your Support Guide
        </p>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 10,
              border: "1px solid #cbd5f5",
              fontSize: 15,
              outline: "none",
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 10,
              border: "1px solid #cbd5f5",
              fontSize: 15,
              outline: "none",
            }}
          />
          <button
            type="submit"
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 10,
              border: "none",
              background: "#2563eb",
              color: "white",
              fontWeight: "bold",
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            Login
          </button>
        </form>

        {error && (
          <p style={{ color: "#ef4444", textAlign: "center", fontSize: 14 }}>{error}</p>
        )}

        <p style={{ textAlign: "center", fontSize: 14, color: "#64748b" }}>
          Don't have an account?{" "}
          <button
            onClick={() => router.push("/signup")}
            style={{
              background: "transparent",
              border: "none",
              color: "#2563eb",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  )
}
