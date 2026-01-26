"use client"

import { useEffect, useState } from "react"
import { auth } from "../../lib/firebase"
import { useRouter } from "next/navigation"

export default function ChatPage() {
  const [user, setUser] = useState(null)
  const [message, setMessage] = useState("")
  const [chatLog, setChatLog] = useState([])
  const router = useRouter()

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

  if (!user) return <p>Loading...</p>

  const sendMessage = async () => {
    if (!message.trim()) return
    // Append user message
    setChatLog([...chatLog, { sender: "You", text: message }])
    const currentMessage = message
    setMessage("")

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentMessage })
      })
      const data = await res.json()
      setChatLog((prev) => [...prev, { sender: "Guide", text: data.reply }])
    } catch (err) {
      setChatLog((prev) => [...prev, { sender: "Guide", text: "Oops, something went wrong." }])
    }
  }

  return (
    <main style={{ padding: 40, maxWidth: 600, margin: "auto" }}>
      <h2>Welcome, {user.email}</h2>
      <div style={{ minHeight: 300, border: "1px solid #ccc", padding: 10, marginBottom: 10 }}>
        {chatLog.map((msg, i) => (
          <p key={i}><strong>{msg.sender}:</strong> {msg.text}</p>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={{ flex: 1, padding: 8 }}
          placeholder="Type a message..."
          onKeyDown={(e) => { if (e.key === "Enter") sendMessage() }}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </main>
  )
}
