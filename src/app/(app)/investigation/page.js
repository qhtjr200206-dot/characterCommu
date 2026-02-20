import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

export default async function InvestigationPage() {
    const session = await auth();
    const isAdmin = session?.user?.role === "ADMIN";

    const investigations = await prisma.investigation.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            _count: { select: { participants: true } },
        },
    });

    return (
        <div>
            <div className="flex-between mb-lg">
                <div>
                    <h1 className="page-title">조사 게시판</h1>
                    <p className="page-subtitle">다양한 미스터리를 파헤쳐 보세요.</p>
                </div>
                {isAdmin && (
                    <Link href="/investigation/create" className="btn btn-primary">
                        + 새 조사 생성
                    </Link>
                )}
            </div>

            {investigations.length === 0 ? (
                <div className="empty-state card mt-xl">
                    <div className="empty-state-icon">🔍</div>
                    <p className="empty-state-text">아직 진행 중인 조사가 없습니다.</p>
                </div>
            ) : (
                <div className="grid-2 mt-md">
                    {investigations.map((inv) => (
                        <Link key={inv.id} href={`/investigation/${inv.id}`} className="card" style={{ textDecoration: 'none', display: 'block' }}>
                            <div className="flex-between mb-sm">
                                <span className={`badge ${inv.status === 'WAITING' ? 'badge-primary' : inv.status === 'ACTIVE' ? 'badge-warning' : 'badge-success'}`}>
                                    {inv.status === 'WAITING' ? '대기중' : inv.status === 'ACTIVE' ? '진행중' : '완료'}
                                </span>
                                <span className="badge badge-accent">{inv.type === 'SOLO' ? '1인 조사' : '다인 조사'}</span>
                            </div>
                            <h2 className="card-title mb-sm">{inv.title}</h2>
                            <div className="flex-between text-muted mt-md text-sm">
                                <span>참여자: {inv._count.participants}명</span>
                                <span>{formatDistanceToNow(new Date(inv.createdAt), { addSuffix: true, locale: ko })}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
