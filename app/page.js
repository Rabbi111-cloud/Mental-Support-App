"use client"
import { useEffect, useState } from "react"
import { auth } from "../lib/firebase"
import { useRouter } from "next/navigation"

export default function ChatPage() {
  const [user, setUser] = useState(null)
  const [message, setMessage] = useState("")
  const [chatLog, setChatLog] = useState([])
  const [stage, setStage] = useState("early")
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      if (!u) router.push("/login")
      else setUser(u)
    })
    return () => unsubscribe()
  }, [router])

  if (!user) return <p style={{ padding: 40 }}>Loading...</p>

  const sendMessage = async () => {
    if (!message.trim()) return

    setChatLog((prev) => [...prev, { sender: "You", text: message }])
    const currentMessage = message
    setMessage("")

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentMessage })
      })

      const data = await res.json()
      setStage(data.stage || stage)
      setChatLog((prev) => [...prev, { sender: "Guide", text: data.reply }])
    } catch (err) {
      setChatLog((prev) => [
        ...prev,
        { sender: "Guide", text: "Oops, something went wrong." }
      ])
    }
  }

  return (
    <main style={{ padding: 40, maxWidth: 600, margin: "auto" }}>
      <h2>Welcome, {user.email}</h2>
      <p>Conversation stage: <strong>{stage}</strong></p>
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
      </div>

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
        <button onClick={sendMessage}>Send</button>
      </div>

      <button
        style={{ marginTop: 10 }}
        onClick={() => alert("If you need human help, please contact a trusted friend, counselor, or hotline.")}
      >
        Need human help?
      </button>
    </main>
  )
}
