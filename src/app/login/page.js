"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./login.module.css";

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const registered = searchParams.get("registered");

    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.email || !form.password) {
            setError("이메일과 비밀번호를 입력해 주세요.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await signIn("credentials", {
                redirect: false,
                email: form.email,
                password: form.password,
            });

            if (res?.error) {
                setError("이메일 또는 비밀번호가 일치하지 않습니다.");
            } else {
                router.push("/dashboard");
                router.refresh(); // 세션 업데이트를 위해 새로고침 효과
            }
        } catch (err) {
            setError("서버 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = (provider) => {
        signIn(provider, { callbackUrl: "/dashboard" });
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>로그인</h1>
                <p className={styles.subtitle}>캐릭터 커뮤니티에 다시 오신 것을 환영합니다</p>

                {registered && (
                    <div className={`toast toast-success ${styles.message}`}>
                        회원가입이 완료되었습니다. 로그인해 주세요.
                    </div>
                )}

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
                        <label htmlFor="password" className="input-label">비밀번호</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            className="input-field"
                            placeholder="비밀번호"
                            value={form.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {error && <p className={styles.error}>{error}</p>}

                    <button
                        type="submit"
                        className="btn btn-primary w-full btn-lg mt-sm"
                        disabled={loading}
                    >
                        {loading ? "로그인 중..." : "이메일로 로그인"}
                    </button>
                </form>

                <div className={styles.divider}>또는 소셜 계정으로 로그인</div>

                <div className={styles.socialButtons}>
                    <button
                        type="button"
                        className={`btn btn-secondary ${styles.socialBtn}`}
                        onClick={() => handleSocialLogin("google")}
                    >
                        <img src="https://authjs.dev/img/providers/google.svg" alt="Google" width={20} height={20} />
                        Google로 계속하기
                    </button>

                    <button
                        type="button"
                        className={`btn btn-secondary ${styles.socialBtn}`}
                        onClick={() => handleSocialLogin("discord")}
                    >
                        <img src="https://authjs.dev/img/providers/discord.svg" alt="Discord" width={20} height={20} />
                        Discord로 계속하기
                    </button>
                </div>

                <div className={styles.registerHint}>
                    아직 계정이 없으신가요?{" "}
                    <a href="/">초대 코드로 시작하기</a>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="loading-overlay"><div className="spinner"></div></div>}>
            <LoginForm />
        </Suspense>
    );
}
