import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const publicRoutes = ["/", "/login", "/register"];
const apiAuthPrefix = "/api/auth";
const apiInvitePrefix = "/api/invite";

export default auth((req) => {
    const { nextUrl } = req;
    const isLoggedIn = !!req.auth;

    const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
    const isApiInviteRoute = nextUrl.pathname.startsWith(apiInvitePrefix);
    const isPublicRoute = publicRoutes.includes(nextUrl.pathname);

    // API 라우트는 미들웨어 예외 처리 (인증 자체는 API 내부에서 검증)
    if (isApiAuthRoute || isApiInviteRoute) {
        return null;
    }

    // 비로그인 유저가 보호된 라우트 접근 시 로그인 페이지로 리다이렉트
    if (!isLoggedIn && !isPublicRoute) {
        let callbackUrl = nextUrl.pathname;
        if (nextUrl.search) {
            callbackUrl += nextUrl.search;
        }

        const encodedCallbackUrl = encodeURIComponent(callbackUrl);
        return NextResponse.redirect(new URL(`/login?callbackUrl=${encodedCallbackUrl}`, nextUrl));
    }

    // 로그인 상태에서 퍼블릭 라우트(랜딩, 로그인, 가입) 접근 시 대시보드로 이동
    if (isLoggedIn && isPublicRoute) {
        return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }

    return null;
});

export const config = {
    matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
