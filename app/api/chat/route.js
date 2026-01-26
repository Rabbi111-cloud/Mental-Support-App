import { NextResponse } from "next/server"

export async function POST(req) {
  return NextResponse.json({
    reply: "✅ API is working. This is a test response."
  })
}
