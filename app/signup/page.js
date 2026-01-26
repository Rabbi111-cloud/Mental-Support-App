"use client"
import { SignupForm } from "../../components/AuthForms"

export default function SignupPage() {
  return (
    <main style={{ padding: 40, maxWidth: 400, margin: "auto" }}>
      <h2>Sign Up</h2>
      <SignupForm />
    </main>
  )
}
