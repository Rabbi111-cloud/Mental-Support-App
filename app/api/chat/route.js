import { NextResponse } from "next/server"

// Only run server-side; do not touch Firebase client here
export async function POST(req) {
  try {
    const { message } = await req.json()

    // Safety filter
    const unsafeKeywords = [
      "suicide", "kill", "harm", "drugs", "self-harm", "die", "weapon"
    ]
    if (unsafeKeywords.some((word) => message.toLowerCase().includes(word))) {
      return NextResponse.json(
        { reply: "I’m here to support you safely. If you are in danger, please reach out to a trusted adult or professional." },
        { status: 200 }
      )
    }

    // Call AI API (OpenAI example)
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY
    if (!OPENAI_API_KEY) {
      return NextResponse.json({ reply: "AI service not configured." }, { status: 500 })
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a kind, encouraging AI that supports users feeling down. Never give medical advice or unsafe instructions."
          },
          {
            role: "user",
            content: message
          }
        ],
        max_tokens: 150
      })
    })

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content || "I’m here for you. Please tell me more."

    return NextResponse.json({ reply }, { status: 200 })

  } catch (err) {
    return NextResponse.json(
      { reply: "Oops, something went wrong. Try again." },
      { status: 500 }
    )
  }
}
