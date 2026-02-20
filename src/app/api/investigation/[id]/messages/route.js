import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
    try {
        const { id } = await params;
        const messages = await prisma.investigationMessage.findMany({
            where: { investigationId: id },
            orderBy: { createdAt: "asc" },
            include: {
                user: { select: { nickname: true } }
            }
        });

        return NextResponse.json({ messages });
    } catch (error) {
        console.error("메시지 조회 에러:", error);
        return NextResponse.json({ error: "메시지를 불러오지 못했습니다." }, { status: 500 });
    }
}

export async function POST(req, { params }) {
    try {
        const { id } = await params;
        const { userId, content, messageType } = await req.json();

        const newMessage = await prisma.investigationMessage.create({
            data: {
                investigationId: id,
                userId: userId || null, // 시스템 메시지면 null
                content,
                messageType,
            },
            include: {
                user: { select: { nickname: true } }
            }
        });

        return NextResponse.json({ message: newMessage });
    } catch (error) {
        console.error("메시지 저장 에러:", error);
        return NextResponse.json({ error: "메시지 전송에 실패했습니다." }, { status: 500 });
    }
}
