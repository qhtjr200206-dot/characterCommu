"use client";

import { useState, useEffect } from "react";

export default function AdminPage() {
    const [settings, setSettings] = useState({
        appName: "Character Commu",
        themeMode: "dark",
        themeColor: "#7c5cff",
        fontFamily: "Inter",
        bgmUrl: "",
        bgmVolume: 0.5
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch("/api/admin/settings");
            if (res.ok) {
                const data = await res.json();
                if (data.settings) setSettings(data.settings);
            }
        } catch (err) {
            console.error("설정 로드 실패:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch("/api/admin/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            });
            if (res.ok) {
                alert("설정이 저장되었습니다. 페이지를 새로고침하면 적용됩니다.");
                window.location.reload();
            } else {
                const data = await res.json();
                alert(data.error || "저장에 실패했습니다.");
            }
        } catch (err) {
            alert("서버 오류가 발생했습니다.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="loading-overlay"><div className="spinner"></div></div>;

    return (
        <div className="animate-fade-in max-w-2xl">
            <div className="flex-between mb-lg">
                <div>
                    <h1 className="page-title">⚙️ 관리자 설정</h1>
                    <p className="page-subtitle">사이트의 전반적인 테마와 핵심 정보를 관리합니다.</p>
                </div>
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-lg">
                <section className="card">
                    <h2 className="card-title mb-md">기본 설정</h2>
                    <div className="input-group">
                        <label className="input-label">사이트 이름 (App Name)</label>
                        <input
                            className="input-field"
                            value={settings.appName}
                            onChange={e => setSettings({ ...settings, appName: e.target.value })}
                            placeholder="예: Character Commu"
                        />
                    </div>
                </section>

                <section className="card">
                    <h2 className="card-title mb-md">테마 및 스타일</h2>
                    <div className="grid-2">
                        <div className="input-group">
                            <label className="input-label">기본 모드</label>
                            <select
                                className="input-field"
                                value={settings.themeMode}
                                onChange={e => setSettings({ ...settings, themeMode: e.target.value })}
                            >
                                <option value="dark">다크 모드</option>
                                <option value="light">라이트 모드</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label className="input-label">테마 색상 (hex)</label>
                            <div className="flex gap-sm">
                                <input
                                    type="color"
                                    className="input-field"
                                    style={{ width: "50px", padding: "2px" }}
                                    value={settings.themeColor}
                                    onChange={e => setSettings({ ...settings, themeColor: e.target.value })}
                                />
                                <input
                                    className="input-field"
                                    value={settings.themeColor}
                                    onChange={e => setSettings({ ...settings, themeColor: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="input-group mt-md">
                        <label className="input-label">글꼴 (Font Family)</label>
                        <select
                            className="input-field"
                            value={settings.fontFamily}
                            onChange={e => setSettings({ ...settings, fontFamily: e.target.value })}
                        >
                            <option value="Inter">Inter (기본)</option>
                            <option value="'Noto Sans KR', sans-serif">Noto Sans KR</option>
                            <option value="'Roboto', sans-serif">Roboto</option>
                            <option value="'Pretendard', sans-serif">Pretendard</option>
                        </select>
                    </div>
                </section>

                <section className="card">
                    <h2 className="card-title mb-md">BGM 설정 (배경 음악)</h2>
                    <div className="input-group">
                        <label className="input-label">유튜브 URL</label>
                        <input
                            className="input-field"
                            value={settings.bgmUrl || ""}
                            onChange={e => setSettings({ ...settings, bgmUrl: e.target.value })}
                            placeholder="https://www.youtube.com/watch?v=..."
                        />
                    </div>
                    <div className="input-group mt-md">
                        <label className="input-label">볼륨 ({Math.round(settings.bgmVolume * 100)}%)</label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={settings.bgmVolume}
                            onChange={e => setSettings({ ...settings, bgmVolume: parseFloat(e.target.value) })}
                            style={{ width: "100%", accentColor: "var(--color-accent)" }}
                        />
                    </div>
                </section>

                <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
                    {saving ? "저장 중..." : "모든 설정 저장하기"}
                </button>
            </form>
        </div>
    );
}
