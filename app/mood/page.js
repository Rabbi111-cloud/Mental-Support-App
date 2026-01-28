"use client"

import { useState, useEffect } from "react"
import { auth, db } from "../../lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { useRouter } from "next/navigation"

export default function MoodTracker() {
  const router = useRouter()

  const [user, setUser] = useState(null)
  const [mood, setMood] = useState("")
  const [journal, setJournal] = useState("")
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(false)

  // ✅ Wait for Firebase auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.push("/login")
      } else {
        setUser(u)
        console.log("✅ Authenticated:", u.uid)
      }
    })
    return () => unsub()
  }, [router])

  const saveMood = async () => {
    if (!user) {
      setStatus("❌ Not authenticated")
      return
    }

    if (!mood) {
      setStatus("🌱 Please select a mood")
      return
    }

    if (!journal.trim()) {
      setStatus("📝 Please write your journal entry")
      return
    }

    setLoading(true)
    setStatus("")

    try {
      await addDoc(
        collection(db, "users", user.uid, "moods"),
        {
          mood,
          journal: journal.trim(),
          createdAt: serverTimestamp(),
        }
      )

      setStatus("🌸 Mood saved successfully")
      setMood("")
      setJournal("")
      localStorage.removeItem("mood_backup")

    } catch (err) {
      console.error("🔥 Firestore error:", err)
      setStatus(`❌ ${err.code || "Failed to save mood"}`)

      // Backup locally (important for mental-health apps)
      localStorage.setItem(
        "mood_backup",
        JSON.stringify({ mood, journal, date: Date.now() })
      )
    } finally {
      setLoading(false)
    }
  }

  // 🔹 Restore backup if save failed previously
  useEffect(() => {
    const backup = localStorage.getItem("mood_backup")
    if (backup) {
      const { mood: m, journal: j } = JSON.parse(backup)
      if (m && j) {
        setMood(m)
        setJournal(j)
        setStatus("💾 Restored unsaved mood from last session")
      }
    }
  }, [])

  return (
    <main
      style={{
        maxWidth: 500,
        margin: "auto",
        padding: 20,
        minHeight: "100vh",
        background: "#fff8f0",
        color: "#111827",
      }}
    >
      <h2 style={{ textAlign: "center" }}>Mood & Journal</h2>

      <p style={{ textAlign: "center", color: "#6b7280" }}>
        Track how you feel — gently and privately 🌱
      </p>

      <select
        value={mood}
        onChange={(e) => setMood(e.target.value)}
        style={{ width: "100%", padding: 12, marginTop: 10 }}
      >
        <option value="">Select mood</option>
        <option value="happy">😊 Happy</option>
        <option value="sad">😢 Sad</option>
        <option value="anxious">😟 Anxious</option>
        <option value="angry">😡 Angry</option>
        <option value="tired">😴 Tired</option>
        <option value="neutral">😐 Neutral</option>
      </select>

      <textarea
        value={journal}
        onChange={(e) => setJournal(e.target.value)}
        placeholder="Write your journal entry..."
        style={{ width: "100%", padding: 12, marginTop: 10, minHeight: 120 }}
      />

      <button
        onClick={saveMood}
        disabled={loading}
        style={{
          width: "100%",
          padding: 14,
          marginTop: 12,
          background: loading ? "#fcd34d" : "#f59e0b",
          border: "none",
          borderRadius: 8,
          fontWeight: "bold",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Saving..." : "Save Mood"}
      </button>

      {status && (
        <p style={{ textAlign: "center", marginTop: 10 }}>{status}</p>
      )}

      <button
        onClick={() => router.back()}
        style={{ marginTop: 12, width: "100%", padding: 10 }}
      >
        Back
      </button>
    </main>
  )
}
