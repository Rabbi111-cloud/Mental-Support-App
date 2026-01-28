"use client"

import { useState, useEffect, useRef } from "react"
import { auth, db } from "../../lib/firebase"
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore"

/* =======================
   Mood Tracker Component
======================= */
function MoodTracker({ onClose, moodHistory }) {
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
          note: journal.trim(),
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

  const lastMood = moodHistory?.[0]

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.3)",
        zIndex: 50,
        padding: 16,
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: 12,
          maxWidth: 400,
          width: "100%",
          padding: 24,
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        }}
      >
        <h3 style={{ textAlign: "center", fontSize: 20, fontWeight: "bold", marginBottom: 16 }}>
          Track Your Mood
        </h3>

        <label>Mood</label>
        <select
          value={mood}
          onChange={(e) => setMood(e.target.value)}
          style={{ width: "100%", padding: 8, marginBottom: 12, borderRadius: 6 }}
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
          style={{ width: "100%", padding: 8, borderRadius: 6, marginBottom: 12 }}
        />

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 1,
              backgroundColor: "#10b981",
              color: "white",
              fontWeight: "bold",
              padding: 10,
              borderRadius: 6,
              border: "none",
            }}
          >
            {saving ? "Saving..." : "Save Mood"}
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              backgroundColor: "#e5e7eb",
              padding: 10,
              borderRadius: 6,
              border: "none",
            }}
          >
            Cancel
          </button>
        </div>

        {lastMood && (
          <div
            style={{
              marginTop: 16,
              backgroundColor: "#d1fae5",
              padding: 12,
              borderRadius: 6,
            }}
          >
            <p style={{ fontSize: 14, color: "#065f46" }}>
              Your last mood was <b>{lastMood.mood}</b>.
            </p>
            {lastMood.note && <p style={{ fontSize: 12, color: "#065f46" }}>{lastMood.note}</p>}
          </div>
        )}
      </div>
    </div>
  )
}

/* =======================
   Message Bubble
======================= */
function MessageBubble({ message }) {
  const isUser = message.role === "user"
  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: 8,
      }}
    >
      <div
        style={{
          maxWidth: "80%",
          padding: "8px 12px",
          borderRadius: 12,
          borderTopRightRadius: isUser ? 0 : 12,
          borderTopLeftRadius: isUser ? 12 : 0,
          backgroundColor: isUser ? "#10b981" : "#fff",
          color: isUser ? "white" : "black",
          boxShadow: isUser ? "none" : "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        {message.text}
      </div>
    </div>
  )
}

/* =======================
       Chat Page
======================= */
export default function ChatPage() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [showMoodTracker, setShowMoodTracker] = useState(false)
  const [moodHistory, setMoodHistory] = useState([])
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Load chat history
  useEffect(() => {
    const user = auth.currentUser
    if (!user) return

    const q = query(
      collection(db, "users", user.uid, "chats"),
      orderBy("createdAt", "asc")
    )

    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    })
    return () => unsub()
  }, [])

  // Load mood history
  useEffect(() => {
    const user = auth.currentUser
    if (!user) return

    const q = query(
      collection(db, "users", user.uid, "moods"),
      orderBy("createdAt", "desc")
    )

    const unsub = onSnapshot(q, snap => {
      setMoodHistory(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    })
    return () => unsub()
  }, [])

  async function sendMessage() {
    if (!input.trim()) return
    const user = auth.currentUser
    if (!user) return

    const userText = input
    setInput("")
    setLoading(true)
    setMessages(prev => [...prev, { role: "user", text: userText }])

    // Save user message
    try {
      await addDoc(
        collection(db, "users", user.uid, "chats"),
        { role: "user", text: userText, createdAt: serverTimestamp() }
      )
    } catch {}

    // Create assistant reply referencing last mood
    let assistantReply = "I’m here with you. Take your time."

    const lastMood = moodHistory[0]
    if (lastMood) {
      assistantReply = `You mentioned feeling ${lastMood.mood} recently. ${assistantReply}`
    }

    // Optionally call AI API
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
        { role: "assistant", text: assistantReply, createdAt: serverTimestamp() }
      )
    } catch {}

    setLoading(false)
  }

  return (
    <main style={{ maxWidth: 400, margin: "0 auto", height: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#ece5dd" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, backgroundColor: "#10b981", color: "white" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          🤍
        </div>
        <div>
          <p style={{ fontWeight: "bold" }}>Your Guide</p>
          <p style={{ fontSize: 12, opacity: 0.8 }}>Always here for you</p>
        </div>
      </div>

      {/* Mood Tracker Modal */}
      {showMoodTracker && (
        <MoodTracker onClose={() => setShowMoodTracker(false)} moodHistory={moodHistory} />
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 12px" }}>
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {loading && <p style={{ fontSize: 12, fontStyle: "italic", color: "#555" }}>Guide is typing...</p>}
        <div ref={messagesEndRef} />
      </div>

      {/* Input + buttons */}
      <div style={{ padding: 8, backgroundColor: "#fff", display: "flex", flexDirection: "column", gap: 8, borderTop: "1px solid #ccc" }}>
        <button
          onClick={() => setShowMoodTracker(true)}
          style={{ backgroundColor: "#10b981", color: "white", padding: 10, borderRadius: 6, fontWeight: "bold", border: "none" }}
        >
          Track Mood / Journal
        </button>

        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type a message..."
            style={{ flex: 1, padding: 8, borderRadius: 20, border: "1px solid #ccc", outline: "none" }}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
          />
          <button
            onClick={sendMessage}
            style={{ backgroundColor: "#10b981", color: "white", padding: 8, borderRadius: 20, border: "none" }}
          >
            ➤
          </button>
        </div>
      </div>
    </main>
  )
}
