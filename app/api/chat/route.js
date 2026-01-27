import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    status: "OK",
    message: "Chat API is reachable",
  })
}

export async function POST(req) {
  try {
    const body = await req.json()
    const userMessage = body.message || ""

    return NextResponse.json({
      reply: "✅ API received your message: " + userMessage,
    })
  } catch (err) {
    return NextResponse.json(
      { error: "API crashed", details: err.message },
      { status: 500 }
    )
  }
}
