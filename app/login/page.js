"use client"
import { LoginForm } from "../../components/AuthForms"

export default function LoginPage() {
  return (
    <main style={{ padding: 40, maxWidth: 400, margin: "auto" }}>
      <h2>Login</h2>
      <LoginForm />
    </main>
  )
}


