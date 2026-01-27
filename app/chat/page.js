"use client"

import { useState, useEffect, useRef } from "react"
import { auth, db } from "../../lib/firebase"
import {
  collection,
  addDoc,
  query,
  orderBy,
  getDocs,
} from "firebase/firestore"

function getTodayKey() {
  const d = new Date()
  return d.toISOString().split("T")[0]
}

export default function Chat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const todayKey = getTodayKey()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    async function loadMessages() {
      const user = auth.currentUser
      if (!user) return

      const q = query(
        collection(db, "chats", user.uid, todayKey),
        orderBy("created_at", "asc")
      )

      const snap = await getDocs(q)
      setMessages(snap.docs.map((d) => d.data()))
    }

    loadMessages()
  }, [todayKey])

  async function sendMessage() {
    if (!input.trim()) return

    const user = auth.currentUser
    if (!user) return

    const userText = input
    setInput("")
    setLoading(true)

    setMessages((m) => [...m, { role: "user", text: userText }])

    await addDoc(collection(db, "chats", user.uid, todayKey), {
      role: "user",
      text: userText,
      created_at: new Date(),
    })

    let reply =
      "I’m here with you. You can talk freely — no pressure."

    const msg = userText.toLowerCase()

    if (
      msg.includes("depressed") ||
      msg.includes("overwhelmed") ||
      msg.includes("burnt out") ||
      msg.includes("tired of everything")
    ) {
      reply =
        "Thank you for telling me. Feeling this way doesn’t mean you’re weak — it means you’ve been carrying a lot. What feels heaviest right now?"
    } else {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText }),
      })

      const data = await res.json()
      reply = data.reply || reply
    }

    setMessages((m) => [...m, { role: "assistant", text: reply }])
    setLoading(false)

    await addDoc(collection(db, "chats", user.uid, todayKey), {
      role: "assistant",
      text: reply,
      created_at: new Date(),
    })
  }

  return (
    <main style={styles.container}>
      <h2 style={styles.title}>Today’s Check-In</h2>

      <div style={styles.chatBox}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              ...styles.bubble,
              alignSelf:
                m.role === "user" ? "flex-end" : "flex-start",
              background:
                m.role === "user"
                  ? "#c7d2fe"
                  : "#e5e7eb",
            }}
          >
            {m.text}
          </div>
        ))}

        {loading && (
          <p style={styles.typing}>Guide is typing…</p>
        )}

        <div ref={messagesEndRef} />
      </div>

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type gently…"
        style={styles.input}
        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
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
    background: "#f8fafc",
    minHeight: "100vh",
  },
  title: {
    textAlign: "center",
    color: "#334155",
  },
  chatBox: {
    height: 420,
    overflowY: "auto",
    padding: 12,
    background: "#f1f5f9",
    borderRadius: 12,
    display: "flex",
    flexDirection: "column",
  },
  bubble: {
    padding: "10px 14px",
    borderRadius: 16,
    marginBottom: 8,
    maxWidth: "80%",
    fontSize: 15,
    lineHeight: 1.5,
  },
  typing: {
    fontStyle: "italic",
    color: "#64748b",
  },
  input: {
    width: "100%",
    padding: 12,
    borderRadius: 8,
    border: "1px solid #cbd5f5",
    marginTop: 12,
  },
  button: {
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
    background: "#6366f1",
    color: "white",
    border: "none",
  },
}
