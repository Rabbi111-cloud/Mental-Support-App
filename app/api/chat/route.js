import { NextResponse } from "next/server"

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY

export async function POST(req) {
  const { message } = await req.json()

  if (!OPENROUTER_API_KEY) {
    return NextResponse.json({
      reply:
        "I’m here to listen. Something isn’t connected right now, but you’re not alone.",
    })
  }

  const systemPrompt = `
You are a calm, wise, emotionally supportive guide.
You speak gently, slowly, and with empathy.
You never judge, never rush, never give extreme advice.
You help users reflect, feel understood, and breathe.
You do not diagnose or replace professionals.
You encourage self-compassion and small steps.
`

  const res = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: \`Bearer ${OPENROUTER_API_KEY}\`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
      }),
    }
  )

  const data = await res.json()

  return NextResponse.json({
    reply:
      data?.choices?.[0]?.message?.content ||
      "I’m here with you. Take your time.",
  })
}
