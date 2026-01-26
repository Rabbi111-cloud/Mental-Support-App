"use client"

import { useEffect, useState } from "react"
import { auth } from "../lib/firebase"
import { useRouter } from "next/navigation"

export default function ChatPage() {
  const [user, setUser] = useState(null)
  const [message, setMessage] = useState("")
  const [chatLog, setChatLog] = useState([])
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      if (!u) router.push("/login")
      else setUser(u)
    })
    return () => unsubscribe()
  }, [router])

  if (!user) return <p style={{ padding: 40 }}>Loading…</p>

  const sendMessage = async () => {
    if (!message.trim()) return

    setChatLog((prev) => [...prev, { sender: "You", text: message }])
    const current = message
    setMessage("")

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: current })
      })
      const data = await res.json()
      setChatLog((prev) => [...prev, { sender: "Guide", text: data.reply }])
    } catch {
      setChatLog((prev) => [
        ...prev,
        {
          sender: "Guide",
          text:
            "I’m here with you. Something went wrong, but we can keep talking."
        }
      ])
    }
  }

  return (
    <main style={{ padding: 30, maxWidth: 650, margin: "auto" }}>
      <h2>Welcome 🤍</h2>
      <p style={{ color: "#555", marginBottom: 10 }}>
        This space is for you. Take your time — there’s no rush.
      </p>

      <div
        style={{
          minHeight: 320,
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: 12,
          marginBottom: 12,
          background: "#fafafa"
        }}
      >
        {chatLog.map((msg, i) => (
          <p key={i} style={{ marginBottom: 8 }}>
            <strong>{msg.sender}:</strong> {msg.text}
          </p>
        ))}
      </div>

      <p style={{ fontSize: 13, color: "#777", marginBottom: 6 }}>
        Tip: If things feel intense, try taking one slow breath before typing.
      </p>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="You can type whatever feels easiest to say…"
          style={{
            flex: 1,
            padding: 10,
            borderRadius: 6,
            border: "1px solid #ccc"
          }}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage} style={{ padding: "0 16px" }}>
          Send
        </button>
      </div>

      <div style={{ marginTop: 16 }}>
        <button
          onClick={() => router.push("/support")}
          style={{
            background: "transparent",
            color: "#555",
            border: "none",
            textDecoration: "underline",
            cursor: "pointer"
          }}
        >
          Need human help?
        </button>
      </div>
    </main>
  )
}

