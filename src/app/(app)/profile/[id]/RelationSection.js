"use client";

import { useState, useEffect } from "react";

export default function RelationSection({ characterId, initialRelations, isOwner }) {
    const [relations, setRelations] = useState(initialRelations);
    const [showAdd, setShowAdd] = useState(false);
    const [allCharacters, setAllCharacters] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (showAdd) {
            fetch("/api/profile/all")
                .then(res => res.json())
                .then(data => setAllCharacters(data.characters.filter(c => c.id !== characterId)));
        }
    }, [showAdd, characterId]);

    const handleAddRelation = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const targetId = formData.get("targetId");
        const relationType = formData.get("relationType");
        const description = formData.get("description");

        setLoading(true);
        try {
            const res = await fetch("/api/profile/relation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ characterId, targetId, relationType, description }),
            });
            if (res.ok) {
                const data = await res.json();
                setRelations([...relations, { ...data.relation, person: data.relation.toCharacter }]);
                setShowAdd(false);
            }
        } catch (err) {
            alert("관계 추가 실패");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="card">
            <div className="flex-between mb-md">
                <h2 className="card-title">🔗 관계도</h2>
                {isOwner && !showAdd && <button className="btn btn-secondary btn-sm" onClick={() => setShowAdd(true)}>+ 관계 추가</button>}
            </div>

            <div className="flex flex-col gap-md">
                {relations.length === 0 ? (
                    <p className="text-muted text-center py-lg">아직 형성된 관계가 없습니다.</p>
                ) : (
                    <div className="grid-2 gap-md">
                        {relations.map((rel, i) => (
                            <div key={i} className="flex items-center gap-md p-sm border rounded-md" style={{ borderColor: 'var(--glass-border)' }}>
                                <div className="avatar-placeholder avatar-sm">
                                    {rel.person?.profileImage ? <img src={rel.person.profileImage} alt="" className="avatar avatar-sm" /> : rel.person?.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-xs">
                                        <span className="font-bold">{rel.person?.name}</span>
                                        <span className="badge badge-accent badge-sm">{rel.relationType}</span>
                                    </div>
                                    <p className="text-xs text-muted mt-xs">{rel.description || "설명 없음"}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showAdd && (
                <div className="mt-lg p-md border rounded-md" style={{ borderColor: 'var(--color-accent)', background: 'rgba(124, 92, 255, 0.02)' }}>
                    <h3 className="text-sm font-bold mb-md">새 관계 설정</h3>
                    <form onSubmit={handleAddRelation} className="flex flex-col gap-sm">
                        <div className="grid-2">
                            <select name="targetId" className="input-field" required>
                                <option value="">대상 캐릭터 선택</option>
                                {allCharacters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <input name="relationType" className="input-field" placeholder="관계 유형 (예: 라이벌, 연인)" required />
                        </div>
                        <textarea name="description" className="input-field" placeholder="관계에 대한 상세 설명" rows={2} />
                        <div className="flex gap-sm">
                            <button type="submit" className="btn btn-primary flex-1" disabled={loading}>추가</button>
                            <button type="button" className="btn btn-ghost" onClick={() => setShowAdd(false)}>취소</button>
                        </div>
                    </form>
                </div>
            )}
        </section>
    );
}
