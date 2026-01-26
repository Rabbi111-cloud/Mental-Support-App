"use client"

import { useEffect, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "../lib/firebase"
import { useRouter } from "next/navigation"

export default function RootLayout({ children }) {
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login")
      }
      setLoading(false)
    })
    return () => unsub()
  }, [router])

  if (loading) return <p style={{ padding: 40 }}>Loading…</p>

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
