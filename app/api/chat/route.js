import { NextResponse } from "next/server"

/* ================= RATE LIMIT ================= */
const RATE_LIMIT = 10
const WINDOW_MS = 60 * 1000
const ipRequests = new Map()

/* ================= MEMORY ================= */
const memory = new Map()
const MAX_MEMORY = 6

/* ================= STAGE TRACKING ================= */
const stageMap = new Map() // early | grounding | deep

/* ================= USER CONTEXT ================= */
const userContext = new Map() // remembers main issue

/* ================= ANTI-LOOP MEMORY ================= */
const lastReplyMap = new Map()

/* ================= HUGGING FACE (OPTIONAL) ================= */
const HF_MODEL =
  "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium"
const HF_API_KEY = process.env.HF_API_KEY || ""

/* ================= HELPERS ================= */

// ---------- Intent Detection (3) ----------
function detectIntent(msg) {
  const m = msg.toLowerCase()

  if (m.match(/depressed|hopeless|sad|overwhelmed|tired of everything|anxious/))
    return "emotional"

  if (m.match(/business|job|money|profit|sales|income|rent|bills/))
    return "life-problem"

  if (m.match(/what can i do|how do i fix|how can i handle|what should i do/))
    return "seeking-guidance"

  if (m.startsWith("how") || m.startsWith("what") || m.startsWith("why"))
    return "information"

  if (m.length < 5)
    return "unclear"

  return "general"
}

// ---------- Stage Detection ----------
function detectStage(msg) {
  if (msg.match(/depressed|hopeless|giving up/)) return "deep"
  if (msg.match(/overwhelmed|too much|tired/)) return "grounding"
  return "early"
}

// ---------- Gentle Actions (2) ----------
function gentleNextStep(options) {
  return (
    "If it feels okay, we could try one small thing:\n" +
    options.map((o) => `• ${o}`).join("\n") +
    "\n\nThere’s no pressure to solve everything at once."
  )
}

/* ================= RESPONSE BUILDER ================= */
function buildResponse(userMessage, aiText, history, stage, ip) {
  const msg = userMessage.toLowerCase()
  const intent = detectIntent(msg)
  const context = userContext.get(ip)

  let reply = ""

  // ---------- GREETING ----------
  if (["hi", "hello", "hey"].includes(msg) && history.length < 2) {
    reply = "Hi 🙂 I’m really glad you reached out. How are you feeling today?"
  }

  // ---------- EMOTIONAL ----------
  else if (intent === "emotional") {
    stageMap.set(ip, "deep")

    if (context?.mainIssue === "business") {
      reply =
        "It sounds like the business situation is still weighing heavily on you. That kind of stress can drain anyone. How is it affecting you today?"
    } else {
      reply =
        "I’m really sorry you’re feeling this way. You don’t have to carry it alone. What’s been hardest today?"
    }
  }

  // ---------- LIFE PROBLEMS ----------
  else if (intent === "life-problem") {
    stageMap.set(ip, "deep")

    if (msg.includes("business")) {
      userContext.set(ip, { mainIssue: "business" })

      reply =
        "That’s really hard. When something you’ve worked on starts failing, it can feel personal and overwhelming.\n\n" +
        gentleNextStep([
          "Look at just one part of the business today",
          "Talk through what changed recently",
          "Focus on staying emotionally steady first"
        ])
    } else {
      reply =
        "That sounds really stressful. Situations like this can feel heavy, especially when you’re already low. I’m here with you."
    }
  }

  // ---------- SEEKING GUIDANCE ----------
  else if (intent === "seeking-guidance") {
    if (context?.mainIssue === "business") {
      reply =
        "Let’s take this gently.\n\n" +
        "Which feels more true right now?\n" +
        "• Customers still come but don’t buy\n" +
        "• Or customers have stopped coming entirely"
    } else {
      reply =
        "Before deciding what to do, it might help to slow down. What part of this worries you the most?"
    }
  }

  // ---------- INFORMATION ----------
  else if (intent === "information") {
    reply =
      "I can explain that clearly. Tell me what part you’d like broken down simply."
  }

  // ---------- UNCLEAR ----------
  else if (intent === "unclear") {
    reply =
      "I want to understand you better. Can you tell me a bit more about what you mean?"
  }

  // ---------- FALLBACK ----------
  else {
    if (!aiText || aiText.length < 25) {
      reply =
        stage === "early"
          ? "I’m here with you. What would you like to focus on right now?"
          : "I’m listening. Take your time."
    } else {
      reply = aiText
    }
  }

  /* ====== ANTI-LOOP PROTECTION (1) ====== */
  const lastReply = lastReplyMap.get(ip)
  if (lastReply && lastReply === reply) {
    reply =
      "I want to be helpful here. Let’s pause for a moment — what feels most urgent for you right now?"
  }

  lastReplyMap.set(ip, reply)
  return reply
}

/* ================= API HANDLER ================= */
export async function POST(req) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"

    // ---------- RATE LIMIT ----------
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

    // ---------- STAGE ----------
    const prevStage = stageMap.get(ip) || "early"
    const newStage = detectStage(msg)
    const stage = newStage === "early" ? prevStage : newStage
    stageMap.set(ip, stage)

    // ---------- MEMORY ----------
    const history = memory.get(ip) || []
    const updated = [...history, `User: ${message}`].slice(-MAX_MEMORY)
    memory.set(ip, updated)

    let aiText = ""

    // ---------- OPTIONAL HF FALLBACK ----------
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

    const reply = buildResponse(message, aiText, updated, stage, ip)

    memory.set(ip, [...updated, `Guide: ${reply}`].slice(-MAX_MEMORY))

    return NextResponse.json({ reply })
  } catch {
    return NextResponse.json({
      reply: "I’m here with you. Something went wrong, but you’re not alone."
    })
  }
}
