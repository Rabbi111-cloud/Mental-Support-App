import { NextResponse } from "next/server"

/* ================= RATE LIMIT ================= */
const RATE_LIMIT = 10
const WINDOW_MS = 60 * 1000
const ipRequests = new Map()

/* ================= MEMORY ================= */
const memory = new Map()
const MAX_MEMORY = 6

/* ================= STAGE TRACKING ================= */
const stageMap = new Map()
// stages: "early" | "deep" | "grounding"

/* ================= HUGGING FACE ================= */
const HF_MODEL =
  "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium"
const HF_API_KEY = process.env.HF_API_KEY || ""

/* ================= HELPERS ================= */

function detectStage(msg) {
  if (
    msg.includes("depressed") ||
    msg.includes("lost my job") ||
    msg.includes("hopeless")
  ) {
    return "deep"
  }

  if (
    msg.includes("overwhelmed") ||
    msg.includes("too much") ||
    msg.includes("tired")
  ) {
    return "grounding"
  }

  return "early"
}

function buildResponse(userMessage, aiText, history, stage) {
  const msg = userMessage.toLowerCase().trim()
  const lastUser =
    [...history]
      .reverse()
      .find((m) => m.startsWith("User:"))
      ?.replace("User: ", "")
      .toLowerCase() || ""

  /* ---------- GREETINGS (ONLY AT START) ---------- */
  if (["hi", "hello", "hey"].includes(msg) && history.length < 2) {
    return "Hi 🙂 I’m really glad you reached out. Take your time — how are you feeling today?"
  }

  /* ---------- SOCIAL REPLIES ---------- */
  if (msg.includes("and you") || msg === "i am fine" || msg === "fine") {
    return "Thanks for asking 🙂 I’m here with you. What would you like us to talk about today?"
  }

  /* ---------- JOB LOSS ---------- */
  if (msg.includes("lost my job")) {
    stageMap.set("stage", "deep")
    return (
      "I’m really sorry — losing a job can shake your confidence and sense of direction. " +
      "It makes sense that this would weigh heavily on you. " +
      "What part of this feels hardest right now: the uncertainty, the financial pressure, or how it’s affected how you see yourself?"
    )
  }

  /* ---------- DEPRESSION ---------- */
  if (msg.includes("depressed")) {
    stageMap.set("stage", "deep")
    return (
      "I’m really sorry you’re feeling this way. Depression can make even small things feel exhausting. " +
      "You don’t have to explain everything at once. What’s been weighing on you the most lately?"
    )
  }

  /* ---------- FOLLOW-UP AFTER JOB LOSS ---------- */
  if (lastUser.includes("lost my job") && msg.includes("what do i do")) {
    return (
      "That’s a very real question, and it’s okay not to have answers right away. " +
      "Before we think about next steps, can you tell me what feels most overwhelming right now?"
    )
  }

  /* ---------- GROUNDING STAGE ---------- */
  if (stage === "grounding") {
    return (
      "It sounds like things feel like a lot right now. Let’s slow this down together for a moment. " +
      "As you’re reading this, try taking one gentle breath. What’s one small thing that feels a little heavy right now?"
    )
  }

  /* ---------- WEAK AI OUTPUT ---------- */
  if (!aiText || aiText.length < 30) {
    if (stage === "early") {
      return "I’m here with you. What’s been on your mind lately?"
    }
    return "I’m listening. What feels hardest for you right now?"
  }

  /* ---------- LIMIT QUESTIONS ---------- */
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

    const { message } = await req.json()
    const msg = message.toLowerCase()

    /* ---- STAGE ---- */
    const prevStage = stageMap.get(ip) || "early"
    const newStage = detectStage(msg)
    const stage = newStage === "early" ? prevStage : newStage
    stageMap.set(ip, stage)

    /* ---- MEMORY ---- */
    const history = memory.get(ip) || []
    const updated = [...history, `User: ${message}`].slice(-MAX_MEMORY)
    memory.set(ip, updated)

    let aiText = ""

    /* ---- HUGGING FACE RAW TEXT ---- */
    try {
      const prompt = [
        "User: Hi",
        "Guide: Hi, I’m here to listen and support.",
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

    const reply = buildResponse(message, aiText, updated, stage)

    memory.set(ip, [...updated, `Guide: ${reply}`].slice(-MAX_MEMORY))

    return NextResponse.json({ reply })
  } catch {
    return NextResponse.json({
      reply: "I’m here with you. Something went wrong, but you’re not alone."
    })
  }
}
