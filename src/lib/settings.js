import prisma from "./prisma";

export async function getSiteSettings() {
    try {
        // Prisma 클라이언트가 최신화되지 않았을 경우(db push 후 generate 실패 등)를 대비한 체크
        if (!prisma.siteSetting) {
            console.warn("Prisma Client에 SiteSetting 모델이 없습니다. 'npx prisma generate'가 필요합니다.");
            return {
                appName: "Character Commu",
                themeMode: "dark",
                themeColor: "#7c5cff",
                fontFamily: "Inter",
                bgmUrl: "",
                bgmVolume: 0.5
            };
        }

        let settings = await prisma.siteSetting.findUnique({
            where: { id: "default" }
        });

        if (!settings) {
            settings = await prisma.siteSetting.create({
                data: { id: "default" }
            });
        }

        return settings;
    } catch (error) {
        console.error("Failed to fetch site settings:", error);
        return {
            appName: "Character Commu",
            themeMode: "dark",
            themeColor: "#7c5cff",
            fontFamily: "Inter",
            bgmUrl: "",
            bgmVolume: 0.5
        };
    }
}
