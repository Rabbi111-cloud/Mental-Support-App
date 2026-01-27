"use client"
import { useState } from "react"

export default function Chat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")

  function sendMessage() {
    console.log("sendMessage CALLED") // 🔴 DEBUG

    setMessages((prev) => [
      ...prev,
      { role: "bot", text: "✅ Button works. Function is running." },
    ])
  }

  return (
    <main style={{ padding: 40 }}>
      <h2>Support Chat (DEBUG)</h2>

      <div style={{ minHeight: 100, border: "1px solid #ccc", padding: 10 }}>
        {messages.map((m, i) => (
          <p key={i}>{m.text}</p>
        ))}
      </div>

      <button
        onClick={sendMessage}
        style={{ marginTop: 20, padding: 10 }}
      >
        Send Test
      </button>
    </main>
  )
}
