import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import ClientComments from "./ClientComments";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import DeleteButton from "./DeleteButton";

export default async function BoardDetailPage({ params }) {
    const session = await auth();
    const { id } = await params;

    // 조회수 증가 및 데이터 로드 트랜잭션
    const post = await prisma.$transaction(async (tx) => {
        // 1. 조회수 업데이트
        await tx.post.update({
            where: { id },
            data: { views: { increment: 1 } },
        }).catch(() => null); // 레코드가 없을 경우 에러 무시 (아래에서 404 처리)

        // 2. 게시글 상세정보 조회
        return await tx.post.findUnique({
            where: { id },
            include: {
                user: { select: { nickname: true } },
                media: true,
            },
        });
    });

    if (!post) {
        notFound();
    }

    const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "";

    return (
        <div className="animate-fade-in max-w-3xl mx-auto">
            <Link href="/board" className="text-accent text-sm mb-md inline-block">← 게시판 목록으로</Link>

            <div className="card">
                <div className="flex items-center gap-sm mb-md">
                    <span className="badge badge-primary">{post.category}</span>
                    <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>{post.title}</h1>
                </div>

                <div className="flex-between text-muted text-sm pb-md border-b mb-lg" style={{ borderColor: 'var(--glass-border)' }}>
                    <div className="flex items-center gap-md">
                        <div>작성자: <span className="font-bold">{post.user?.nickname || "알 수 없음"}</span></div>
                        {(session?.user?.id === post.userId || session?.user?.role === "ADMIN") && (
                            <DeleteButton postId={post.id} />
                        )}
                    </div>
                    <div className="flex gap-md">
                        <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ko })}</span>
                        <span>조회수 {post.views}</span>
                    </div>
                </div>

                <div className="whitespace-pre-wrap text-md mb-xl" style={{ lineHeight: 1.6, color: "var(--color-text-secondary)" }}>
                    {post.content}
                </div>

                {/* 미디어 파일 렌더링 영역 */}
                {post.media && post.media.length > 0 && (
                    <div className="flex flex-col gap-md mb-xl">
                        {post.media.map((m) => {
                            const fileUrl = `${R2_PUBLIC_URL}/${m.url}`;
                            const isVideo = m.type && m.type.startsWith("video/");

                            return (
                                <div key={m.id} className="border rounded-md overflow-hidden" style={{ borderColor: 'var(--glass-border)' }}>
                                    {isVideo ? (
                                        <video src={fileUrl} controls className="w-full" style={{ maxHeight: "500px", background: "#000" }}>
                                            브라우저가 동영상을 지원하지 않습니다.
                                        </video>
                                    ) : (
                                        <img src={fileUrl} alt="첨부 이미지" className="w-full h-auto" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="mt-lg">
                {/* 클라이언트 컴포넌트(댓글 기능) 연동 */}
                <ClientComments postId={post.id} currentUser={session?.user} />
            </div>
        </div>
    );
}
