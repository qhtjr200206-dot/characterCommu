"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function LandingPage() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      setError("초대 코드를 입력해 주세요.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/invite/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: inviteCode.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "유효하지 않은 초대 코드입니다.");
        return;
      }

      // 초대코드가 유효하면 회원가입 페이지로 이동
      router.push(`/register?code=${encodeURIComponent(inviteCode.trim())}`);
    } catch (err) {
      setError("서버 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 배경 파티클 */}
      <div className={styles["bg-particles"]}>
        {[...Array(8)].map((_, i) => (
          <div key={i} className={styles.particle} />
        ))}
      </div>

      <main className={styles["landing-container"]}>
        <div className={styles["landing-card"]}>
          <h1 className={styles["landing-logo"]}>Character Commu</h1>
          <p className={styles["landing-subtitle"]}>
            캐릭터 설정, 조사, 그리고 교류를 위한
            <br />
            프라이빗 커뮤니티 플랫폼
          </p>

          <form className={styles["invite-form"]} onSubmit={handleSubmit}>
            <div className={styles["invite-input-wrapper"]}>
              <input
                id="invite-code-input"
                type="text"
                className={styles["invite-input"]}
                placeholder="초대 코드를 입력하세요"
                value={inviteCode}
                onChange={(e) => {
                  setInviteCode(e.target.value.toUpperCase());
                  setError("");
                }}
                maxLength={20}
                autoComplete="off"
                autoFocus
              />
            </div>

            {error && <p className={styles["error-message"]}>{error}</p>}

            <button
              id="invite-submit-btn"
              type="submit"
              className={styles["invite-btn"]}
              disabled={loading}
            >
              {loading ? "확인 중..." : "입장하기"}
            </button>
          </form>

          <div className={styles.divider}>이미 계정이 있으신가요?</div>

          <a href="/login" className={styles["login-link"]} id="login-link">
            🔑 로그인
          </a>
        </div>
      </main>
    </>
  );
}
