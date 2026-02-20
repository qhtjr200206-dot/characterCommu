import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// 글쓰기 (DB 저장)
export async function POST(req) {
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ error: "권한 없음" }, { status: 401 });

        const { title, content, category, media } = await req.json();

        const post = await prisma.post.create({
            data: {
                title,
                content,
                category,
                userId: session.user.id,
                // 클라이언트가 R2에 업로드한 첨부파일 키값(미디어)을 함께 저장
                media: {
                    create: media?.map(m => ({
                        url: m.mediaUrl,
                        type: m.mediaType,
                        fileName: m.fileName || "unknown",
                        fileSize: m.fileSize || 0,
                    })) || []
                }
            }
        });

        return NextResponse.json({ post }, { status: 201 });
    } catch (error) {
        console.error("게시글 작성 에러:", error);
        return NextResponse.json({ error: "게시물을 저장하지 못했습니다." }, { status: 500 });
    }
}

// 전체 게시글 또는 카테고리별 목록 조회
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const category = searchParams.get("category");

        const posts = await prisma.post.findMany({
            where: category ? { category } : undefined,
            orderBy: { createdAt: "desc" },
            include: {
                user: { select: { nickname: true } },
                media: { select: { id: true } }, // 첨부파일 존재 여부 파악용
                _count: { select: { comments: true } }
            }
        });

        return NextResponse.json({ posts });
    } catch (error) {
        console.error("게시물 조회 에러:", error);
        return NextResponse.json({ error: "목록을 불러올 수 없습니다." }, { status: 500 });
    }
}
