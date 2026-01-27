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

export default function Chat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Load chat history
  useEffect(() => {
    async function loadMessages() {
      const user = auth.currentUser
      if (!user) return

      try {
        const q = query(
          collection(db, "chats"),
          orderBy("created_at", "asc")
        )
        const snapshot = await getDocs(q)
        const data = snapshot.docs.map((d) => d.data())
        setMessages(data)
      } catch (e) {
        console.warn("Could not load messages:", e.message)
      }
    }

    loadMessages()
  }, [])

  async function sendMessage() {
    if (!input.trim()) return

    const userText = input
    setInput("")
    setLoading(true)

    // Show user message immediately
    setMessages((prev) => [
      ...prev,
      { role: "user", text: userText },
    ])

    const user = auth.currentUser
    if (!user) {
      setLoading(false)
      return
    }

    let assistantReply =
      "I’m here with you. Take your time — what’s on your mind?"

    try {
      // Save user message (FAIL-SAFE)
      try {
        await addDoc(collection(db, "chats"), {
          userId: user.uid,
          role: "user",
          text: userText,
          created_at: new Date(),
        })
      } catch (e) {
        console.warn("User message not saved:", e.message)
      }

      const msgLower = userText.toLowerCase()

      // Gentle safety handling
      if (
        msgLower.includes("i feel worse") ||
        msgLower.includes("can't cope") ||
        msgLower.includes("too much for me")
      ) {
        assistantReply =
          "I’m really glad you said that. Let’s slow this moment down together. You don’t have to carry everything at once."
      } else {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: userText }),
        })

        const data = await res.json()
        assistantReply = data.reply || assistantReply
      }
    } catch (err) {
      assistantReply =
        "I’m here with you. Something didn’t work just now, but you’re not alone."
    } finally {
      // ✅ UI ALWAYS recovers
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: assistantReply },
      ])
      setLoading(false)

      // Save assistant message (FAIL-SAFE)
      try {
        await addDoc(collection(db, "chats"), {
          userId: user.uid,
          role: "assistant",
          text: assistantReply,
          created_at: new Date(),
        })
      } catch (e) {
        console.warn("Assistant message not saved:", e.message)
      }
    }
  }

  return (
    <main
      style={{
        maxWidth: 600,
        margin: "0 auto",
        padding: 20,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <h2>Support Chat</h2>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 10,
          height: 400,
          overflowY: "auto",
          padding: 10,
          background: "#fafafa",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              marginBottom: 8,
              padding: "8px 12px",
              borderRadius: 12,
              maxWidth: "80%",
              background:
                m.role === "user" ? "#dbeafe" : "#e5e7eb",
              alignSelf:
                m.role === "user"
                  ? "flex-end"
                  : "flex-start",
            }}
          >
            {m.text}
          </div>
        ))}

        {loading && (
          <p style={{ color: "gray", fontStyle: "italic" }}>
            Guide is typing...
          </p>
        )}

        <div ref={messagesEndRef} />
      </div>

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your message..."
        style={{
          width: "100%",
          padding: 10,
          borderRadius: 6,
          border: "1px solid #ccc",
          marginTop: 10,
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") sendMessage()
        }}
      />

      <button
        onClick={sendMessage}
        style={{
          width: "100%",
          padding: 12,
          marginTop: 8,
          borderRadius: 6,
          background: "#2563eb",
          color: "white",
        }}
      >
        Send
      </button>
    </main>
  )
}
