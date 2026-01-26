import { NextResponse } from "next/server"

export async function POST(req) {
  try {
    const { message } = await req.json()
    return NextResponse.json({
      reply: `You said: "${message}". Guide says: "I hear you. Tell me more."`,
      stage: "early"
    })
  } catch {
    return NextResponse.json({
      reply: "I’m here with you. Something went wrong, but you’re not alone.",
      stage: "early"
    })
  }
}
