"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { auth } from "../../lib/firebase"
import { createUserWithEmailAndPassword } from "firebase/auth"

export default function Signup() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  async function handleSignup(e) {
    e.preventDefault()
    try {
      await createUserWithEmailAndPassword(auth, email, password)
      router.push("/login")
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
        background: "#f8fafc",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "white",
          padding: 30,
          borderRadius: 16,
          boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <h2 style={{ textAlign: "center", color: "#1f2937" }}>
          Create Account
        </h2>

        <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 8,
              border: "1px solid #cbd5f5",
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
              padding: 12,
              borderRadius: 8,
              border: "1px solid #cbd5f5",
            }}
          />
          <button
            type="submit"
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 8,
              border: "none",
              background: "#2563eb",
              color: "white",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Sign Up
          </button>
        </form>

        {error && (
          <p style={{ color: "#ef4444", textAlign: "center" }}>{error}</p>
        )}

        <p style={{ textAlign: "center", fontSize: 14, color: "#64748b" }}>
          Already have an account?{" "}
          <button
            onClick={() => router.push("/login")}
            style={{
              background: "transparent",
              border: "none",
              color: "#2563eb",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Login
          </button>
        </p>
      </div>
    </div>
  )
}
