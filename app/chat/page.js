"use client"

import { useEffect, useState } from "react"
import { auth } from "../../lib/firebase"
import { useRouter } from "next/navigation"

export default function ChatPage() {
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      if (!u) {
        router.push("/login") // Redirect if not logged in
      } else {
        setUser(u)
      }
    })
    return () => unsubscribe()
  }, [router])

  if (!user) return <p>Loading...</p>

  return (
    <main style={{ padding: 40, maxWidth: 600, margin: "auto" }}>
      <h2>Welcome, {user.email}</h2>
      <p>This is where your AI-guided chatbot will go.</p>
      {/* Chatbot component will be added here later */}
    </main>
  )
}
