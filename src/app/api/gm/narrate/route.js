import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requestGmNarration } from "@/lib/gm";

export async function POST(req) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { mode, title, context = "", recentMessages = [], choice = null, characters = [] } = body;

    if (!["opening", "reaction", "atmosphere"].includes(mode)) {
        return NextResponse.json({ error: "invalid mode" }, { status: 400 });
    }

    // GM 봇 미설정 시 빈 나레이션 반환 (기능 자체는 정상 동작)
    const narration = await requestGmNarration({
        mode,
        title:          title ?? "",
        context,
        recentMessages: Array.isArray(recentMessages) ? recentMessages : [],
        choice,
        characters:     Array.isArray(characters) ? characters : [],
    });

    return NextResponse.json({ narration });
}
