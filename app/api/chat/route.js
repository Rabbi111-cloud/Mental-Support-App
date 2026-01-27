import { NextResponse } from "next/server"

// This is a simple test + final version before adding AI
export async function GET() {
  return NextResponse.json({ status: "OK", message: "Chat API reachable" })
}

export async function POST(req) {
  try {
    const body = await req.json()
    const userMessage = body.message || ""

    // -------------------------
    // SAFETY ESCALATION (I FEEL WORSE)
    const msgLower = userMessage.toLowerCase()
    if (
      msgLower.includes("i feel worse") ||
      msgLower.includes("can't cope") ||
      msgLower.includes("too much for me")
    ) {
      return NextResponse.json({
        reply:
          "I’m really glad you told me this. Take a slow breath with me. You don’t have to solve everything right now. Would you like to talk about what just changed, or focus on calming your body first?",
      })
    }

    // -------------------------
    // OpenRouter AI call
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
    if (!OPENROUTER_API_KEY) {
      return NextResponse.json({
        reply:
          "✅ API works! But no AI key is set. Your message was: " + userMessage,
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

    const data = await res.json()
    const aiReply = data?.choices?.[0]?.message?.content || "🤖 AI did not reply"

    return NextResponse.json({ reply: aiReply })
  } catch (err) {
    return NextResponse.json(
      { reply: "❌ API ERROR: " + err.message },
      { status: 500 }
    )
  }
}
