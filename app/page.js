  </html>
  )
}
4️⃣ app/page.js (Landing Page + Disclaimer)
import Link from "next/link"

export default function Home() {
  return (
    <main style={{ padding: 40, maxWidth: 600, margin: "auto" }}>
      <h1>You are not alone</h1>

      <p>
        This app offers gentle encouragement and reflection.
        It is not a replacement for professional help.
      </p>

      <p>
        If you are in immediate danger or distress, please contact
        a trusted person or local emergency services.
      </p>

      <div style={{ marginTop: 20 }}>
        <Link href="/login">Login</Link>{" | "}
        <Link href="/signup">Sign up</Link>
      </div>
    </main>
  )
}
