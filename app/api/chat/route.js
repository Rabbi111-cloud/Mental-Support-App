import { NextResponse } from "next/server"

/* ================= RATE LIMIT ================= */
const RATE_LIMIT = 10
const WINDOW_MS = 60 * 1000
const ipRequests = new Map()

/* ================= MEMORY ================= */
const memory = new Map()
const MAX_MEMORY = 5

/* ================= HUGGING FACE ================= */
const HF_MODEL =
  "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium"
const HF_API_KEY = process.env.HF_API_KEY || ""

/* ================= HELPERS ================= */

function isGreeting(msg) {
  return ["hi", "hello", "hey", "good morning", "good evening"].includes(msg)
}

function detectEmotion(msg) {
  if (msg.includes("suicide") || msg.includes("kill myself")) return "crisis"
  if (msg.includes("depressed") || msg.includes("hopeless")) return "depressed"
  if (msg.includes("sad") || msg.includes("cry")) return "sad"
  if (msg.includes("angry") || msg.includes("mad")) return "angry"
  if (msg.includes("empty") || msg.includes("numb")) return "numb"
  return "neutral"
}

/* ================= CORE CONVERSATION ENFORCER ================= */

function buildResponse(userMessage, aiText) {
  const msg = userMessage.toLowerCase().trim()
  const emotion = detectEmotion(msg)

  /* ---- GREETING ---- */
  if (isGreeting(msg)) {
    return "Hi 🙂 I’m really glad you reached out. How are you feeling today?"
  }

  /* ---- CRISIS ---- */
  if (emotion === "crisis") {
    return (
      "I’m really glad you told me this. I can’t help with anything that could harm you, " +
      "but you don’t have to go through this alone. Please consider reaching out to a trusted adult, " +
      "a family member, or a local support line right now."
    )
  }

  /* ---- DEPRESSED ---- */
  if (emotion === "depressed") {
    return (
      "I’m really sorry you’re feeling this way. Depression can make everything feel heavy and exhausting. " +
      "Do you want to tell me what’s been weighing on you the most?"
    )
  }

  /* ---- SAD ---- */
  if (emotion === "sad") {
    return (
      "That sounds really hard. Feeling sad can be draining. " +
      "What do you think has been affecting you lately?"
    )
  }

  /* ---- NUMB ---- */
  if (emotion === "numb") {
    return (
      "Feeling numb can be confusing and lonely. Sometimes it’s a sign you’ve been overwhelmed for a while. " +
      "When did you first notice this feeling?"
    )
  }

  /* ---- ANGRY ---- */
  if (emotion === "angry") {
    return (
      "It sounds like there’s a lot of frustration there. Anger often shows up when something feels unfair or painful. " +
      "Do you want to talk about what triggered it?"
    )
  }

  /* ---- WEAK AI OUTPUT ---- */
  if (!aiText || aiText.length < 20) {
    return "I’m listening. What’s been on your mind lately?"
  }

  /* ---- LIMIT QUESTIONS ---- */
  const parts = aiText.split("?")
  if (parts.length > 2) {
    return parts[0] + "?"
  }

  return aiText
}

/* ================= API HANDLER ================= */

export async function POST(req) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      req.headers.get("x-real-ip") ||
      "unknown"

    /* ---- RATE LIMIT ---- */
    const now = Date.now()
    const times = ipRequests.get(ip) || []
    const recent = times.filter((t) => now - t < WINDOW_MS)

    if (recent.length >= RATE_LIMIT) {
      return NextResponse.json({
        reply: "Let’s slow things down a bit 🌱 I’m still here with you."
      })
    }

    recent.push(now)
    ipRequests.set(ip, recent)

    /* ---- MESSAGE ---- */
    const { message } = await req.json()

    /* ---- MEMORY ---- */
    const history = memory.get(ip) || []
    const updated = [...history, `User: ${message}`].slice(-MAX_MEMORY)
    memory.set(ip, updated)

    let aiText = ""

    /* ---- HUGGING FACE RAW TEXT ---- */
    try {
      const prompt = [
        "User: Hi",
        "Guide: Hi, I’m here to listen.",
        ...updated,
        "Guide:"
      ].join("\n")

      const res = await fetch(HF_MODEL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(HF_API_KEY && { Authorization: `Bearer ${HF_API_KEY}` })
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 80,
            temperature: 0.8,
            repetition_penalty: 1.2,
            return_full_text: false
          }
        })
      })

      const data = await res.json()
      aiText = data?.generated_text || data?.[0]?.generated_text || ""
    } catch {
      aiText = ""
    }

    /* ---- FINAL RESPONSE ---- */
    const reply = buildResponse(message, aiText)

    memory.set(ip, [...updated, `Guide: ${reply}`].slice(-MAX_MEMORY))

    return NextResponse.json({ reply })
  } catch {
    return NextResponse.json({
      reply: "I’m here with you. Something went wrong, but you’re not alone."
    })
  }
}
