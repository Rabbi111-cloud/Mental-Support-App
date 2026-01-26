"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { auth } from "../../lib/firebase"
import { signInWithEmailAndPassword } from "firebase/auth"

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  async function handleLogin(e) {
    e.preventDefault()
    try {
      await signInWithEmailAndPassword(auth, email, password)
      router.push("/onboarding")
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <main style={{ maxWidth: 400, margin: "0 auto", padding: 20 }}>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required style={{width:"100%", marginBottom:10}} />
        <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required style={{width:"100%", marginBottom:10}} />
        <button style={{width:"100%"}}>Login</button>
      </form>
      {error && <p style={{color:"red"}}>{error}</p>}
    </main>
  )
}
