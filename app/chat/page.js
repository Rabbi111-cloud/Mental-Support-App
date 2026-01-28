"use client"

import { useState, useEffect, useRef } from "react"
import { auth, db } from "../../lib/firebase"
import {
  collection,
  addDoc,
  query,
  orderBy,
  getDocs,
  serverTimestamp,
} from "firebase/firestore"

/* =======================
   Mood Tracker Component
======================= */
function MoodTracker({ onClose }) {
  const [mood, setMood] = useState("neutral")
  const [journal, setJournal] = useState("")
  const [saving, setSaving] = useState(false)

  const user = auth.currentUser

  const handleSave = async () => {
    if (!user) return
    setSaving(true)

    try {
      await addDoc(
        collection(db, "users", user.uid, "moods"),
        {
          mood,
          journal: journal.trim(),
          createdAt: serverTimestamp(),
        }
      )

      alert("Mood saved successfully 🌱")
      setJournal("")
      setMood("neutral")
      onClose?.()
    } catch (err) {
      console.error("Mood save error:", err)
      alert("Failed to save mood. Try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      padding: 20,
      borderRadius: 12,
      background: "#f9fafb",
      boxShadow: "0 5px 15px rgba(0,0,0,0.05)",
      maxWidth: 400,
      margin: "20px auto"
    }}>
      <h3 style={{ textAlign: "center" }}>Track Your Mood</h3>

      <label>Mood</label>
      <select
        value={mood}
        onChange={(e) => setMood(e.target.value)}
        style={{ width: "100%", padding: 8, margin: "8px 0" }}
      >
        <option value="happy">😊 Happy</option>
        <option value="neutral">😐 Neutral</option>
        <option value="sad">😢 Sad</option>
        <option value="stressed">😰 Stressed</option>
      </select>

      <label>Journal</label>
      <textarea
        value={journal}
        onChange={(e) => setJournal(e.target.value)}
        rows={4}
        placeholder="Write down your thoughts..."
        style={{ width: "100%", padding: 8, marginBottom: 12 }}
      />

      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          width: "100%",
          padding: 12,
          borderRadius: 8,
          background: "#2563eb",
          color: "white",
          fontWeight: "bold",
        }}
      >
        {saving ? "Saving..." : "Save Mood"}
      </button>

      <button
        onClick={onClose}
        style={{
          width: "100%",
          padding: 10,
          borderRadius: 8,
          background: "#f3f4f6",
          marginTop: 8,
        }}
      >
        Cancel
      </button>
    </div>
  )
}

/* =======================
        Chat Page
======================= */
export default function Chat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [showMoodTracker, setShowMoodTracker] = useState(false)
  const messagesEndRef = useRef(null)

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Load chat history (FIXED PATH)
  useEffect(() => {
    const loadMessages = async () => {
      const user = auth.currentUser
      if (!user) return

      try {
        const q = query(
          collection(db, "users", user.uid, "chats"),
          orderBy("createdAt", "asc")
        )

        const snapshot = await getDocs(q)
        setMessages(snapshot.docs.map(d => d.data()))
      } catch (e) {
        console.warn("Could not load messages:", e)
      }
    }

    loadMessages()
  }, [])

  async function sendMessage() {
    if (!input.trim()) return

    const user = auth.currentUser
    if (!user) return

    const userText = input
    setInput("")
    setLoading(true)

    setMessages(prev => [...prev, { role: "user", text: userText }])

    try {
      await addDoc(
        collection(db, "users", user.uid, "chats"),
        {
          role: "user",
          text: userText,
          createdAt: serverTimestamp(),
        }
      )
    } catch {}

    let assistantReply =
      "I’m here with you. Take your time — what’s been weighing on you?"

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText }),
      })
      const data = await res.json()
      assistantReply = data.reply || assistantReply
    } catch {}

    setMessages(prev => [...prev, { role: "assistant", text: assistantReply }])

    try {
      await addDoc(
        collection(db, "users", user.uid, "chats"),
        {
          role: "assistant",
          text: assistantReply,
          createdAt: serverTimestamp(),
        }
      )
    } catch {}

    setLoading(false)
  }

  return (
    <main style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h2 style={{ textAlign: "center" }}>💬 Support Chat</h2>

      {showMoodTracker ? (
        <MoodTracker onClose={() => setShowMoodTracker(false)} />
      ) : (
        <>
          <button
            onClick={() => setShowMoodTracker(true)}
            style={{
              marginBottom: 12,
              padding: 10,
              borderRadius: 8,
              background: "#10b981",
              color: "white",
              width: "100%",
              fontWeight: "bold",
            }}
          >
            Track Mood / Journal
          </button>

          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: 12,
              height: 400,
              overflowY: "auto",
              padding: 10,
              background: "#fff",
            }}
          >
            {messages.map((m, i) => (
              <div key={i} style={{
                marginBottom: 8,
                padding: "8px 12px",
                borderRadius: 20,
                background: m.role === "user" ? "#dbeafe" : "#e5e7eb",
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              }}>
                {m.text}
              </div>
            ))}

            {loading && (
              <p style={{ fontStyle: "italic", color: "gray" }}>
                Guide is typing...
              </p>
            )}
            <div ref={messagesEndRef} />
          </div>

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            style={{ width: "100%", padding: 12, marginTop: 8 }}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />

          <button
            onClick={sendMessage}
            style={{
              width: "100%",
              padding: 12,
              marginTop: 8,
              background: "#2563eb",
              color: "white",
              fontWeight: "bold",
              borderRadius: 8,
            }}
          >
            Send
          </button>
        </>
      )}
    </main>
  )
}
