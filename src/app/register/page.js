"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./register.module.css";

function RegisterForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const code = searchParams.get("code") || "";

    const [form, setForm] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        nickname: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.email || !form.password || !form.nickname) {
            setError("모든 필드를 입력해 주세요.");
            return;
        }

        if (form.password !== form.confirmPassword) {
            setError("비밀번호가 일치하지 않습니다.");
            return;
        }

        if (form.password.length < 8) {
            setError("비밀번호는 최소 8자 이상이어야 합니다.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: form.email,
                    password: form.password,
                    nickname: form.nickname,
                    inviteCode: code,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "회원가입에 실패했습니다.");
                return;
            }

            router.push("/login?registered=true");
        } catch (err) {
            setError("서버 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    if (!code) {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <h1 className={styles.title}>접근 불가</h1>
                    <p className={styles.subtitle}>유효한 초대 코드가 필요합니다.</p>
                    <a href="/" className="btn btn-primary w-full" style={{ marginTop: 16 }}>
                        메인으로 돌아가기
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>회원가입</h1>
                <p className={styles.subtitle}>
                    초대 코드 <span className={styles.codeHighlight}>{code}</span> 로 가입합니다
                </p>

                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="email" className="input-label">이메일</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            className="input-field"
                            placeholder="example@email.com"
                            value={form.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="nickname" className="input-label">닉네임</label>
                        <input
                            id="nickname"
                            name="nickname"
                            type="text"
                            className="input-field"
                            placeholder="커뮤니티에서 사용할 닉네임"
                            value={form.nickname}
                            onChange={handleChange}
                            maxLength={20}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="password" className="input-label">비밀번호</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            className="input-field"
                            placeholder="최소 8자 이상"
                            value={form.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="confirmPassword" className="input-label">비밀번호 확인</label>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            className="input-field"
                            placeholder="비밀번호 재입력"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {error && <p className={styles.error}>{error}</p>}

                    <button
                        id="register-submit-btn"
                        type="submit"
                        className="btn btn-primary w-full btn-lg"
                        disabled={loading}
                    >
                        {loading ? "처리 중..." : "가입하기"}
                    </button>
                </form>

                <div className={styles.loginHint}>
                    이미 계정이 있으신가요?{" "}
                    <a href="/login">로그인</a>
                </div>
            </div>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={
            <div className={styles.container}>
                <div className="loading-overlay">
                    <div className="spinner spinner-lg"></div>
                    <p>로딩 중...</p>
                </div>
            </div>
        }>
            <RegisterForm />
        </Suspense>
    );
}
