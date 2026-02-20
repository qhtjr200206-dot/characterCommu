"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BoardWritePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        category: "자유잡담",
        content: "",
    });
    const [files, setFiles] = useState([]);
    const [uploadProgress, setUploadProgress] = useState("");

    const categories = ["공지사항", "자유잡담", "창작물", "조사후기"];

    const handleFileChange = (e) => {
        // 다중 파일 선택 처리
        if (e.target.files) {
            setFiles(Array.from(e.target.files).slice(0, 5)); // 최대 5개 제한
        }
    };

    const uploadFilesToR2 = async (fileList) => {
        const uploadedMedia = [];

        for (let i = 0; i < fileList.length; i++) {
            const file = fileList[i];
            setUploadProgress(`파일 업로드 중... (${i + 1}/${fileList.length})`);

            // 1. 서버에 Presigned URL(업로드용 임시 티켓) 요청
            const presignRes = await fetch("/api/upload/presign", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ filename: file.name, contentType: file.type, fileSize: file.size }),
            });

            if (!presignRes.ok) throw new Error("파일 업로드 준비 실패");

            const { url, key, fileType } = await presignRes.json();

            // 2. 받은 URL을 이용해 클라이언트 화면에서 직접 Cloudflare R2로 파일 전송
            const uploadRes = await fetch(url, {
                method: "PUT",
                headers: { "Content-Type": file.type },
                body: file,
            });

            if (!uploadRes.ok) throw new Error("R2 스토리지 파일 전송 실패");

            uploadedMedia.push({ mediaUrl: key, mediaType: fileType, fileName: file.name, fileSize: file.size }); // DB에 저장될 형태
        }

        return uploadedMedia;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title.trim() || !formData.content.trim()) {
            return alert("제목과 내용을 모두 입력해 주세요.");
        }

        setLoading(true);
        setUploadProgress("");

        try {
            let finalMedia = [];

            // 파일이 첨부된 경우 클라우드 스토리지로 먼저 업로드
            if (files.length > 0) {
                finalMedia = await uploadFilesToR2(files);
            }

            setUploadProgress("게시글 저장 중...");

            // DB에 게시글 + R2에 저장된 파일 Key 등록
            const res = await fetch("/api/board", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, media: finalMedia }),
            });

            if (res.ok) {
                const data = await res.json();
                router.push(`/board/${data.post.id}`);
            } else {
                alert("게시물 업로드에 실패했습니다.");
            }
        } catch (err) {
            alert(err.message || "오류가 발생했습니다.");
        } finally {
            setLoading(false);
            setUploadProgress("");
        }
    };

    return (
        <div className="animate-fade-in max-w-2xl mx-auto">
            <h1 className="page-title mb-lg">게시글 쓰기</h1>

            <form onSubmit={handleSubmit} className="card flex flex-col gap-md">
                <div className="grid-2">
                    <div className="input-group">
                        <label className="input-label">카테고리</label>
                        <select
                            className="input-field"
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                        >
                            {categories.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="input-group">
                    <label className="input-label">제목</label>
                    <input
                        className="input-field"
                        placeholder="제목을 입력하세요"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        required
                    />
                </div>

                <div className="input-group">
                    <label className="input-label">본문</label>
                    <textarea
                        className="input-field"
                        placeholder="내용을 자유롭게 작성해 주세요."
                        rows={10}
                        value={formData.content}
                        onChange={e => setFormData({ ...formData, content: e.target.value })}
                        required
                    />
                </div>

                {/* 미디어 파일 추가 영역 */}
                <div className="input-group p-md border rounded-md" style={{ borderColor: 'var(--glass-border)', background: 'var(--color-bg-secondary)' }}>
                    <label className="input-label flex-between">
                        <span>첨부 파일 (이미지, 동영상 지원)</span>
                        <span className="text-xs text-muted">최대 5개, 영상당 최대 50MB (약 5분)</span>
                    </label>
                    <input
                        type="file"
                        accept="image/*,video/mp4,video/webm"
                        multiple
                        onChange={handleFileChange}
                        className="mt-sm"
                    />
                    {files.length > 0 && (
                        <div className="mt-sm text-sm text-accent">
                            선택된 파일: {files.length}개
                        </div>
                    )}
                </div>

                {uploadProgress && (
                    <div className="text-center text-accent text-sm font-bold">
                        {uploadProgress}
                    </div>
                )}

                <div className="flex gap-md mt-lg">
                    <button type="button" className="btn btn-secondary flex-1" onClick={() => router.back()}>취소</button>
                    <button type="submit" className="btn btn-primary flex-1" disabled={loading}>
                        {loading ? "작성 중..." : "등록하기"}
                    </button>
                </div>
            </form>
        </div>
    );
}
