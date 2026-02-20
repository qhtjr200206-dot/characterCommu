import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// 게시글 삭제
export async function DELETE(req, { params }) {
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;

        const post = await prisma.post.findUnique({
            where: { id },
            select: { userId: true }
        });

        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        // 작성자 본인 또는 관리자만 삭제 가능
        if (post.userId !== session.user.id && session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await prisma.post.delete({
            where: { id }
        });

        return NextResponse.json({ message: "Post deleted successfully" });
    } catch (error) {
        console.error("게시글 삭제 에러:", error);
        return NextResponse.json({ error: "Delete Error" }, { status: 500 });
    }
}
