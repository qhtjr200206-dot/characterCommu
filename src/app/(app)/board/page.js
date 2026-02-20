"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

export default function BoardPage() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState("전체");

    const categories = ["전체", "공지사항", "자유잡담", "창작물", "조사후기"];

    useEffect(() => {
        fetchPosts();
    }, [category]);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const url = category === "전체" ? "/api/board" : `/api/board?category=${encodeURIComponent(category)}`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setPosts(data.posts);
            }
        } catch (err) {
            console.error("게시글 로딩 실패:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="flex-between mb-lg">
                <div>
                    <h1 className="page-title">📝 일반 게시판</h1>
                    <p className="page-subtitle">자유롭게 이야기하고 작품을 공유하세요. (이미지 및 최대 5분 영상 첨부 가능)</p>
                </div>
                <Link href="/board/write" className="btn btn-primary">
                    글쓰기
                </Link>
            </div>

            {/* 카테고리 필터 */}
            <div className="flex gap-sm mb-lg" style={{ overflowX: "auto", paddingBottom: "8px" }}>
                {categories.map(c => (
                    <button
                        key={c}
                        className={`btn btn-sm ${category === c ? "btn-accent" : "btn-secondary"}`}
                        onClick={() => setCategory(c)}
                        style={{ whiteSpace: "nowrap" }}
                    >
                        {c}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="loading-overlay"><div className="spinner"></div></div>
            ) : posts.length === 0 ? (
                <div className="empty-state card mt-xl">
                    <div className="empty-state-icon">📝</div>
                    <p className="empty-state-text">해당 카테고리에 게시물이 없습니다.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-sm">
                    {posts.map(post => (
                        <Link key={post.id} href={`/board/${post.id}`} className="card" style={{ padding: "16px", textDecoration: "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ flex: 1, overflow: "hidden" }}>
                                <div className="flex items-center gap-sm mb-xs">
                                    <span className="badge badge-primary">{post.category}</span>
                                    <h3 className="text-md font-bold truncate" style={{ color: "var(--color-text-primary)", maxWidth: "80%" }}>
                                        {post.title}
                                    </h3>
                                    {post.media.length > 0 && <span className="text-accent text-sm">📎</span>}
                                </div>
                                <div className="flex text-muted text-sm gap-md">
                                    <span>{post.user?.nickname || "알 수 없음"}</span>
                                    <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ko })}</span>
                                    <span>조회 {post.views}</span>
                                    <span>댓글 {post._count?.comments || 0}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
