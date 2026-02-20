import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request) {
    try {
        const { code } = await request.json();

        if (!code) {
            return NextResponse.json(
                { error: "초대 코드를 입력해 주세요." },
                { status: 400 }
            );
        }

        const inviteCode = await prisma.inviteCode.findUnique({
            where: { code: code.toUpperCase() },
        });

        if (!inviteCode) {
            return NextResponse.json(
                { error: "존재하지 않는 초대 코드입니다." },
                { status: 404 }
            );
        }

        if (!inviteCode.active) {
            return NextResponse.json(
                { error: "비활성화된 초대 코드입니다." },
                { status: 400 }
            );
        }

        if (inviteCode.expiresAt && new Date(inviteCode.expiresAt) < new Date()) {
            return NextResponse.json(
                { error: "만료된 초대 코드입니다." },
                { status: 400 }
            );
        }

        if (inviteCode.usedCount >= inviteCode.maxUses) {
            return NextResponse.json(
                { error: "사용 횟수가 초과된 초대 코드입니다." },
                { status: 400 }
            );
        }

        return NextResponse.json({ valid: true });
    } catch (error) {
        console.error("초대코드 검증 에러:", error);
        return NextResponse.json(
            { error: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
