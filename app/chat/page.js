
"use client"
import { useState, useEffect } from "react"
import { auth, db } from "../../lib/firebase"
import {
  collection,
  addDoc,
  query,
  orderBy,
  where,
  getDocs,
} from "firebase/firestore"

export default function Chat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  async function loadMessages(user) {
    const q = query(
      collection(db, "chats"),
      where("userId", "==", user.uid),
      orderBy("created_at", "asc")
    )
    const snapshot = await getDocs(q)
    const data = snapshot.docs.map((d) => d.data())
    setMessages(data)
  }

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) loadMessages(user)
    })
    return () => unsub()
  }, [])

  async function sendMessage() {
    if (!input.trim() || loading) return

    const user = auth.currentUser
    if (!user) {
      alert("Please log in again.")
      return
    }

    const userText = input
    setInput("")
    setLoading(true)

    setMessages((prev) => [...prev, { role: "user", text: userText }])

    try {
      await addDoc(collection(db, "chats"), {
        userId: user.uid,
        role: "user",
        text: userText,
        created_at: new Date(),
      })

      let botReply = ""
      const msgLower = userText.toLowerCase()

      // 🛑 SAFETY HANDLING
      if (
        msgLower.includes("i feel worse") ||
        msgLower.includes("can't cope") ||
        msgLower.includes("too much for me")
      ) {
        botReply =
          "I’m really glad you told me this. Take a slow breath with me. You don’t have to solve everything right now. Would you like to talk about what made things feel worse, or focus on calming your mind first?"
      } else {
        const res = await fetch("/api/chatbot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: userText }),
        })

        const data = await res.json()
        botReply = data.reply || "I’m here with you."
      }

      setMessages((prev) => [...prev, { role: "bot", text: botReply }])

      await addDoc(collection(db, "chats"), {
        userId: user.uid,
        role: "bot",
        text: botReply,
        created_at: new Date(),
      })
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text:
            "I’m having trouble responding right now, but I’m still here with you.",
        },
      ])
    } finally {
      // 🔴 THIS GUARANTEES NO INFINITE TYPING
      setLoading(false)
    }
  }

  return (
    <main style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h2>Support Chat</h2>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 10,
          height: 350,
          overflowY: "auto",
          padding: 10,
          background: "#fafafa",
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              marginBottom: 8,
              padding: "8px 12px",
              borderRadius: 12,
              background: m.role === "user" ? "#dbeafe" : "#e5e7eb",
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

      <button onClick={() => history.back()} style={{ marginTop: 10 }}>
        Back
      </button>

      <button
        onClick={async () => {
          await auth.signOut()
          window.location.href = "/login"
        }}
        style={{
          marginTop: 10,
          background: "#ef4444",
          color: "white",
          padding: 10,
        }}
      >
        Logout
      </button>
    </main>
  )
}

