"use client";

import { useState, useEffect } from "react";
import styles from "./profile.module.css";

export default function ProfileListPage() {
    const [characters, setCharacters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedChar, setSelectedChar] = useState(null); // 수정 또는 상세용

    const fetchCharacters = async () => {
        try {
            const res = await fetch("/api/profile");
            if (res.ok) {
                const data = await res.json();
                setCharacters(data.characters);
            }
        } catch (err) {
            console.error("캐릭터 로딩 실패:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCharacters();
    }, []);

    return (
        <div className="animate-fade-in">
            <div className="flex-between mb-lg">
                <div>
                    <h1 className="page-title">🎭 캐릭터 프로필</h1>
                    <p className="page-subtitle">나만의 매력적인 캐릭터를 생성하고 AI 대사를 테스트하세요.</p>
                </div>
                <button className="btn btn-primary" onClick={() => { setSelectedChar(null); setShowModal(true); }}>
                    + 새 캐릭터 추가
                </button>
            </div>

            {loading ? (
                <div className="loading-overlay"><div className="spinner"></div></div>
            ) : characters.length === 0 ? (
                <div className="empty-state card mt-xl">
                    <div className="empty-state-icon">👥</div>
                    <p className="empty-state-text">아직 등록된 캐릭터가 없습니다. 첫 번쨰 캐릭터를 만들어 보세요!</p>
                </div>
            ) : (
                <div className="grid-3 mt-md">
                    {characters.map((char) => (
                        <div key={char.id} className="card">
                            <div className={styles.charHeader}>
                                <div className="avatar-placeholder avatar-lg">
                                    {char.profileImage ? (
                                        <img src={char.profileImage} alt={char.name} className="avatar avatar-lg" />
                                    ) : char.name.charAt(0)}
                                </div>
                                <div className={styles.charInfo}>
                                    <h3 className="card-title">{char.name}</h3>
                                    <p className="text-muted text-sm">{char.affiliation || "소속 없음"} • {char.age || "?"}세</p>
                                </div>
                            </div>
                            <p className={styles.charDesc}>{char.personality || "성격 미설정"}</p>
                            <div className="grid-2 mt-md">
                                <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedChar(char); setShowModal(true); }}>수정</button>
                                <a href={`/profile/${char.id}`} className="btn btn-ghost btn-sm text-center">상세/관계도</a>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 캐릭터 생성/수정 모달 */}
            {showModal && (
                <CharacterFormModal
                    onClose={() => setShowModal(false)}
                    initialData={selectedChar}
                    onSuccess={fetchCharacters}
                />
            )}
        </div>
    );
}

// 모달 컴포넌트 (파일 하나에 작성하거나 분리 가능)
function CharacterFormModal({ onClose, initialData, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [testDialogue, setTestDialogue] = useState("");
    const [formData, setFormData] = useState(initialData || {
        name: "",
        age: "",
        affiliation: "",
        personality: "",
        background: "",
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const method = initialData ? "PUT" : "POST";
            const res = await fetch("/api/profile", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                onSuccess();
                onClose();
            }
        } catch (err) {
            alert("저장 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const handleAIDialogue = async () => {
        if (!formData.name || !formData.personality) return alert("이름과 성격을 입력해야 AI가 말투를 파악할 수 있습니다.");
        setLoading(true);
        try {
            const res = await fetch("/api/ai/dialogue", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ character: formData, situation: "처음 보는 사람에게 자신을 소개하는 상황" }),
            });
            const data = await res.json();
            setTestDialogue(data.dialogue);
        } catch (err) {
            alert("AI 대사 생성 실패");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">{initialData ? "캐릭터 수정" : "새 캐릭터 생성"}</h2>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-md">
                    <div className="grid-2">
                        <div className="input-group">
                            <label className="input-label">이름</label>
                            <input className="input-field" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                        </div>
                        <div className="input-group">
                            <label className="input-label">나이</label>
                            <input type="number" className="input-field" value={formData.age} onChange={e => setFormData({ ...formData, age: e.target.value })} />
                        </div>
                    </div>
                    <div className="input-group">
                        <label className="input-label">소속</label>
                        <input className="input-field" value={formData.affiliation} onChange={e => setFormData({ ...formData, affiliation: e.target.value })} />
                    </div>
                    <div className="input-group">
                        <label className="input-label">성격 (AI 대사 생성에 중요)</label>
                        <textarea className="input-field" value={formData.personality} onChange={e => setFormData({ ...formData, personality: e.target.value })} placeholder="예: 시니컬하지만 동물을 사랑함, 예의 바른 말투" />
                    </div>

                    {/* AI 테스트 영역 */}
                    <div className="card" style={{ background: "rgba(124, 92, 255, 0.05)", border: "1px dashed var(--color-accent)" }}>
                        <div className="flex-between">
                            <span className="text-sm font-bold text-accent">✨ AI 말투 테스트</span>
                            <button type="button" className="btn btn-ghost btn-sm" onClick={handleAIDialogue} disabled={loading}>생성하기</button>
                        </div>
                        {testDialogue && <p className="mt-sm text-sm" style={{ fontStyle: "italic" }}>"{testDialogue}"</p>}
                    </div>

                    <button type="submit" className="btn btn-primary w-full mt-md" disabled={loading}>저장하기</button>
                </form>
            </div>
        </div>
    );
}
