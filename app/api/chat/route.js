import { NextResponse } from "next/server"

/* ================= RATE LIMIT ================= */
const RATE_LIMIT = 10
const WINDOW_MS = 60 * 1000
const ipRequests = new Map()

/* ================= MEMORY ================= */
const conversationMemory = new Map()
const MAX_MEMORY = 5

/* ================= MODELS ================= */
const HF_MODEL_URL =
  "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium"
const HF_API_KEY = process.env.HF_API_KEY || ""

/* ================= FALLBACKS ================= */
const fallbackReplies = [
  "I’m here with you. What’s been on your mind lately?",
  "Thank you for telling me that. Do you want to talk more about it?",
  "That sounds difficult. How long have you been feeling this way?",
  "I’m listening. What feels hardest right now?",
  "You don’t have to go through this alone. Tell me more."
]

export async function POST(req) {
  try {
    /* ===== GET IP ===== */
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      req.headers.get("x-real-ip") ||
      "unknown"

    /* ===== RATE LIMIT ===== */
    const now = Date.now()
    const timestamps = ipRequests.get(ip) || []
    const recent = timestamps.filter((t) => now - t < WINDOW_MS)

    if (recent.length >= RATE_LIMIT) {
      return NextResponse.json(
        { reply: "Let’s slow down a little 🌱 I’m still here with you." },
        { status: 429 }
      )
    }

    recent.push(now)
    ipRequests.set(ip, recent)

    /* ===== READ MESSAGE ===== */
    const { message } = await req.json()

    /* ===== SAFETY FILTER ===== */
    const unsafeKeywords = [
      "suicide",
      "kill",
      "self-harm",
      "die",
      "weapon",
      "overdose"
    ]

    if (unsafeKeywords.some((w) => message.toLowerCase().includes(w))) {
      return NextResponse.json({
        reply:
          "I’m really glad you reached out. I can’t help with unsafe topics, but you deserve care and support. Please reach out to a trusted adult or local professional."
      })
    }

    /* ===== MEMORY ===== */
    const history = conversationMemory.get(ip) || []
    const updatedHistory = [...history, `User: ${message}`].slice(-MAX_MEMORY)
    conversationMemory.set(ip, updatedHistory)

    let reply = ""

    /* ================= OPENAI (PRIMARY) ================= */
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
                    "You are a calm, empathetic guide. Ask gentle follow-up questions. No medical advice."
                },
                ...updatedHistory.map((m) => ({
                  role: m.startsWith("User") ? "user" : "assistant",
                  content: m.replace("User: ", "").replace("Guide: ", "")
                })),
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
      // silently fall back
    }

    /* ================= HUGGING FACE (CONVERSATIONAL FIX) ================= */
    if (!reply) {
      try {
        const conversation = [
          "User: Hi",
          "Guide: Hi, I’m here with you. What’s been on your mind?",
          ...updatedHistory,
          `User: ${message}`,
          "Guide:"
        ].join("\n")

        const hfRes = await fetch(HF_MODEL_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(HF_API_KEY && {
              Authorization: `Bearer ${HF_API_KEY}`
            })
          },
          body: JSON.stringify({
            inputs: conversation,
            parameters: {
              max_new_tokens: 80,
              temperature: 0.8,
              repetition_penalty: 1.2,
              return_full_text: false
            }
          })
        })

        const hfData = await hfRes.json()
        reply =
          hfData?.generated_text ||
          hfData?.[0]?.generated_text
      } catch {
        // continue to fallback
      }
    }

    /* ===== CLEAN HF OUTPUT ===== */
    if (reply) {
      reply = reply
        .replace(/User:.*$/gi, "")
        .replace(/Guide:/gi, "")
        .trim()
    }

    /* ===== FINAL FALLBACK ===== */
    if (!reply) {
      reply =
        fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)]
    }

    conversationMemory.set(
      ip,
      [...updatedHistory, `Guide: ${reply}`].slice(-MAX_MEMORY)
    )

    return NextResponse.json({ reply })

  } catch {
    return NextResponse.json({
      reply: "I’m here with you. Something went wrong, but you’re not alone."
    })
  }
}
