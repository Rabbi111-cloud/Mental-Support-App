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

  // 🧠 Session memory (lightweight, safe)
  const [sessionContext, setSessionContext] = useState({
    work: false,
    money: false,
    school: false,
    family: false,
    relationship: false,
    health: false,
    loneliness: false,
    uncertainty: false,
    burnout: false,
  })

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
      "I’m here with you. Take your time — what’s been weighing on you?"

    const msgLower = userText.toLowerCase()

    // 🧠 Update session context
    setSessionContext((prev) => ({
      ...prev,
      work:
        prev.work ||
        msgLower.includes("work") ||
        msgLower.includes("job") ||
        msgLower.includes("boss") ||
        msgLower.includes("career"),
      money:
        prev.money ||
        msgLower.includes("money") ||
        msgLower.includes("bills") ||
        msgLower.includes("rent") ||
        msgLower.includes("debt"),
      school:
        prev.school ||
        msgLower.includes("school") ||
        msgLower.includes("exam") ||
        msgLower.includes("study"),
      family:
        prev.family ||
        msgLower.includes("family") ||
        msgLower.includes("parents"),
      relationship:
        prev.relationship ||
        msgLower.includes("relationship") ||
        msgLower.includes("breakup"),
      health:
        prev.health ||
        msgLower.includes("health") ||
        msgLower.includes("sick") ||
        msgLower.includes("tired"),
      loneliness:
        prev.loneliness ||
        msgLower.includes("lonely") ||
        msgLower.includes("alone"),
      uncertainty:
        prev.uncertainty ||
        msgLower.includes("future") ||
        msgLower.includes("lost"),
      burnout:
        prev.burnout ||
        msgLower.includes("burnt out") ||
        msgLower.includes("exhausted") ||
        msgLower.includes("overwhelmed"),
    }))

    try {
      try {
        await addDoc(collection(db, "chats"), {
          userId: user.uid,
          role: "user",
          text: userText,
          created_at: new Date(),
        })
      } catch {}

      if (
        msgLower.includes("depressed") ||
        msgLower.includes("depression") ||
        msgLower.includes("can't cope") ||
        msgLower.includes("too much")
      ) {
        assistantReply =
          "Thank you for telling me this. Feeling depressed can be very heavy. You don’t need to fix everything right now. Would you like to talk about what’s been draining you the most?"
      } else if (sessionContext.work) {
        assistantReply =
          "Earlier you mentioned work has been difficult. What part of it has been weighing on you the most?"
      } else if (sessionContext.money) {
        assistantReply =
          "Money stress can feel constant and exhausting. What’s been worrying you most financially?"
      } else if (sessionContext.school) {
        assistantReply =
          "School pressure can build up quietly. What has been most stressful lately?"
      } else if (sessionContext.family) {
        assistantReply =
          "Family situations can be emotionally heavy. Would you like to share what’s been happening?"
      } else if (sessionContext.relationship) {
        assistantReply =
          "Relationships can deeply affect how we feel. What’s been hurting the most?"
      } else if (sessionContext.health) {
        assistantReply =
          "Health challenges can drain both energy and hope. How has it been affecting you?"
      } else if (sessionContext.loneliness) {
        assistantReply =
          "Feeling lonely can be very painful. When do you notice it the most?"
      } else if (sessionContext.uncertainty) {
        assistantReply =
          "Feeling lost or uncertain about the future can be overwhelming. What feels most unclear right now?"
      } else if (sessionContext.burnout) {
        assistantReply =
          "Burnout can make everything feel heavy. What does exhaustion look like for you lately?"
      } else {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: userText }),
        })
        const data = await res.json()
        assistantReply = data.reply || assistantReply
      }
    } catch {
      assistantReply =
        "I’m here with you. Something didn’t work just now, but you’re not alone."
    } finally {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: assistantReply },
      ])
      setLoading(false)

      try {
        await addDoc(collection(db, "chats"), {
          userId: user.uid,
          role: "assistant",
          text: assistantReply,
          created_at: new Date(),
        })
      } catch {}
    }
  }

  return (
    <main style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
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
        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
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

      {/* 🔙 Back & 🚪 Logout */}
      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <button
          onClick={() => history.back()}
          style={{
            flex: 1,
            padding: 10,
            borderRadius: 6,
            border: "1px solid #ccc",
          }}
        >
          Back
        </button>

        <button
          onClick={async () => {
            await auth.signOut()
            window.location.href = "/login"
          }}
          style={{
            flex: 1,
            padding: 10,
            borderRadius: 6,
            background: "#ef4444",
            color: "white",
            border: "none",
          }}
        >
          Logout
        </button>
      </div>
    </main>
  )
}
