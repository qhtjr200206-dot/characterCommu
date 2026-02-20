import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// 내 캐릭터 목록 조회
export async function GET() {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const characters = await prisma.character.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json({ characters });
    } catch (error) {
        return NextResponse.json({ error: "DB Error" }, { status: 500 });
    }
}

// 캐릭터 생성
export async function POST(req) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const data = await req.json();
        const character = await prisma.character.create({
            data: {
                ...data,
                age: data.age ? Number(data.age) : null,
                userId: session.user.id,
            },
        });
        return NextResponse.json({ character }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Create Error" }, { status: 500 });
    }
}
