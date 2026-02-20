import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// 특정 게시물의 댓글 목록 조회
export async function GET(req, { params }) {
    try {
        const { id } = await params;
        const comments = await prisma.comment.findMany({
            where: { postId: id },
            orderBy: { createdAt: "desc" },
            include: {
                user: { select: { nickname: true } }
            }
        });
        return NextResponse.json({ comments });
    } catch (error) {
        return NextResponse.json({ error: "댓글 조회 실패" }, { status: 500 });
    }
}

// 새 댓글 등록
export async function POST(req, { params }) {
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ error: "권한 없음" }, { status: 401 });

        const { id } = await params;
        const { content } = await req.json();

        const comment = await prisma.comment.create({
            data: {
                content,
                postId: id,
                userId: session.user.id,
            },
            include: {
                user: { select: { nickname: true } }
            }
        });

        return NextResponse.json({ comment }, { status: 201 });
    } catch (error) {
        console.error("댓글 생성 에러:", error);
        return NextResponse.json({ error: "댓글 저장 실패" }, { status: 500 });
    }
}
