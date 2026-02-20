import { NextResponse } from "next/server";
import { getUploadUrl, validateFile } from "@/lib/r2";
import { auth } from "@/lib/auth";

export async function POST(req) {
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ error: "권한 없음" }, { status: 401 });

        const { filename, contentType, fileSize } = await req.json();

        // 파일 사이즈/포맷 유효성 검사 (lib/r2.js 활용)
        const { isValid, reason, type } = validateFile(contentType, fileSize);
        if (!isValid) {
            return NextResponse.json({ error: reason }, { status: 400 });
        }

        // 파일명 난수화 결합
        const ext = filename.split(".").pop();
        const uniqueKey = `${session.user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

        // R2 업로드용 Presigned URL 발급
        const uploadUrl = await getUploadUrl(uniqueKey, contentType);

        return NextResponse.json({ url: uploadUrl, key: uniqueKey, fileType: type });
    } catch (error) {
        console.error("Presign URL 에러:", error);
        return NextResponse.json({ error: "업로드 주소를 생성할 수 없습니다." }, { status: 500 });
    }
}
