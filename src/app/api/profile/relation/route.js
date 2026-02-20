import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { characterId, targetId, relationType, description } = await req.json();

        // 소유권 확인
        const character = await prisma.character.findUnique({ where: { id: characterId } });
        if (character.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const relation = await prisma.characterRelation.create({
            data: {
                fromCharacterId: characterId,
                toCharacterId: targetId,
                relationType,
                description,
            },
            include: { toCharacter: true }
        });

        return NextResponse.json({ relation }, { status: 201 });
    } catch (error) {
        console.error("관계 생성 에러:", error);
        return NextResponse.json({ error: "Relation Create Error" }, { status: 500 });
    }
}
