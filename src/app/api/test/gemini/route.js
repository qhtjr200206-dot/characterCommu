import { NextResponse } from "next/server";
import { generateText } from "@/lib/gemini";

export async function GET() {
    try {
        const testResult = await generateText("Hello, are you working? Please answer in one short sentence.", {
            temperature: 0.5,
            maxTokens: 50
        });

        return NextResponse.json({
            success: true,
            message: "Gemini API가 정상 작동 중입니다.",
            response: testResult
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
