"use client"
import Link from "next/link"
import { auth } from "../../lib/firebase"
import { signOut } from "firebase/auth"

export default function Onboarding() {
  async function handleLogout() {
    await signOut(auth)
    window.location.href = "/login"
  }

  return (
    <main style={{ maxWidth:600, margin:"0 auto", padding:20 }}>
      <h2>Welcome 🌱</h2>
      <p>This chatbot is for calm support and encouragement.</p>
      <p style={{color:"gray"}}>It is not a therapist. If things get serious, contact someone you trust or a professional.</p>

      <div style={{display:"flex", gap:10, marginTop:20}}>
        <Link href="/chat">
          <button style={{padding:12, background:"#16a34a", color:"white", border:"none", borderRadius:6}}>Start Chat</button>
        </Link>
        <button onClick={handleLogout} style={{padding:12, background:"#ef4444", color:"white", border:"none", borderRadius:6}}>Logout</button>
      </div>
    </main>
  )
}
