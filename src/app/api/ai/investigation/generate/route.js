import { NextResponse } from "next/server";
import { generateInvestigationScript } from "@/lib/gemini";
import { auth } from "@/lib/auth";

export async function POST(req) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
        }

        const { title, type, points, items } = await req.json();

        if (!title || !points?.length) {
            return NextResponse.json({ error: "필수 정보가 누락되었습니다." }, { status: 400 });
        }

        // Gemini API를 사용하여 스크립트 생성
        const script = await generateInvestigationScript({ title, type, points, items });

        return NextResponse.json({ script });
    } catch (error) {
        console.error("AI 스크립트 생성 에러 상세:", error);
        return NextResponse.json({
            error: error.message || "스크립트 생성 중 알 수 없는 오류가 발생했습니다.",
            details: error.stack
        }, { status: 500 });
    }
}
