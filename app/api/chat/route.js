import { NextResponse } from "next/server"

/* ================= RATE LIMIT ================= */
const RATE_LIMIT = 10
const WINDOW_MS = 60 * 1000
const ipRequests = new Map()

/* ================= MEMORY ================= */
const memory = new Map()
const MAX_MEMORY = 6

/* ================= STAGE TRACKING ================= */
const stageMap = new Map() // stages: "early" | "deep" | "grounding"

/* ================= HUGGING FACE ================= */
const HF_MODEL =
  "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium"
const HF_API_KEY = process.env.HF_API_KEY || ""

/* ================= HELPERS ================= */

// Intent categories based on your full list
function detectIntent(msg) {
  const m = msg.toLowerCase()

  // Emotional & human-centered
  if (m.match(/feel|tired|stuck|scared|anxious|depressed|overwhelmed/)) {
    return "emotional"
  }

  // Information seeking
  if (
    m.startsWith("what") ||
    m.startsWith("who") ||
    m.startsWith("when") ||
    m.startsWith("where") ||
    m.startsWith("why") ||
    m.startsWith("how") ||
    m.startsWith("which")
  ) {
    return "information"
  }

  // How-to / instructional
  if (
    m.startsWith("how do") ||
    m.startsWith("how can") ||
    m.startsWith("what are the steps") ||
    m.includes("best way to")
  ) {
    return "how-to"
  }

  // Advice / recommendations
  if (
    m.includes("should i") ||
    m.includes("what should i") ||
    m.includes("better") ||
    m.includes("would you recommend")
  ) {
    return "advice"
  }

  // Troubleshooting
  if (
    m.includes("not working") ||
    m.includes("won't") ||
    m.includes("keeps") ||
    m.includes("error") ||
    m.includes("cannot")
  ) {
    return "problem"
  }

  // Decision-making
  if (m.includes("or") && (m.includes("better") || m.includes("choose"))) {
    return "decision"
  }

  // Clarification
  if (
    m.includes("i don't understand") ||
    m.includes("what do you mean") ||
    m.includes("explain") ||
    m.includes("can you clarify")
  ) {
    return "clarification"
  }

  // Exploratory
  if (
    m.includes("ideas") ||
    m.includes("improve") ||
    m.includes("possibilities") ||
    m.includes("consider")
  ) {
    return "exploratory"
  }

  // Binary / yes-no
  if (m.startsWith("is this") || m.startsWith("does this") || m.startsWith("can i")) {
    return "yesno"
  }

  // Poorly formed / slang / casual
  if (m.length < 5 || m.includes("bro") || m.includes("dey") || m.includes("thing")) {
    return "slang"
  }

  return "unknown"
}

// Stage detection
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

/* ================= RESPONSE BUILDER ================= */
function buildResponse(userMessage, aiText, history, stage) {
  const msg = userMessage.toLowerCase().trim()
  const lastUser =
    [...history]
      .reverse()
      .find((m) => m.startsWith("User:"))
      ?.replace("User: ", "")
      .toLowerCase() || ""

  const intent = detectIntent(msg)

  // ---------- GREETINGS ----------
  if (["hi", "hello", "hey"].includes(msg) && history.length < 2) {
    return "Hi 🙂 I’m really glad you reached out. How are you feeling today?"
  }

  // ---------- EMOTIONAL ----------
  if (intent === "emotional") {
    stageMap.set("stage", "deep")
    if (msg.includes("not feeling too good") || msg.includes("not good")) {
      return "I hear you. Some days feel heavier than others. Do you want to tell me what’s been hard today?"
    }
    if (msg.includes("depressed")) {
      return "I’m really sorry you’re feeling this way. Depression can make everything feel exhausting. What’s weighing on you the most right now?"
    }
    return "I’m here with you. Can you tell me a bit more about how you feel?"
  }

  // ---------- INFORMATION ----------
  if (intent === "information") {
    return `Here’s what I know about that: [provide clear, simple explanation]. Can you tell me if you need a deeper explanation or examples?`
  }

  // ---------- HOW-TO ----------
  if (intent === "how-to") {
    return `Here are the steps I recommend: [step-by-step instructions]. Does this match what you’re trying to do?`
  }

  // ---------- ADVICE ----------
  if (intent === "advice") {
    return `Here’s what I’d suggest: [balanced advice, pros and cons]. What’s your goal or preference in this situation?`
  }

  // ---------- TROUBLESHOOTING ----------
  if (intent === "problem") {
    return `Let’s try to diagnose this together. Can you describe exactly what’s happening or any error messages?`
  }

  // ---------- DECISION-MAKING ----------
  if (intent === "decision") {
    return `Let’s compare your options carefully. Can you tell me the pros and cons you see for each?`
  }

  // ---------- CLARIFICATION ----------
  if (intent === "clarification") {
    return `Sure, let me explain that more clearly: [simple analogy or breakdown]. Does that help?`
  }

  // ---------- EXPLORATORY ----------
  if (intent === "exploratory") {
    return `That’s a great question. Let’s brainstorm some possibilities: [structured suggestions]. Which ones sound most useful to you?`
  }

  // ---------- YES/NO ----------
  if (intent === "yesno") {
    return `Yes 🙂 [or No ❌], and here’s why: [short explanation]. Does that answer your question?`
  }

  // ---------- SLANG / POORLY FORMED ----------
  if (intent === "slang") {
    return `I’m following you 🙂 Can you tell me a little more in your own words so I understand fully?`
  }

  // ---------- JOB LOSS SPECIFIC ----------
  if (msg.includes("lost my job")) {
    stageMap.set("stage", "deep")
    return "I’m really sorry — losing a job can feel overwhelming. What part of this feels hardest right now?"
  }

  if (lastUser.includes("lost my job") && msg.includes("what do i do")) {
    return "It’s okay not to have all answers right away. What feels most overwhelming to you at the moment?"
  }

  // ---------- FALLBACK ----------
  if (!aiText || aiText.length < 25) {
    if (stage === "early") {
      return "I’m here with you. What would you like to focus on right now?"
    }
    return "I’m listening. Can you tell me more about what’s hardest right now?"
  }

  return aiText
}

/* ================= API HANDLER ================= */

export async function POST(req) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      "unknown"

    // Rate limit
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

    // Stage tracking
    const prevStage = stageMap.get(ip) || "early"
    const newStage = detectStage(msg)
    const stage = newStage === "early" ? prevStage : newStage
    stageMap.set(ip, stage)

    // Memory
    const history = memory.get(ip) || []
    const updated = [...history, `User: ${message}`].slice(-MAX_MEMORY)
    memory.set(ip, updated)

    let aiText = ""

    // Hugging Face call (optional / fallback)
    try {
      const prompt = ["User: Hi", "Guide: Hi, I’m here to listen and support.", ...updated, "Guide:"].join("\n")

      const res = await fetch(HF_MODEL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(HF_API_KEY && { Authorization: `Bearer ${HF_API_KEY}` })
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: { max_new_tokens: 80, temperature: 0.8, repetition_penalty: 1.2, return_full_text: false }
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
