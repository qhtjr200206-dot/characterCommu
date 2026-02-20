"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

export default function ClientComments({ postId, currentUser }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitIdx, setSubmitting] = useState(false);

    useEffect(() => {
        fetchComments();
    }, [postId]);

    const fetchComments = async () => {
        try {
            const res = await fetch(`/api/board/${postId}/comments`);
            if (res.ok) {
                const data = await res.json();
                setComments(data.comments);
            }
        } catch (err) {
            console.error("댓글 로딩 실패:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || !currentUser) return;

        setSubmitting(true);
        try {
            const res = await fetch(`/api/board/${postId}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: newComment }),
            });

            if (res.ok) {
                const data = await res.json();
                setComments([data.comment, ...comments]); // 새 댓글 맨 위에 추가
                setNewComment("");
            } else {
                alert("댓글 등록에 실패했습니다.");
            }
        } catch (err) {
            alert("서버 오류가 발생했습니다.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="card p-md">
            <h3 className="card-title text-md mb-md">댓글 {comments.length}개</h3>

            {/* 댓글 작성 영역 */}
            {currentUser ? (
                <form onSubmit={handleCommentSubmit} className="flex gap-sm mb-lg border-b pb-lg" style={{ borderColor: 'var(--glass-border)' }}>
                    <textarea
                        className="input-field"
                        rows="2"
                        placeholder={`${currentUser.name} (으)로 댓글 남기기...`}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        style={{ flex: 1, resize: 'none' }}
                    />
                    <button type="submit" className="btn btn-primary" disabled={submitIdx || !newComment.trim()}>등록</button>
                </form>
            ) : (
                <div className="text-center p-md bg-secondary rounded-md mb-lg text-sm text-muted">
                    댓글을 작성하려면 <a href="/login" className="text-accent underline">로그인</a>이 필요합니다.
                </div>
            )}

            {/* 댓글 목록 */}
            {loading ? (
                <div className="text-center text-sm text-muted">댓글 불러오는 중...</div>
            ) : comments.length === 0 ? (
                <div className="text-center text-sm text-muted py-md">첫 번째 댓글을 남겨보세요!</div>
            ) : (
                <div className="flex flex-col gap-md">
                    {comments.map((comment) => (
                        <div key={comment.id} className="flex flex-col gap-xs pb-md border-b" style={{ borderColor: 'var(--glass-border)' }}>
                            <div className="flex-between">
                                <span className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>{comment.user?.nickname || "알 수 없음"}</span>
                                <span className="text-xs text-muted">
                                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: ko })}
                                </span>
                            </div>
                            <div className="text-sm whitespace-pre-wrap" style={{ color: 'var(--color-text-secondary)' }}>
                                {comment.content}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
