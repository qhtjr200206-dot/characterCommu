// lib/gm.js — SERVER-SIDE ONLY
// GM 봇 나레이션 요청 헬퍼. 클라이언트 컴포넌트에서 직접 임포트하지 마세요.
// /api/gm/narrate 라우트에서만 사용합니다.

const BOT_URL = process.env.GM_BOT_URL;
const SECRET  = process.env.BOT_INTERNAL_SECRET;

/**
 * GM 봇에 나레이션을 요청합니다.
 *
 * @param {{
 *   mode: "opening"|"reaction"|"atmosphere",
 *   title: string,
 *   context: string,
 *   recentMessages: string[],
 *   choice?: string,
 *   characters?: string[],
 * }} params
 * @returns {Promise<string>} ✶-접두사 나레이션 문자열, 실패 시 ""
 */
export async function requestGmNarration({ mode, title, context, recentMessages = [], choice = null, characters = [] }) {
    if (!BOT_URL || !SECRET) {
        console.warn("[gm.js] GM_BOT_URL 또는 BOT_INTERNAL_SECRET이 설정되지 않았습니다.");
        return "";
    }

    try {
        const res = await fetch(`${BOT_URL.replace(/\/$/, "")}/gm/narrate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Internal-Secret": SECRET,
            },
            body: JSON.stringify({ mode, title, context, recentMessages, choice, characters }),
            cache: "no-store",  // 나레이션은 항상 새로 생성
        });

        if (!res.ok) {
            console.error(`[gm.js] 봇 응답 오류: HTTP ${res.status}`);
            return "";
        }

        const data = await res.json();
        return data.narration ?? "";
    } catch (err) {
        console.error("[gm.js] GM 봇 연결 실패:", err.message);
        return "";
    }
}
