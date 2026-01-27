"use client"

import { useState, useEffect, useRef } from "react"
import { auth, db } from "../../lib/firebase"
import { collection, addDoc, query, orderBy, getDocs } from "firebase/firestore"

// Mood Tracker Component
function MoodTracker({ onClose }) {
  const [mood, setMood] = useState("neutral")
  const [journal, setJournal] = useState("")
  const [saving, setSaving] = useState(false)
  const user = auth.currentUser

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      await addDoc(collection(db, "mood_entries"), {
        userId: user.uid,
        mood,
        journal,
        created_at: new Date(),
      })
      alert("Mood saved successfully! 🌱")
      setJournal("")
      setMood("neutral")
      if (onClose) onClose()
    } catch (err) {
      console.error(err)
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
      <h3 style={{ marginBottom: 12, textAlign: "center" }}>Track Your Mood</h3>

      <label>Mood:</label>
      <select
        value={mood}
        onChange={(e) => setMood(e.target.value)}
        style={{ width: "100%", padding: 8, margin: "8px 0", borderRadius: 6 }}
      >
        <option value="happy">😊 Happy</option>
        <option value="neutral">😐 Neutral</option>
        <option value="sad">😢 Sad</option>
        <option value="stressed">😰 Stressed</option>
      </select>

      <label>Journal Entry:</label>
      <textarea
        value={journal}
        onChange={(e) => setJournal(e.target.value)}
        placeholder="Write down your thoughts..."
        rows={4}
        style={{ width: "100%", padding: 8, borderRadius: 6, marginBottom: 12 }}
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
          color: "#111827",
          marginTop: 8,
        }}
      >
        Cancel
      </button>
    </div>
  )
}

export default function Chat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [showMoodTracker, setShowMoodTracker] = useState(false)
  const messagesEndRef = useRef(null)

  // Session memory
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
        const q = query(collection(db, "chats"), orderBy("created_at", "asc"))
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

    setMessages((prev) => [...prev, { role: "user", text: userText }])
    const user = auth.currentUser
    if (!user) {
      setLoading(false)
      return
    }

    let assistantReply = "I’m here with you. Take your time — what’s been weighing on you?"
    const msgLower = userText.toLowerCase()

    // Update session context
    setSessionContext((prev) => ({
      ...prev,
      work: prev.work || ["work", "job", "boss", "career"].some(w => msgLower.includes(w)),
      money: prev.money || ["money", "bills", "rent", "debt"].some(w => msgLower.includes(w)),
      school: prev.school || ["school", "exam", "study"].some(w => msgLower.includes(w)),
      family: prev.family || ["family", "parents"].some(w => msgLower.includes(w)),
      relationship: prev.relationship || ["relationship", "partner", "breakup"].some(w => msgLower.includes(w)),
      health: prev.health || ["health", "sick", "tired"].some(w => msgLower.includes(w)),
      loneliness: prev.loneliness || ["lonely", "alone"].some(w => msgLower.includes(w)),
      uncertainty: prev.uncertainty || ["future", "lost"].some(w => msgLower.includes(w)),
      burnout: prev.burnout || ["burnt out", "exhausted", "overwhelmed"].some(w => msgLower.includes(w)),
    }))

    try {
      // Save user message
      try {
        await addDoc(collection(db, "chats"), {
          userId: user.uid,
          role: "user",
          text: userText,
          created_at: new Date(),
        })
      } catch {}

      // AI / Predefined responses
      if (["depressed", "depression", "can't cope", "too much"].some(w => msgLower.includes(w))) {
        assistantReply =
          "Thank you for telling me this. Feeling depressed can be very heavy. You don’t need to fix everything right now. Would you like to talk about what’s been draining you the most?"
      } else if (sessionContext.work) assistantReply = "Earlier you mentioned work has been difficult. What part of it has been weighing on you the most?"
      else if (sessionContext.money) assistantReply = "Money stress can feel constant and exhausting. What’s been worrying you most financially?"
      else if (sessionContext.school) assistantReply = "School pressure can build up quietly. What has been most stressful lately?"
      else if (sessionContext.family) assistantReply = "Family situations can be emotionally heavy. Would you like to share what’s been happening?"
      else if (sessionContext.relationship) assistantReply = "Relationships can deeply affect how we feel. What’s been hurting the most?"
      else if (sessionContext.health) assistantReply = "Health challenges can drain both energy and hope. How has it been affecting you?"
      else if (sessionContext.loneliness) assistantReply = "Feeling lonely can be very painful. When do you notice it the most?"
      else if (sessionContext.uncertainty) assistantReply = "Feeling lost or uncertain about the future can be overwhelming. What feels most unclear right now?"
      else if (sessionContext.burnout) assistantReply = "Burnout can make everything feel heavy. What does exhaustion look like for you lately?"
      else {
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
      setMessages((prev) => [...prev, { role: "assistant", text: assistantReply }])
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
      <h2 style={{ textAlign: "center", marginBottom: 16 }}>💬 Support Chat</h2>

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
              background: "#fefefe",
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
                  borderRadius: 20,
                  maxWidth: "75%",
                  background: m.role === "user" ? "#dbeafe" : "#e5e7eb",
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                {m.text}
              </div>
            ))}

            {loading && (
              <p style={{ color: "gray", fontStyle: "italic", margin: 4 }}>
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
              padding: 12,
              borderRadius: 8,
              border: "1px solid #ccc",
              marginTop: 8,
            }}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />

          <button
            onClick={sendMessage}
            style={{
              width: "100%",
              padding: 12,
              marginTop: 8,
              borderRadius: 8,
              background: "#2563eb",
              color: "white",
              fontWeight: "bold",
            }}
          >
            Send
          </button>

          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <button
              onClick={() => history.back()}
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 8,
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
                borderRadius: 8,
                background: "#ef4444",
                color: "white",
                border: "none",
              }}
            >
              Logout
            </button>
          </div>
        </>
      )}
    </main>
  )
}
