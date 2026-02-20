"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import styles from "./chat.module.css";

export default function ChatRoom({ investigation, userId, userName, role, isParticipant, isAdmin }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [activeSceneId, setActiveSceneId] = useState(1);
    const [isAiMode, setIsAiMode] = useState(true); // AI 모드 여부
    const messagesEndRef = useRef(null);

    const isSpectator = role === "SPECTATOR" || !isParticipant;
    const script = investigation.script;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // 장면 진행 (AI 스크립트 기반)
    const triggerScene = async (sceneId) => {
        const scene = script?.scenes?.find(s => s.id === sceneId);
        if (!scene) return;

        const payload = {
            investigationId: investigation.id,
            userId: null,
            content: JSON.stringify(scene),
            messageType: "SCRIPT",
        };

        await fetch(`/api/investigation/${investigation.id}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        setActiveSceneId(sceneId + 1);
    };

    // 선택지 클릭 처리
    const handleChoice = async (choice) => {
        if (isSpectator) return;

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
    };

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
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'InvestigationMessage', filter: `investigationId=eq.${investigation.id}` }, (payload) => {
                const newMessage = payload.new;
                if (!isSpectator && newMessage.messageType === "SPECTATOR") return;
                setMessages((prev) => [...prev, newMessage]);
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [investigation.id, isSpectator]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        // 모드에 따른 메시지 타입 결정
        const messageType = isAdmin && !isAiMode ? "SCRIPT" : (isSpectator ? "SPECTATOR" : "USER_CHAT");

        const payload = {
            investigationId: investigation.id,
            userId,
            userName: isAdmin && !isAiMode ? "GM" : userName,
            content: input,
            messageType
        };

        setInput("");
        await fetch(`/api/investigation/${investigation.id}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
    };

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
                        {isAiMode && (
                            <button className="btn btn-primary btn-sm" onClick={() => triggerScene(activeSceneId)}>
                                장면 재생 (Scene {activeSceneId})
                            </button>
                        )}
                    </div>
                </div>
            )}
            <div className={styles.messageList}>
                {messages.map((msg, idx) => {
                    const isMine = msg.userId === userId;
                    const isSystem = !msg.userId;
                    const isSpecMsg = msg.messageType === "SPECTATOR";
                    const isScript = msg.messageType === "SCRIPT";
                    const isChoice = msg.messageType === "CHOICE";

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
                                                <button key={ci} className={styles.choiceBtn} onClick={() => handleChoice(choice)} disabled={isSpectator}>
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
                        } catch (e) {
                            return <div key={idx} className={styles.systemMessage}>{msg.content}</div>;
                        }
                    }

                    if (isSystem || isChoice) {
                        return <div key={idx} className={isChoice ? styles.choiceResultMessage : styles.systemMessage}>{msg.content}</div>;
                    }

                    return (
                        <div key={idx} className={`${styles.messageWrapper} ${isMine ? styles.myMessage : styles.otherMessage} ${isSpecMsg ? styles.spectatorMessage : ''}`}>
                            {!isMine && <div className={styles.messageSender}>{msg.user?.nickname || "GM"} {isSpecMsg && " (관전)"}</div>}
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
                        placeholder={isAdmin && !isAiMode ? "GM 스크립트 작성..." : (isSpectator ? "관전자 채팅..." : "메시지를 입력하세요...")}
                        disabled={!isParticipant}
                    />
                    <button type="submit" className="btn btn-primary" disabled={!isParticipant || !input.trim()}>
                        {isAdmin && !isAiMode ? "스크립트 전송" : "전송"}
                    </button>
                </form>
            </div>
        </div>
    );
}
