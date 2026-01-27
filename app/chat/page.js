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

  // Scroll to bottom automatically
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Load chat history from Firebase
  async function loadMessages() {
    const user = auth.currentUser
    if (!user) return
    const q = query(collection(db, "chats"), orderBy("created_at", "asc"))
    const snapshot = await getDocs(q)
    const data = snapshot.docs.map((d) => d.data())
    setMessages(data)
  }

  useEffect(() => {
    loadMessages()
  }, [])

  // Send a message
  async function sendMessage() {
    if (!input.trim()) return
    const userText = input
    setInput("")
    setLoading(true)

    // Show user message immediately
    setMessages((prev) => [...prev, { role: "user", text: userText }])

    const user = auth.currentUser
    if (!user) {
      setLoading(false)
      return
    }

    // Save user message to Firebase
    await addDoc(collection(db, "chats"), {
      userId: user.uid,
      role: "user",
      text: userText,
      created_at: new Date(),
    })

    let botReply = ""

    try {
      const msgLower = userText.toLowerCase()

      // -----------------------------
      // Safety handling: "I feel worse"
      if (
        msgLower.includes("i feel worse") ||
        msgLower.includes("can't cope") ||
        msgLower.includes("too much for me")
      ) {
        botReply =
          "I’m really glad you told me this. Take a slow breath. You don’t have to solve everything right now. Would you like to talk about what just changed, or focus on calming your body first?"
      } else {
        // -----------------------------
        // Call API
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: userText }),
        })

        if (!res.ok) {
          const text = await res.text()
          botReply = "AI server error: " + text
        } else {
          const data = await res.json()
          botReply = data.reply || "🤖 AI did not reply."
        }
      }
    } catch (err) {
      botReply = "❌ API ERROR: " + err.message
    } finally {
      // -----------------------------
      // Show bot message and clear loading
      setMessages((prev) => [...prev, { role: "bot", text: botReply }])
      setLoading(false)

      // Save bot message to Firebase
      await addDoc(collection(db, "chats"), {
        userId: user.uid,
        role: "bot",
        text: botReply,
        created_at: new Date(),
      })
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
              background: m.role === "user" ? "#dbeafe" : "#e5e7eb",
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
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

      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
        <button
          onClick={() => history.back()}
          style={{ padding: 10, flex: 1 }}
        >
          Back
        </button>
        <button
          onClick={async () => {
            await auth.signOut()
            window.location.href = "/login"
          }}
          style={{
            padding: 10,
            flex: 1,
            background: "#ef4444",
            color: "white",
          }}
        >
          Logout
        </button>
      </div>
    </main>
  )
}
