import { NextResponse } from "next/server"

// ✅ Reads OpenRouter API key from environment variable (set in Vercel)
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY

export async function GET() {
  // Simple test endpoint to check API reachability
  return NextResponse.json({ status: "OK", message: "Chat API reachable" })
}

export async function POST(req) {
  try {
    const body = await req.json()
    const userMessage = body.message || ""

    const msgLower = userMessage.toLowerCase()

    // -------------------------
    // 2️⃣ SAFETY HANDLING: "I FEEL WORSE"
    if (
      msgLower.includes("i feel worse") ||
      msgLower.includes("can't cope") ||
      msgLower.includes("too much for me")
    ) {
      return NextResponse.json({
        reply:
          "I’m really glad you told me this. Take a slow breath. You don’t have to solve everything right now. Would you like to talk about what just changed, or focus on calming your body first?",
      })
    }

    // -------------------------
    // 4️⃣ OPENROUTER AI INTEGRATION
    if (!OPENROUTER_API_KEY) {
      console.log("OPENROUTER_API_KEY missing!")
      return NextResponse.json({
        reply:
          "API key missing. Cannot fetch AI reply. Your message was: " + userMessage,
      })
    }

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: userMessage }],
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      console.log("OpenRouter error:", text)
      return NextResponse.json({
        reply: "AI server error: " + text,
      })
    }

    const data = await res.json()
    const aiReply = data?.choices?.[0]?.message?.content || "🤖 AI did not reply."

    return NextResponse.json({ reply: aiReply })
  } catch (err) {
    console.error("API POST error:", err)
    return NextResponse.json(
      { reply: "❌ API ERROR: " + err.message },
      { status: 500 }
    )
  }
}
