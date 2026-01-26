"use client"

import Link from "next/link"

export default function Onboarding() {
  return (
    <main style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h2>Welcome 🌱</h2>

      <p>
        This space is designed to offer calm support, encouragement,
        and reflection when things feel heavy.
      </p>

      <p style={{ color: "gray" }}>
        This chatbot is not a therapist or medical professional.
        It does not replace real-life support, but it can help you
        feel less alone and think things through gently.
      </p>

      <p style={{ color: "gray" }}>
        If you ever feel unsafe or overwhelmed, please consider
        reaching out to someone you trust or a local support service.
      </p>

      <Link href="/chat">
        <button
          style={{
            marginTop: 20,
            padding: 12,
            width: "100%",
            background: "#16a34a",
            color: "white",
            border: "none",
            borderRadius: 6,
            fontWeight: "bold"
          }}
        >
          I Understand — Start Chat
        </button>
      </Link>
    </main>
  )
}
