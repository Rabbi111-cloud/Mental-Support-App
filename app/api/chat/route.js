import { NextResponse } from "next/server"

export async function POST(req) {
  try {
    const body = await req.json()

    // ✅ ACCEPT BOTH message AND messages (failsafe)
    const userMessage =
      body.message ||
      body.messages?.[body.messages.length - 1]?.content ||
      ""

    if (!userMessage.trim()) {
      return NextResponse.json({
        reply: "I’m here with you. What’s on your mind right now?",
      })
    }

    const msgLower = userMessage.toLowerCase()

    // -------------------------
    // SAFETY HANDLING
    if (
      msgLower.includes("i feel worse") ||
      msgLower.includes("can't cope") ||
      msgLower.includes("too much for me")
    ) {
      return NextResponse.json({
        reply:
          "I’m really glad you said that. Let’s slow this moment down together. You don’t have to fix everything. Would you like to talk about what made today heavier?",
      })
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        reply:
          "The guide is temporarily unavailable, but you are not alone. Please try again in a moment.",
      })
    }

    // -------------------------
    // OPENROUTER CALL (WITH TIMEOUT)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15_000)

    const res = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://your-vercel-app.vercel.app",
          "X-Title": "Mental Health Guide",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are a calm, wise, supportive mental health guide. You never judge, never panic, and gently encourage real-world support when appropriate.",
            },
            { role: "user", content: userMessage },
          ],
          temperature: 0.7,
        }),
        signal: controller.signal,
      }
    )

    clearTimeout(timeout)

    if (!res.ok) {
      return NextResponse.json({
        reply:
          "I’m still here with you. Something didn’t work just now, but we can try again together.",
      })
    }

    const data = await res.json()
    const aiReply =
      data?.choices?.[0]?.message?.content ||
      "I’m here and listening. Tell me a little more."

    return NextResponse.json({ reply: aiReply })
  } catch (err) {
    return NextResponse.json({
      reply:
        "I’m here with you. Let’s pause for a moment and try again when you’re ready.",
    })
  }
}
