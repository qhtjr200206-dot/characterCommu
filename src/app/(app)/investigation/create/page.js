"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./create.module.css";

export default function CreateInvestigationPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: 기본설정, 2: 포인트/물품, 3: AI스크립트

    const [formData, setFormData] = useState({
        title: "",
        type: "MULTI",
        points: [{ name: "", description: "", difficulty: 1 }],
        items: [{ name: "", description: "", condition: "" }],
    });

    const [script, setScript] = useState(null);

    // 포인트 추가/삭제
    const addPoint = () => setFormData({ ...formData, points: [...formData.points, { name: "", description: "", difficulty: 1 }] });
    const removePoint = (index) => setFormData({ ...formData, points: formData.points.filter((_, i) => i !== index) });

    // 물품 추가/삭제
    const addItem = () => setFormData({ ...formData, items: [...formData.items, { name: "", description: "", condition: "" }] });
    const removeItem = (index) => setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) });

    const handleInputChange = (category, index, field, value) => {
        const updated = [...formData[category]];
        updated[index][field] = value;
        setFormData({ ...formData, [category]: updated });
    };

    // AI 스크립트 생성 요청
    const generateAIScript = async () => {
        if (!formData.title) return alert("조사 제목을 입력해 주세요.");
        setLoading(true);
        try {
            const res = await fetch("/api/ai/investigation/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (res.ok) {
                setScript(data.script);
                setStep(3);
            } else {
                alert(data.error || "스크립트 생성 중 오류가 발생했습니다.");
            }
        } catch (err) {
            alert("서버 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    // 최종 저장
    const saveInvestigation = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/investigation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, script }),
            });
            if (res.ok) {
                alert("조사가 성공적으로 생성되었습니다.");
                router.push("/investigation");
            }
        } catch (err) {
            alert("저장 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <h1 className="page-title">새 조사 생성</h1>
            <p className="page-subtitle">AI가 보조하는 1~2시간 분량의 시나리오를 설계합니다.</p>

            {/* 단계 표시 */}
            <div className={styles.stepper}>
                <div className={`${styles.step} ${step >= 1 ? styles.active : ""}`}>1. 기본 정보</div>
                <div className={`${styles.step} ${step >= 2 ? styles.active : ""}`}>2. 포인트 & 물품</div>
                <div className={`${styles.step} ${step >= 3 ? styles.active : ""}`}>3. 스크립트 확정</div>
            </div>

            <div className="card mt-lg">
                {step === 1 && (
                    <div className={styles.stepContent}>
                        <div className="input-group">
                            <label className="input-label">조사 제목</label>
                            <input
                                className="input-field"
                                placeholder="예: 버려진 저택의 비밀"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>
                        <div className="input-group mt-md">
                            <label className="input-label">조사 유형</label>
                            <select
                                className="input-field"
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option value="SOLO">1인 조사 (Solo)</option>
                                <option value="MULTI">다인 조사 (Multiplayer)</option>
                            </select>
                        </div>
                        <button className="btn btn-primary mt-lg w-full" onClick={() => setStep(2)}>다음 단계</button>
                    </div>
                )}

                {step === 2 && (
                    <div className={styles.stepContent}>
                        <section>
                            <div className="flex-between mb-md">
                                <h3 className="card-title">📍 조사 포인트 (주요 장소)</h3>
                                <button className="btn btn-secondary btn-sm" onClick={addPoint}>+ 추가</button>
                            </div>
                            {formData.points.map((point, i) => (
                                <div key={i} className={styles.itemRow}>
                                    <input
                                        className="input-field"
                                        placeholder="장소 이름"
                                        value={point.name}
                                        onChange={(e) => handleInputChange("points", i, "name", e.target.value)}
                                    />
                                    <input
                                        className="input-field"
                                        placeholder="상세 설명"
                                        value={point.description}
                                        onChange={(e) => handleInputChange("points", i, "description", e.target.value)}
                                    />
                                    <button className="btn btn-ghost" onClick={() => removePoint(i)}>🗑️</button>
                                </div>
                            ))}
                        </section>

                        <section className="mt-xl">
                            <div className="flex-between mb-md">
                                <h3 className="card-title">📦 중요 물품 (아이템)</h3>
                                <button className="btn btn-secondary btn-sm" onClick={addItem}>+ 추가</button>
                            </div>
                            {formData.items.map((item, i) => (
                                <div key={i} className={styles.itemRow}>
                                    <input
                                        className="input-field"
                                        placeholder="물품 이름"
                                        value={item.name}
                                        onChange={(e) => handleInputChange("items", i, "name", e.target.value)}
                                    />
                                    <input
                                        className="input-field"
                                        placeholder="설명/용도"
                                        value={item.description}
                                        onChange={(e) => handleInputChange("items", i, "description", e.target.value)}
                                    />
                                    <button className="btn btn-ghost" onClick={() => removeItem(i)}>🗑️</button>
                                </div>
                            ))}
                        </section>

                        <div className="grid-2 mt-xl">
                            <button className="btn btn-secondary" onClick={() => setStep(1)}>이전</button>
                            <button className="btn btn-primary" onClick={generateAIScript} disabled={loading}>
                                {loading ? "AI 스크립트 작성 중..." : "AI 스크립트 생성 ✨"}
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && script && (
                    <div className={styles.stepContent}>
                        <div className="flex-between mb-md">
                            <h3 className="card-title">✨ 생성된 시나리오 확정 및 편집</h3>
                            <button className="btn btn-ghost btn-sm" onClick={() => {
                                try {
                                    const formatted = JSON.stringify(script, null, 2);
                                    prompt("JSON 스크립트를 복사하거나 아래 창에서 직접 수정하세요.", formatted);
                                } catch (e) { }
                            }}>JSON 보기</button>
                        </div>
                        <p className="text-sm text-muted mb-md">AI가 작성한 내용을 검토하고 필요하면 아래에서 직접 수정하세요.</p>

                        <div className={styles.scriptEditor}>
                            {script.scenes?.map((scene, i) => (
                                <div key={i} className={styles.sceneEditBox}>
                                    <div className="flex gap-sm mb-sm">
                                        <span className="badge badge-primary">Scene {scene.id}</span>
                                        <input
                                            className="input-field"
                                            style={{ flex: 1, fontWeight: 'bold' }}
                                            value={scene.title}
                                            onChange={(e) => {
                                                const newScenes = [...script.scenes];
                                                newScenes[i].title = e.target.value;
                                                setScript({ ...script, scenes: newScenes });
                                            }}
                                        />
                                    </div>
                                    <textarea
                                        className="input-field w-full"
                                        rows="3"
                                        value={scene.narration}
                                        onChange={(e) => {
                                            const newScenes = [...script.scenes];
                                            newScenes[i].narration = e.target.value;
                                            setScript({ ...script, scenes: newScenes });
                                        }}
                                        placeholder="장면 설명 및 내레이션"
                                    />
                                    <div className="mt-sm">
                                        <label className="text-xs font-bold text-muted">선택지 (Branching)</label>
                                        {scene.choices?.map((choice, ci) => (
                                            <div key={ci} className="flex gap-xs mt-xs">
                                                <input
                                                    className="input-field text-xs"
                                                    style={{ flex: 2 }}
                                                    value={choice.text}
                                                    onChange={(e) => {
                                                        const newScenes = [...script.scenes];
                                                        newScenes[i].choices[ci].text = e.target.value;
                                                        setScript({ ...script, scenes: newScenes });
                                                    }}
                                                    placeholder="선택지 내용"
                                                />
                                                <input
                                                    type="number"
                                                    className="input-field text-xs"
                                                    style={{ width: '60px' }}
                                                    value={choice.nextScene}
                                                    onChange={(e) => {
                                                        const newScenes = [...script.scenes];
                                                        newScenes[i].choices[ci].nextScene = parseInt(e.target.value);
                                                        setScript({ ...script, scenes: newScenes });
                                                    }}
                                                    placeholder="이동"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="btn btn-secondary btn-sm mt-md" onClick={() => {
                            const newId = script.scenes.length > 0 ? Math.max(...script.scenes.map(s => s.id)) + 1 : 1;
                            setScript({
                                ...script,
                                scenes: [
                                    ...script.scenes,
                                    {
                                        id: newId,
                                        title: "새 장면",
                                        narration: "설명을 입력하세요.",
                                        choices: [
                                            { text: "선택지 1", nextScene: newId + 1, reaction: "", effect: "" },
                                            { text: "선택지 2", nextScene: newId + 1, reaction: "", effect: "" },
                                            { text: "선택지 3", nextScene: newId + 1, reaction: "", effect: "" }
                                        ]
                                    }
                                ]
                            });
                        }}>+ 장면 추가</button>

                        <div className="grid-2 mt-xl">
                            <button className="btn btn-secondary" onClick={() => setStep(2)}>이전 단계로</button>
                            <button className="btn btn-primary" onClick={saveInvestigation} disabled={loading}>
                                {loading ? "저장 중..." : "최종 조사 게시하기 🚀"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
