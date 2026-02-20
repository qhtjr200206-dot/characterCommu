import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request) {
    try {
        const { email, password, nickname, inviteCode } = await request.json();

        // 유효성 검증
        if (!email || !password || !nickname || !inviteCode) {
            return NextResponse.json(
                { error: "모든 필드를 입력해 주세요." },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: "비밀번호는 최소 8자 이상이어야 합니다." },
                { status: 400 }
            );
        }

        // 초대코드 재검증
        const invite = await prisma.inviteCode.findUnique({
            where: { code: inviteCode.toUpperCase() },
        });

        if (!invite || !invite.active || invite.usedCount >= invite.maxUses) {
            return NextResponse.json(
                { error: "유효하지 않은 초대 코드입니다." },
                { status: 400 }
            );
        }

        if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
            return NextResponse.json(
                { error: "만료된 초대 코드입니다." },
                { status: 400 }
            );
        }

        // 이메일 중복 확인
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "이미 사용 중인 이메일입니다." },
                { status: 409 }
            );
        }

        // 비밀번호 해시
        const hashedPassword = await bcrypt.hash(password, 12);

        // 유저 생성 + 초대코드 사용 카운트 증가 (트랜잭션)
        const user = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    nickname,
                    inviteCodeId: invite.id,
                },
            });

            await tx.inviteCode.update({
                where: { id: invite.id },
                data: { usedCount: { increment: 1 } },
            });

            return newUser;
        });

        return NextResponse.json(
            {
                message: "회원가입이 완료되었습니다.",
                user: {
                    id: user.id,
                    email: user.email,
                    nickname: user.nickname,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("회원가입 에러:", error);
        return NextResponse.json(
            { error: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
