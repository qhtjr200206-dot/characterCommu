"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteButton({ postId }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        if (!confirm("정말 이 게시글을 삭제하시겠습니까? 관련 댓글도 모두 삭제됩니다.")) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/board/${postId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                alert("삭제되었습니다.");
                router.push("/board");
                router.refresh();
            } else {
                const data = await res.json();
                alert(data.error || "삭제에 실패했습니다.");
            }
        } catch (err) {
            alert("서버 통신 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            className="btn btn-ghost btn-sm text-error"
            onClick={handleDelete}
            disabled={loading}
            style={{ color: "var(--color-error, #ff4d4d)" }}
        >
            {loading ? "삭제 중..." : "삭제"}
        </button>
    );
}
