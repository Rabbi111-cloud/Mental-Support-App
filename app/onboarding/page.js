"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { auth } from "../../lib/firebase"

export default function Onboarding() {
  const router = useRouter()

  // Redirect to login if not authenticated
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) router.push("/login")
    })
    return () => unsubscribe()
  }, [])

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        background: "#f0f4f8",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          background: "white",
          padding: 36,
          borderRadius: 16,
          boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
          display: "flex",
          flexDirection: "column",
          gap: 24,
          textAlign: "center",
        }}
      >
        <h2 style={{ fontSize: 26, fontWeight: "bold", color: "#1f2937" }}>
          Welcome to Your Support Guide
        </h2>
        <p style={{ fontSize: 16, color: "#64748b" }}>
          This app is designed to help you track your emotions, get guidance, and provide support when you're feeling stressed or down.
        </p>

        <p style={{ fontSize: 14, color: "#64748b" }}>
          Before you start chatting, let's make sure you know how to use it effectively.
        </p>

        <button
          onClick={() => router.push("/chat")}
          style={{
            padding: 14,
            borderRadius: 10,
            border: "none",
            background: "#2563eb",
            color: "white",
            fontSize: 16,
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Start Chatting
        </button>
      </div>
    </div>
  )
}
