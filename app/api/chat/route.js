import { NextResponse } from "next/server"

export async function POST(req) {
  const { message } = await req.json()

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type":"application/json", Authorization:`Bearer ${process.env.OPENROUTER_API_KEY}` },
      body: JSON.stringify({ model:"gpt-4o-mini", messages:[{ role:"user", content:message }] })
    })
    const data = await res.json()
    const reply = data?.choices?.[0]?.message?.content || "I’m here with you."
    return NextResponse.json({ reply })
  } catch {
    return NextResponse.json({ reply: "I’m here with you. Something went wrong." })
  }
}
