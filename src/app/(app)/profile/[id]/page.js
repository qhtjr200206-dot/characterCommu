import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import RelationSection from "./RelationSection";
import { notFound } from "next/navigation";

export default async function CharacterDetailPage({ params }) {
    const session = await auth();
    const { id } = await params;

    const character = await prisma.character.findUnique({
        where: { id },
        include: {
            user: { select: { nickname: true } },
            relationsFrom: {
                include: { toCharacter: true }
            },
            relationsTo: {
                include: { fromCharacter: true }
            }
        }
    });

    if (!character) notFound();

    const isOwner = session?.user?.id === character.userId;

    // 모든 관계 합치기 (내가 주체인 경우 + 대상인 경우)
    const allRelations = [
        ...character.relationsFrom.map(r => ({ ...r, person: r.toCharacter })),
        ...character.relationsTo.map(r => ({ ...r, person: r.fromCharacter }))
    ];

    return (
        <div className="animate-fade-in">
            <div className="mb-lg">
                <Link href="/profile" className="text-accent text-sm mb-sm inline-block">← 목록으로 돌아가기</Link>
                <div className="flex items-center gap-lg">
                    <div className="avatar-placeholder avatar-xl">
                        {character.profileImage ? <img src={character.profileImage} alt="" className="avatar avatar-xl" /> : character.name.charAt(0)}
                    </div>
                    <div>
                        <h1 className="page-title mb-xs">{character.name}</h1>
                        <p className="text-muted">{character.affiliation || "소속 없음"} • {character.age || "?"}세</p>
                    </div>
                </div>
            </div>

            <div className="grid-3">
                <div className="col-span-2 flex flex-col gap-lg">
                    <section className="card">
                        <h2 className="card-title mb-md">👤 캐릭터 설정</h2>
                        <div className="flex flex-col gap-md">
                            <div>
                                <label className="text-sm font-bold text-muted block mb-xs">성격</label>
                                <p className="whitespace-pre-wrap">{character.personality || "미설정"}</p>
                            </div>
                            <div className="mt-md">
                                <label className="text-sm font-bold text-muted block mb-xs">배경 스토리</label>
                                <p className="whitespace-pre-wrap">{character.background || "미설정"}</p>
                            </div>
                        </div>
                    </section>

                    {/* 실시간 관계도 섹션 */}
                    <RelationSection
                        characterId={character.id}
                        initialRelations={allRelations}
                        isOwner={isOwner}
                    />
                </div>

                <div className="flex flex-col gap-lg">
                    <section className="card">
                        <h2 className="card-title mb-md">ℹ️ 정보</h2>
                        <div className="text-sm flex flex-col gap-sm">
                            <div className="flex-between">
                                <span className="text-muted">제작자</span>
                                <span>{character.user.nickname}</span>
                            </div>
                            <div className="flex-between">
                                <span className="text-muted">생성일</span>
                                <span>{new Date(character.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                        {isOwner && (
                            <button className="btn btn-secondary w-full mt-lg">프로필 사진 업로드</button>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}
