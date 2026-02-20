import { auth } from "@/lib/auth";

export default async function DashboardPage() {
    const session = await auth();

    return (
        <div>
            <h1 className="page-title">대시보드</h1>
            <p className="page-subtitle">안녕하세요, {session?.user?.name}님!</p>

            <div className="grid-3 mt-lg">
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">내 캐릭터</h2>
                        <span className="badge badge-accent">0</span>
                    </div>
                    <p className="text-muted text-sm mt-sm">등록된 캐릭터가 없습니다.</p>
                    <a href="/profile" className="btn btn-primary w-full mt-md">새 캐릭터 만들기</a>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">진행 중인 조사</h2>
                        <span className="badge badge-warning">0</span>
                    </div>
                    <p className="text-muted text-sm mt-sm">현재 참여 중인 조사가 없습니다.</p>
                    <a href="/investigation" className="btn btn-secondary w-full mt-md">새로운 조사 찾기</a>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">최근 게시물</h2>
                    </div>
                    <p className="text-muted text-sm mt-sm">새로운 소식이 없습니다.</p>
                    <a href="/board" className="btn btn-secondary w-full mt-md">게시판 가기</a>
                </div>
            </div>
        </div>
    );
}
