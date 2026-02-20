import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// 조사 생성
export async function POST(req) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
        }

        const { title, type, points, items, script } = await req.json();

        if (!title || !points?.length || !script) {
            return NextResponse.json({ error: "필수 정보가 누락되었습니다." }, { status: 400 });
        }

        const investigation = await prisma.investigation.create({
            data: {
                title,
                type,
                script,
                adminId: session.user.id,
                points: {
                    create: points.map((p, i) => ({
                        name: p.name,
                        description: p.description,
                        difficulty: Number(p.difficulty),
                        order: i,
                    })),
                },
                items: {
                    create: items.map((item) => ({
                        name: item.name,
                        description: item.description,
                        condition: item.condition,
                    })),
                },
            },
        });

        return NextResponse.json({ success: true, investigationId: investigation.id }, { status: 201 });
    } catch (error) {
        console.error("조사 생성 에러:", error);
        return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
    }
}

// 참여 가능한 조사 목록 조회
export async function GET(req) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
        }

        const investigations = await prisma.investigation.findMany({
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                title: true,
                type: true,
                status: true,
                createdAt: true,
                _count: {
                    select: { participants: true },
                },
            },
        });

        return NextResponse.json({ investigations });
    } catch (error) {
        console.error("조사 목록 조회 에러:", error);
        return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
    }
}
