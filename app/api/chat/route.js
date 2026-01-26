import { NextResponse } from "next/server"

// Optional: Set a free HuggingFace model as backup
const HF_MODEL_URL = "https://api-inference.huggingface.co/models/gpt2" 
const HF_API_KEY = process.env.HF_API_KEY || "" // optional free HF token

export async function POST(req) {
  try {
    const { message } = await req.json()

    // 1️⃣ Safety filter
    const unsafeKeywords = ["suicide", "kill", "harm", "drugs", "self-harm", "die", "weapon"]
    if (unsafeKeywords.some((word) => message.toLowerCase().includes(word))) {
      return NextResponse.json(
        { reply: "I’m here to support you safely. If you are in danger, please contact a trusted adult or professional." },
        { status: 200 }
      )
    }

    let reply = ""

    // 2️⃣ Try OpenAI first
    try {
      const OPENAI_API_KEY = process.env.OPENAI_API_KEY
      if (OPENAI_API_KEY) {
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
                content: "You are a kind, encouraging AI. Never give medical advice or unsafe instructions."
              },
              { role: "user", content: message }
            ],
            max_tokens: 150
          })
        })

        const data = await response.json()
        reply = data.choices?.[0]?.message?.content
      }
    } catch (err) {
      // OpenAI failed, fallback will run
      console.log("OpenAI error, using fallback:", err)
    }

    // 3️⃣ Fallback to HuggingFace free model if OpenAI failed
    if (!reply) {
      try {
        const hfRes = await fetch(HF_MODEL_URL, {
          method: "POST",
          headers: {
            "Authorization": HF_API_KEY ? `Bearer ${HF_API_KEY}` : "",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ inputs: `Encourage the user: "${message}"` })
        })
        const hfData = await hfRes.json()
        if (Array.isArray(hfData) && hfData[0]?.generated_text) {
          reply = hfData[0].generated_text
        }
      } catch (err) {
        console.log("HuggingFace fallback failed:", err)
      }
    }

    // 4️⃣ Last fallback (static message)
    if (!reply) {
      reply = "I’m here for you. Even if AI isn’t available, remember you are valuable."
    }

    return NextResponse.json({ reply }, { status: 200 })

  } catch (err) {
    return NextResponse.json(
      { reply: "Oops, something went wrong. Try again." },
      { status: 500 }
    )
  }
}
