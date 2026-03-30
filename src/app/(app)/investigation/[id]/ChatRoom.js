"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import styles from "./chat.module.css";

export default function ChatRoom({ investigation, userId, userName, role, isParticipant, isAdmin }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [activeSceneId, setActiveSceneId] = useState(1);
    const [isAiMode, setIsAiMode] = useState(true);
    const messagesEndRef = useRef(null);

    const isSpectator = role === "SPECTATOR" || !isParticipant;
    const script = investigation.script;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // ── GM 나레이션 헬퍼 ──────────────────────────────────────────────────────

    /**
     * /api/gm/narrate 서버 라우트를 통해 GM 나레이션을 요청합니다.
     * 실패 시 "" 반환 — 절대 throw하지 않습니다.
     */
    const requestGmNarration = async ({ mode, context = "", recentMessages = [], choice = null }) => {
        try {
            const res = await fetch("/api/gm/narrate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mode,
                    title: investigation.title,
                    context,
                    recentMessages,
                    choice,
                    characters: [],
                }),
            });
            if (!res.ok) return "";
            const data = await res.json();
            return data.narration ?? "";
        } catch {
            return "";
        }
    };

    /**
     * SYSTEM 타입 메시지를 조사방에 게시합니다.
     * GM 나레이션 표시에 사용합니다.
     */
    const postSystemMessage = async (content) => {
        if (!content) return;
        try {
            await fetch(`/api/investigation/${investigation.id}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    investigationId: investigation.id,
                    userId: null,
                    content,
                    messageType: "SYSTEM",
                }),
            });
        } catch {
            // 나레이션 실패는 메인 흐름에 영향을 주지 않습니다.
        }
    };

    /** 최근 USER_CHAT / CHOICE 메시지를 문자열 배열로 추출합니다. */
    const getRecentSnippet = (count = 5) =>
        messages
            .filter(m => m.messageType === "USER_CHAT" || m.messageType === "CHOICE")
            .slice(-count)
            .map(m => `${m.user?.nickname ?? "플레이어"}: ${m.content}`);

    // ── 장면 / 선택 핸들러 ────────────────────────────────────────────────────

    const triggerScene = async (sceneId) => {
        const scene = script?.scenes?.find(s => s.id === sceneId);
        if (!scene) return;

        // 1. AI 장면 스크립트 출력 (기존 동작 유지)
        await fetch(`/api/investigation/${investigation.id}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                investigationId: investigation.id,
                userId: null,
                content: JSON.stringify(scene),
                messageType: "SCRIPT",
            }),
        });

        setActiveSceneId(sceneId + 1);

        // 2. GM 오프닝 나레이션 — 비동기, 실패 무시
        requestGmNarration({
            mode: "opening",
            context: scene.narration ?? scene.title ?? "",
            recentMessages: getRecentSnippet(),
        }).then(narration => postSystemMessage(narration));
    };

    const handleChoice = async (choice) => {
        if (isSpectator) return;

        // 1. 선택 결과 게시 (기존 동작 유지)
        await fetch(`/api/investigation/${investigation.id}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                investigationId: investigation.id,
                userId: null,
                content: `> ${userName}의 선택: ${choice.text}\n\n${choice.reaction || choice.effect}`,
                messageType: "CHOICE",
            }),
        });

        // 2. GM 반응 나레이션 — 비동기, 실패 무시
        requestGmNarration({
            mode: "reaction",
            context: choice.reaction || choice.effect || "",
            recentMessages: getRecentSnippet(),
            choice: choice.text,
        }).then(narration => postSystemMessage(narration));
    };

    // ── 관리자 전용: 분위기 나레이션 ──────────────────────────────────────────

    const handleAtmosphere = async () => {
        const narration = await requestGmNarration({
            mode: "atmosphere",
            recentMessages: getRecentSnippet(8),
        });
        await postSystemMessage(narration);
    };

    // ── Effects ──────────────────────────────────────────────────────────────

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const fetchMessages = async () => {
            const res = await fetch(`/api/investigation/${investigation.id}/messages`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages);
            }
        };
        fetchMessages();

        const channelName = `investigation_${investigation.id}`;
        const channel = supabase.channel(channelName)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'InvestigationMessage',
                filter: `investigationId=eq.${investigation.id}`,
            }, (payload) => {
                const newMessage = payload.new;
                if (!isSpectator && newMessage.messageType === "SPECTATOR") return;
                setMessages((prev) => [...prev, newMessage]);
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [investigation.id, isSpectator]);

    // ── 메시지 전송 ──────────────────────────────────────────────────────────

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const messageType = isAdmin && !isAiMode ? "SCRIPT" : (isSpectator ? "SPECTATOR" : "USER_CHAT");

        const payload = {
            investigationId: investigation.id,
            userId,
            userName: isAdmin && !isAiMode ? "GM" : userName,
            content: input,
            messageType,
        };

        setInput("");
        await fetch(`/api/investigation/${investigation.id}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
    };

    // ── 렌더 ─────────────────────────────────────────────────────────────────

    return (
        <div className={styles.chatContainer}>
            {isAdmin && (
                <div className={styles.adminPanel}>
                    <div className="flex gap-md align-center">
                        <div className={styles.modeToggle}>
                            <button
                                type="button"
                                className={`${styles.toggleBtn} ${isAiMode ? styles.active : ''}`}
                                onClick={() => setIsAiMode(true)}
                            >AI 모드</button>
                            <button
                                type="button"
                                className={`${styles.toggleBtn} ${!isAiMode ? styles.active : ''}`}
                                onClick={() => setIsAiMode(false)}
                            >관리자 직접진행</button>
                        </div>
                        {isAiMode ? (
                            <>
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => triggerScene(activeSceneId)}
                                >
                                    장면 재생 (Scene {activeSceneId})
                                </button>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={handleAtmosphere}
                                    title="GM이 현재 분위기 나레이션을 생성합니다"
                                >
                                    ✶ 분위기
                                </button>
                            </>
                        ) : (
                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={handleAtmosphere}
                                title="GM이 현재 분위기 나레이션을 생성합니다"
                            >
                                ✶ 분위기
                            </button>
                        )}
                    </div>
                </div>
            )}

            <div className={styles.messageList}>
                {messages.map((msg, idx) => {
                    const isMine    = msg.userId === userId;
                    const isSystem  = !msg.userId;
                    const isSpecMsg = msg.messageType === "SPECTATOR";
                    const isScript  = msg.messageType === "SCRIPT";
                    const isChoice  = msg.messageType === "CHOICE";

                    if (!isSpectator && isSpecMsg) return null;

                    if (isScript) {
                        try {
                            if (msg.content.startsWith('{')) {
                                const sceneData = JSON.parse(msg.content);
                                return (
                                    <div key={idx} className={styles.scriptMessage}>
                                        <div className={styles.sceneTitle}>{sceneData.title}</div>
                                        <div className={styles.sceneNarration}>{sceneData.narration}</div>
                                        <div className={styles.sceneChoices}>
                                            {sceneData.choices?.map((choice, ci) => (
                                                <button
                                                    key={ci}
                                                    className={styles.choiceBtn}
                                                    onClick={() => handleChoice(choice)}
                                                    disabled={isSpectator}
                                                >
                                                    {choice.text}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            }
                            return (
                                <div key={idx} className={styles.manualScriptMessage}>
                                    <div className={styles.gmBadge}>GM Script</div>
                                    <div className={styles.sceneNarration}>{msg.content}</div>
                                </div>
                            );
                        } catch {
                            return <div key={idx} className={styles.systemMessage}>{msg.content}</div>;
                        }
                    }

                    if (isSystem || isChoice) {
                        return (
                            <div key={idx} className={isChoice ? styles.choiceResultMessage : styles.systemMessage}>
                                {msg.content}
                            </div>
                        );
                    }

                    return (
                        <div key={idx} className={`${styles.messageWrapper} ${isMine ? styles.myMessage : styles.otherMessage} ${isSpecMsg ? styles.spectatorMessage : ''}`}>
                            {!isMine && (
                                <div className={styles.messageSender}>
                                    {msg.user?.nickname || "GM"}{isSpecMsg && " (관전)"}
                                </div>
                            )}
                            <div className={styles.messageBubble}>{msg.content}</div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <div className={styles.inputArea}>
                <form onSubmit={sendMessage} className={styles.chatForm}>
                    <input
                        type="text"
                        className={styles.chatInput}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={
                            isAdmin && !isAiMode
                                ? "GM 스크립트 작성..."
                                : isSpectator ? "관전자 채팅..." : "메시지를 입력하세요..."
                        }
                        disabled={!isParticipant}
                    />
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={!isParticipant || !input.trim()}
                    >
                        {isAdmin && !isAiMode ? "스크립트 전송" : "전송"}
                    </button>
                </form>
            </div>
        </div>
    );
}
