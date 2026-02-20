import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import ChatRoom from "./ChatRoom";
import { notFound } from "next/navigation";

export default async function InvestigationChatPage({ params }) {
    const session = await auth();
    if (!session?.user) {
        return <div>로그인이 필요합니다.</div>;
    }

    const { id } = await params;

    const investigation = await prisma.investigation.findUnique({
        where: { id },
        include: {
            participants: true,
            points: true,
            items: true,
        }
    });

    if (!investigation) {
        notFound();
    }

    // 참가자 여부 확인
    const participant = investigation.participants.find(p => p.userId === session.user.id);
    const isSpectator = participant?.role === "SPECTATOR";
    const isParticipant = !!participant;

    return (
        <div className="animate-fade-in" style={{ height: "calc(100vh - 120px)", display: "flex", flexDirection: "column" }}>
            <div className="flex-between mb-md">
                <div>
                    <h1 className="page-title" style={{ fontSize: "1.5rem", marginBottom: 0 }}>
                        {investigation.title}
                    </h1>
                    <p className="text-muted text-sm mt-xs">
                        {investigation.type === "SOLO" ? "1인 조사" : "다인 조사"}
                        {isSpectator && " • 👁️ 관전 모드"}
                    </p>
                </div>
                {investigation.adminId === session.user.id && (
                    <div className="flex gap-sm">
                        <span className="badge badge-accent">Host Admin</span>
                    </div>
                )}
            </div>

            <div className="card" style={{ flex: 1, display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
                <ChatRoom
                    investigation={investigation}
                    userId={session.user.id}
                    userName={session.user.name}
                    role={participant?.role || "SPECTATOR"}
                    isParticipant={isParticipant}
                    isAdmin={investigation.adminId === session.user.id}
                />
            </div>
        </div >
    );
}
