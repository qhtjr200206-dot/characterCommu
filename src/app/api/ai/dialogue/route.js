import { NextResponse } from "next/server";
import { generateDialogue } from "@/lib/gemini";

export async function POST(req) {
    try {
        const { character, situation } = await req.json();
        const dialogue = await generateDialogue(character, situation);
        return NextResponse.json({ dialogue });
    } catch (error) {
        return NextResponse.json({ error: "AI Error" }, { status: 500 });
    }
}
