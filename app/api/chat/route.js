import { NextResponse } from "next/server"

// ===== RATE LIMIT CONFIG =====
const RATE_LIMIT = 10 // max requests
const WINDOW_MS = 60 * 1000 // 1 minute

// In-memory store (safe for MVP)
const ipRequests = new Map()

// Hugging Face fallback
const HF_MODEL_URL = "https://api-inference.huggingface.co/models/gpt2"
const HF_API_KEY = process.env.HF_API_KEY || ""

export async function POST(req) {
  try {
    // ===== GET USER IP =====
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      req.headers.get("x-real-ip") ||
      "unknown"

    const now = Date.now()
    const timestamps = ipRequests.get(ip) || []

    // Remove old requests
    const recentRequests = timestamps.filter(
      (time) => now - time < WINDOW_MS
    )

    // Check rate limit
    if (recentRequests.length >= RATE_LIMIT) {
      return NextResponse.json(
        {
          reply:
            "You’re sending messages very quickly. Please slow down and take a breath 🌱"
        },
        { status: 429 }
      )
    }

    // Save request
    recentRequests.push(now)
    ipRequests.set(ip, recentRequests)

    // ===== READ MESSAGE =====
    const { message } = await req.json()

    // ===== SAFETY FILTER =====
    const unsafeKeywords = [
      "suicide",
      "kill",
      "self-harm",
      "harm",
      "die",
      "weapon",
      "overdose"
    ]

    if (
      unsafeKeywords.some((word) =>
        message.toLowerCase().includes(word)
      )
    ) {
      return NextResponse.json({
        reply:
          "I’m really glad you reached out. I can’t help with unsafe topics, but you deserve care and support. Please talk to a trusted adult or professional."
      })
    }

    let reply = ""

    // ===== TRY OPENAI FIRST =====
    try {
      if (process.env.OPENAI_API_KEY) {
        const openaiRes = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
              model: "gpt-4",
              messages: [
                {
                  role: "system",
                  content:
                    "You are a calm, kind, encouraging guide. Never give medical advice."
                },
                { role: "user", content: message }
              ],
              max_tokens: 150
            })
          }
        )

        const data = await openaiRes.json()
        reply = data.choices?.[0]?.message?.content
      }
    } catch {
      // silently fail to fallback
    }

    // ===== HUGGING FACE FALLBACK =====
    if (!reply) {
      try {
        const hfRes = await fetch(HF_MODEL_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(HF_API_KEY && {
              Authorization: `Bearer ${HF_API_KEY}`
            })
          },
          body: JSON.stringify({
            inputs: `Encourage the user kindly: ${message}`
          })
        })

        const hfData = await hfRes.json()
        reply = hfData?.[0]?.generated_text
      } catch {
        // continue to final fallback
      }
    }

    // ===== FINAL SAFE FALLBACK =====
    if (!reply) {
      reply =
        "I’m here with you. Even when words are hard, your life has meaning."
    }

    return NextResponse.json({ reply })

  } catch (err) {
    return NextResponse.json({
      reply:
        "Something went wrong, but I’m still here with you."
    })
  }
}
