import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// 설정 불러오기
export async function GET() {
    try {
        if (!prisma.siteSetting) {
            return NextResponse.json({
                settings: {
                    appName: "Character Commu (Prisma Generate 필요)",
                    themeMode: "dark",
                    themeColor: "#7c5cff",
                    fontFamily: "Inter",
                    bgmUrl: "",
                    bgmVolume: 0.5
                }
            });
        }
        let settings = await prisma.siteSetting.findUnique({
            where: { id: "default" }
        });

        if (!settings) {
            // 초기 설정 생성
            settings = await prisma.siteSetting.create({
                data: { id: "default" }
            });
        }

        return NextResponse.json({ settings });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }
}

// 설정 업데이트
export async function POST(req) {
    try {
        const session = await auth();
        // 관리자 권한 확인
        if (session?.user?.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!prisma.siteSetting) {
            return NextResponse.json({ error: "데이터베이스 모델이 준비되지 않았습니다. npx prisma generate를 먼저 실행해 주세요." }, { status: 500 });
        }

        const data = await req.json();

        const settings = await prisma.siteSetting.upsert({
            where: { id: "default" },
            update: {
                appName: data.appName,
                themeMode: data.themeMode,
                themeColor: data.themeColor,
                fontFamily: data.fontFamily,
                bgmUrl: data.bgmUrl,
                bgmVolume: data.bgmVolume ? parseFloat(data.bgmVolume) : 0.5,
            },
            create: {
                id: "default",
                appName: data.appName || "Character Commu",
                themeMode: data.themeMode || "dark",
                themeColor: data.themeColor || "#7c5cff",
                fontFamily: data.fontFamily || "Inter",
                bgmUrl: data.bgmUrl || "",
                bgmVolume: data.bgmVolume ? parseFloat(data.bgmVolume) : 0.5,
            }
        });

        return NextResponse.json({ settings });
    } catch (error) {
        console.error("설정 업데이트 에러:", error);
        return NextResponse.json({ error: "Update Failed" }, { status: 500 });
    }
}
