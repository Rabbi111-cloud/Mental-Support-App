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
      "I’m here with you. Take your time — what’s been weighing on you?"

    const msgLower = userText.toLowerCase()

    // ----------------------------
    // 🧠 Update session context (stress sources)
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
        msgLower.includes("debt") ||
        msgLower.includes("financial"),

      school:
        prev.school ||
        msgLower.includes("school") ||
        msgLower.includes("exam") ||
        msgLower.includes("study") ||
        msgLower.includes("college") ||
        msgLower.includes("university"),

      family:
        prev.family ||
        msgLower.includes("family") ||
        msgLower.includes("parents") ||
        msgLower.includes("home"),

      relationship:
        prev.relationship ||
        msgLower.includes("relationship") ||
        msgLower.includes("partner") ||
        msgLower.includes("breakup") ||
        msgLower.includes("marriage"),

      health:
        prev.health ||
        msgLower.includes("health") ||
        msgLower.includes("sick") ||
        msgLower.includes("tired") ||
        msgLower.includes("illness"),

      loneliness:
        prev.loneliness ||
        msgLower.includes("alone") ||
        msgLower.includes("lonely") ||
        msgLower.includes("isolated"),

      uncertainty:
        prev.uncertainty ||
        msgLower.includes("future") ||
        msgLower.includes("uncertain") ||
        msgLower.includes("lost"),

      burnout:
        prev.burnout ||
        msgLower.includes("burnt out") ||
        msgLower.includes("exhausted") ||
        msgLower.includes("overwhelmed"),
    }))

    try {
      // Save user message (fail-safe)
      try {
        await addDoc(collection(db, "chats"), {
          userId: user.uid,
          role: "user",
          text: userText,
          created_at: new Date(),
        })
      } catch {}

      // ----------------------------
      // 🌱 Gentle emotional safety handling
      if (
        msgLower.includes("depressed") ||
        msgLower.includes("depression") ||
        msgLower.includes("can't cope") ||
        msgLower.includes("too much")
      ) {
        assistantReply =
          "Thank you for telling me this. Feeling depressed can be very heavy, especially when it builds up over time. You don’t need to fix everything right now. Would you like to talk about what has been draining you the most lately?"
      }

      // ----------------------------
      // 🌍 Stress-induced depression causes
      else if (sessionContext.work) {
        assistantReply =
          "Earlier you mentioned work has been difficult. When work starts affecting your mood, it can slowly wear you down. Is it the pressure, lack of support, or feeling stuck that’s been hardest?"
      } else if (sessionContext.money) {
        assistantReply =
          "Money stress can be incredibly heavy and constant. Worrying about bills or stability can leave very little room to breathe. What part of the financial pressure has been weighing on you most?"
      } else if (sessionContext.school) {
        assistantReply =
          "School pressure can feel overwhelming, especially when expectations keep piling up. Are the demands, deadlines, or fear of failure making things harder right now?"
      } else if (sessionContext.family) {
        assistantReply =
          "Family situations can be emotionally complicated. When home feels tense or heavy, it can affect everything else. Would you like to share what’s been happening?"
      } else if (sessionContext.relationship) {
        assistantReply =
          "Relationships can deeply affect how we feel about ourselves. When something feels off or painful there, it can linger. What has been weighing on your heart?"
      } else if (sessionContext.health) {
        assistantReply =
          "Health struggles can drain both the body and the mind. Feeling unwell for a while can make everything feel harder. How has your health been affecting your daily life?"
      } else if (sessionContext.loneliness) {
        assistantReply =
          "Feeling lonely, even around others, can be very painful. You deserve connection and understanding. When do you feel the loneliness most?"
      } else if (sessionContext.uncertainty) {
        assistantReply =
          "Not knowing what’s next can create a lot of anxiety and sadness. Feeling lost doesn’t mean you’re failing — it means you’re human. What feels most uncertain right now?"
      } else if (sessionContext.burnout) {
        assistantReply =
          "Burnout can make even simple things feel exhausting. It often happens when you’ve been pushing yourself for too long. What does exhaustion look like for you lately?"
      }

      // ----------------------------
      // 🤖 AI fallback (only if no local response)
      else {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userText,
          }),
        })

        const data = await res.json()
        assistantReply = data.reply || assistantReply
      }
    } catch {
      assistantReply =
        "I’m here with you. Something didn’t work just now, but you’re not alone."
    } finally {
      // UI always recovers
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: assistantReply },
      ])
      setLoading(false)

      // Save assistant message (fail-safe)
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
