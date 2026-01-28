"use client"

import { auth, db } from "../../lib/firebase"
import { addDoc, collection } from "firebase/firestore"

export default function TestFirestore() {
  const testWrite = async () => {
    try {
      const user = auth.currentUser
      if (!user) {
        alert("NOT LOGGED IN")
        return
      }

      await addDoc(collection(db, "moods"), {
        userId: user.uid,
        mood: "test",
        journal: "test write",
        createdAt: new Date(), // ❗ NOT serverTimestamp
      })

      alert("✅ WRITE SUCCESS")
    } catch (err) {
      console.error("TEST ERROR:", err)
      alert("❌ WRITE FAILED: " + err.message)
    }
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>Firestore Test</h1>
      <button onClick={testWrite}>Test Write</button>
    </main>
  )
}
