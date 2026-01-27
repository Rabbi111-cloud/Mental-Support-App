import Link from "next/link"

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f0f4f8",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          background: "white",
          padding: 40,
          borderRadius: 20,
          boxShadow: "0 15px 35px rgba(0,0,0,0.1)",
          display: "flex",
          flexDirection: "column",
          gap: 24,
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: 30, fontWeight: "bold", color: "#1f2937" }}>
          You Are Never Alone
        </h1>

        <p style={{ fontSize: 17, color: "#4b5563", lineHeight: 1.7 }}>
          Welcome! This space is here to support you through life’s ups and downs. 
          Take a deep breath — you’ve already taken the first step by being here.
        </p>

        <p style={{ fontSize: 15, color: "#6b7280", lineHeight: 1.6 }}>
          Remember, it’s okay to feel what you feel. Sometimes, all we need is a little encouragement, a gentle guide, and a safe place to share our thoughts. 
        </p>

        <p style={{ fontSize: 14, color: "#9ca3af", lineHeight: 1.5 }}>
          If you are ever in immediate danger or distress, please reach out to a trusted friend, family member, healthcare professional, or local emergency services.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 20 }}>
          <Link
            href="/login"
            style={{
              padding: "14px 28px",
              borderRadius: 12,
              background: "#2563eb",
              color: "white",
              textDecoration: "none",
              fontWeight: "bold",
              fontSize: 16,
              transition: "all 0.2s ease",
            }}
          >
            Login
          </Link>

          <Link
            href="/signup"
            style={{
              padding: "14px 28px",
              borderRadius: 12,
              background: "#10b981",
              color: "white",
              textDecoration: "none",
              fontWeight: "bold",
              fontSize: 16,
              transition: "all 0.2s ease",
            }}
          >
            Sign Up
          </Link>
        </div>
      </div>
    </main>
  )
}
