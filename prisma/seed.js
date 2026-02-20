const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // 1. 임시 관리자 유저 생성 (초대코드를 만들기 위해 유저가 필요함)
    const master = await prisma.user.upsert({
        where: { email: 'admin@test.com' },
        update: {},
        create: {
            email: 'admin@test.com',
            nickname: '마스터관리자',
            role: 'ADMIN',
        },
    });

    // 2. 초대 코드 생성
    const invite = await prisma.inviteCode.upsert({
        where: { code: 'WELCOME2026' },
        update: { active: true },
        create: {
            code: 'WELCOME2026',
            createdBy: master.id,
            maxUses: 100,
            active: true,
        },
    });

    console.log('✅ 초기 데이터 생성 완료!');
    console.log('🎟️ 사용 가능 초대 코드: WELCOME2026');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
