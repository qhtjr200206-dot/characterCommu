import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    },
});

const BUCKET = process.env.R2_BUCKET_NAME || "character-commu";
const PUBLIC_URL = process.env.R2_PUBLIC_URL || "";

// 최대 파일 크기: 50MB (5분 MP4 영상 압축 기준)
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

// 허용 파일 형식
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
export const ALLOWED_VIDEO_TYPES = ["video/mp4"];
export const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

/**
 * 파일을 Cloudflare R2에 업로드합니다.
 * @param {Buffer} fileBuffer - 파일 버퍼
 * @param {string} key - 저장할 키(경로)
 * @param {string} contentType - MIME 타입
 * @returns {Promise<string>} 파일의 공개 URL
 */
export async function uploadFile(fileBuffer, key, contentType) {
    const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
    });

    await R2.send(command);
    return `${PUBLIC_URL}/${key}`;
}

/**
 * 프리사인 업로드 URL을 생성합니다 (클라이언트 직접 업로드용).
 * @param {string} key - 저장할 키(경로)
 * @param {string} contentType - MIME 타입
 * @param {number} expiresIn - URL 유효 시간 (초)
 * @returns {Promise<string>} 프리사인 URL
 */
export async function getUploadUrl(key, contentType, expiresIn = 3600) {
    const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        ContentType: contentType,
    });

    return getSignedUrl(R2, command, { expiresIn });
}

/**
 * R2에서 파일을 삭제합니다.
 * @param {string} key - 삭제할 파일 키
 */
export async function deleteFile(key) {
    const command = new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: key,
    });

    await R2.send(command);
}

/**
 * 파일 키를 URL에서 추출합니다.
 * @param {string} url - 파일 URL
 * @returns {string} 파일 키
 */
export function extractKeyFromUrl(url) {
    if (url.startsWith(PUBLIC_URL)) {
        return url.slice(PUBLIC_URL.length + 1);
    }
    return url;
}

/**
 * 고유한 파일 키를 생성합니다.
 * @param {string} folder - 폴더 경로 (예: "posts", "profiles")
 * @param {string} fileName - 원본 파일명
 * @returns {string} 고유 키
 */
export function generateFileKey(folder, fileName) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const ext = fileName.split(".").pop();
    return `${folder}/${timestamp}-${random}.${ext}`;
}

/**
 * 파일 유효성을 검증합니다.
 * @param {string} contentType - MIME 타입
 * @param {number} fileSize - 파일 크기 (bytes)
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateFile(contentType, fileSize) {
    if (!ALLOWED_TYPES.includes(contentType)) {
        return {
            valid: false,
            error: `허용되지 않는 파일 형식입니다. (허용: JPG, PNG, GIF, WebP, MP4)`,
        };
    }

    if (fileSize > MAX_FILE_SIZE) {
        return {
            valid: false,
            error: `파일 크기가 ${MAX_FILE_SIZE / 1024 / 1024}MB를 초과합니다.`,
        };
    }

    return { valid: true };
}

export default R2;
