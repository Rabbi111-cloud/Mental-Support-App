import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json({
    reply: "✅ CHATBOT API RESPONDED SUCCESSFULLY",
  })
}
