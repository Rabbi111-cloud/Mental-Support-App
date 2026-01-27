"use client"

import { useState } from "react"
import { auth, db } from "../../lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { useRouter } from "next/navigation"

export default function MoodTracker() {
  const router = useRouter()
  const [mood, setMood] = useState("")
  const [journal, setJournal] = useState("")
  const [status, setStatus] = useState("")

  const saveMood = async () => {
    if (!mood) {
      setStatus("🌱 Please select your mood first")
      return
    }

    const user = auth.currentUser
    if (!user) {
      setStatus("❌ You must be logged in to save your mood")
      return
    }

    try {
      // Save to Firestore with userId to match rules
      await addDoc(collection(db, "moods"), {
        userId: user.uid,
        mood,
        journal,
        createdAt: serverTimestamp(),
      })

      setStatus("🌸 Mood saved successfully!")
      setMood("")
      setJournal("")
    } catch (err) {
      console.error("Error saving mood:", err.code, err.message)
      setStatus("❌ Failed to save mood. Try again.")
    }
  }

  return (
    <main style={{
      maxWidth: 500,
      margin: "20px auto",
      padding: 20,
      borderRadius: 12,
      backgroundColor: "#fff8f0",
      boxShadow: "0 6px 20px rgba(0,0,0,0.05)",
      minHeight: "100vh",
      color: "#111827",
      display: "flex",
      flexDirection: "column",
      gap: 16
    }}>
      <h2 style={{ textAlign: "center", marginBottom: 10 }}>Mood & Journaling</h2>
      <p style={{ textAlign: "center", color: "#6b7280" }}>
        Track your mood and write down your thoughts. 🌿
      </p>

      <select
        value={mood}
        onChange={(e) => setMood(e.target.value)}
        style={{
          width: "100%",
          padding: 12,
          borderRadius: 8,
          border: "1px solid #fbbf24",
          marginBottom: 12,
          backgroundColor: "#fff",
          fontSize: 16
        }}
      >
        <option value="">Select your mood...</option>
        <option value="happy">😊 Happy</option>
        <option value="sad">😢 Sad</option>
        <option value="anxious">😟 Anxious</option>
        <option value="angry">😡 Angry</option>
        <option value="neutral">😐 Neutral</option>
        <option value="excited">🤩 Excited</option>
        <option value="tired">😴 Tired</option>
      </select>

      <textarea
        value={journal}
        onChange={(e) => setJournal(e.target.value)}
        placeholder="Write your thoughts or notes..."
        style={{
          width: "100%",
          padding: 12,
          borderRadius: 8,
          border: "1px solid #fbbf24",
          minHeight: 100,
          marginBottom: 12,
          backgroundColor: "#fff",
          fontSize: 15,
        }}
      />

      <button
        onClick={saveMood}
        style={{
          width: "100%",
          padding: 14,
          borderRadius: 8,
          border: "none",
          backgroundColor: "#f59e0b",
          color: "#111827",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        Save Mood
      </button>

      {status && (
        <p style={{
          textAlign: "center",
          marginTop: 8,
          color: status.includes("🌸") ? "#059669" : "#ef4444",
          fontWeight: "500"
        }}>
          {status}
        </p>
      )}

      <button
        onClick={() => router.back()}
        style={{
          width: "100%",
          padding: 12,
          borderRadius: 8,
          border: "1px solid #ccc",
          backgroundColor: "#fff",
          marginTop: 10,
          cursor: "pointer"
        }}
      >
        Back
      </button>
    </main>
  )
}
