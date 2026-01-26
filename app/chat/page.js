"use client"

import { useState } from "react"

export default function Chat() {
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Hi 🙂 I’m really glad you’re here. You can talk to me about anything that’s been weighing on you."
    }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  async function sendMessage() {
    if (!input.trim()) return

    const userText = input
    setInput("")
    setLoading(true)

    setMessages((prev) => [...prev, { role: "user", text: userText }])

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText })
      })

      const data = await res.json()

      setMessages((prev) => [...prev, { role: "bot", text: data.reply }])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "I’m here with you. Something went wrong, but you’re not alone." }
      ])
    }

    setLoading(false)
  }

  return (
    <main style={styles.container}>
      <h2 style={styles.header}>Support Chat</h2>

      <div style={styles.chatBox}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              ...styles.bubble,
              ...(m.role === "user" ? styles.userBubble : styles.botBubble)
            }}
          >
            {m.text}
          </div>
        ))}

        {loading && <div style={styles.typing}>Guide is typing…</div>}
      </div>

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type how you’re feeling..."
        style={styles.input}
      />

      <button onClick={sendMessage} style={styles.button}>
        Send
      </button>
    </main>
  )
}

const styles = {
  container: {
    maxWidth: 600,
    margin: "0 auto",
    padding: 20,
    fontFamily: "system-ui"
  },
  header: {
    textAlign: "center",
    marginBottom: 10
  },
  chatBox: {
    border: "1px solid #ddd",
    borderRadius: 10,
    padding: 10,
    height: 350,
    overflowY: "auto",
    background: "#fafafa",
    marginBottom: 10
  },
  bubble: {
    padding: "8px 12px",
    borderRadius: 12,
    marginBottom: 8,
    maxWidth: "85%",
    lineHeight: 1.4
  },
  userBubble: {
    background: "#dbeafe",
    alignSelf: "flex-end",
    marginLeft: "auto"
  },
  botBubble: {
    background: "#e5e7eb",
    alignSelf: "flex-start"
  },
  typing: {
    fontStyle: "italic",
    color: "gray",
    marginTop: 5
  },
  input: {
    width: "100%",
    padding: 10,
    borderRadius: 6,
    border: "1px solid #ccc"
  },
  button: {
    width: "100%",
    padding: 10,
    marginTop: 8,
    borderRadius: 6,
    border: "none",
    background: "#2563eb",
    color: "white",
    fontWeight: "bold"
  }
}
