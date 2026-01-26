 "use client"

import { useEffect, useRef, useState } from "react"
import { auth } from "../../lib/firebase"
import { useRouter } from "next/navigation"

export default function ChatPage() {
  const [user, setUser] = useState(null)
  const [message, setMessage] = useState("")
  const [chatLog, setChatLog] = useState([])
  const router = useRouter()
  const bottomRef = useRef(null)

  // Redirect if not logged in
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      if (!u) {
        router.push("/login")
      } else {
        setUser(u)
      }
    })
    return () => unsubscribe()
  }, [router])

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatLog])

  if (!user) return <p>Loading...</p>

  const sendMessage = async () => {
    if (!message.trim()) return

    const currentMessage = message
    setMessage("")

    // Add user message
    setChatLog((prev) => [...prev, { sender: "You", text: currentMessage }])

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentMessage })
      })

      const data = await res.json()

      setChatLog((prev) => [
        ...prev,
        { sender: "Guide", text: data.reply }
      ])
    } catch {
      setChatLog((prev) => [
        ...prev,
        {
          sender: "Guide",
          text: "I’m here with you. Something went wrong, but you’re not alone."
        }
      ])
    }
  }

  return (
    <main style={{ padding: 40, maxWidth: 600, margin: "auto" }}>
      <h2>Welcome, {user.email}</h2>

      {/* Chat box */}
      <div
        style={{
          minHeight: 300,
          border: "1px solid #ccc",
          padding: 10,
          marginBottom: 10,
          overflowY: "auto"
        }}
      >
        {chatLog.map((msg, i) => (
          <p key={i}>
            <strong>{msg.sender}:</strong> {msg.text}
          </p>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: 10 }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={{ flex: 1, padding: 8 }}
          placeholder="Type a message..."
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage()
          }}
        />
        <button onClick={sendMessage} disabled={!message.trim()}>
          Send
        </button>
      </div>

      {/* Human help button */}
      <div style={{ marginTop: 20 }}>
        <button
          onClick={() =>
            alert(
              "If you feel overwhelmed or unsafe, please reach out to a trusted adult, family member, teacher, or local emergency services."
            )
          }
        >
          Need human help?
        </button>
      </div>

      {/* Disclaimer */}
      <p style={{ marginTop: 20, fontSize: 12, color: "#666" }}>
        This chat provides emotional encouragement only and is not a replacement
        for professional mental health care.
      </p>
    </main>
  )
}
