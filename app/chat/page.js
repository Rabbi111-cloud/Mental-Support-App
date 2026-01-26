"use client"

import { useState } from "react"

export default function Chat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  async function sendMessage() {
    if (!input.trim()) return

    const userMessage = input
    setInput("")
    setLoading(true)

    setMessages((prev) => [...prev, { role: "user", text: userMessage }])

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage })
      })

      const data = await res.json()

      setMessages((prev) => [
        ...prev,
        { role: "bot", text: data.reply }
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "I’m here with you. Something went wrong." }
      ])
    }

    setLoading(false)
  }

  return (
    <main style={{ padding: 20, maxWidth: 600, margin: "0 auto" }}>
      <h2>Support Chat</h2>

      <div
        style={{
          border: "1px solid #ddd",
          padding: 10,
          height: 300,
          overflowY: "auto",
          marginBottom: 10
        }}
      >
        {messages.map((m, i) => (
          <p key={i}>
            <strong>{m.role === "user" ? "You" : "Guide"}:</strong>{" "}
            {m.text}
          </p>
        ))}

        {loading && <p><em>Guide is typing…</em></p>}
      </div>

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type how you’re feeling..."
        style={{ width: "100%", padding: 8 }}
      />

      <button
        onClick={sendMessage}
        style={{ marginTop: 10, padding: 8, width: "100%" }}
      >
        Send
      </button>
    </main>
  )
}
