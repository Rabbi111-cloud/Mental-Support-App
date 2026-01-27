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
          padding: 36,
          borderRadius: 16,
          boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
          display: "flex",
          flexDirection: "column",
          gap: 24,
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: 28, fontWeight: "bold", color: "#1f2937" }}>
          You Are Not Alone
        </h1>

        <p style={{ fontSize: 16, color: "#64748b", lineHeight: 1.6 }}>
          This app offers gentle encouragement and reflection. It is not a replacement for professional help, but it can guide you through moments of stress and difficulty.
        </p>

        <p style={{ fontSize: 14, color: "#9ca3af", lineHeight: 1.5 }}>
          If you are in immediate danger or distress, please contact a trusted person, a healthcare professional, or your local emergency services.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 20 }}>
          <Link
            href="/login"
            style={{
              padding: "12px 24px",
              borderRadius: 10,
              background: "#2563eb",
              color: "white",
              textDecoration: "none",
              fontWeight: "bold",
              fontSize: 16,
            }}
          >
            Login
          </Link>

          <Link
            href="/signup"
            style={{
              padding: "12px 24px",
              borderRadius: 10,
              background: "#10b981",
              color: "white",
              textDecoration: "none",
              fontWeight: "bold",
              fontSize: 16,
            }}
          >
            Sign Up
          </Link>
        </div>
      </div>
    </main>
  )
}

