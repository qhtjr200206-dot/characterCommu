"use client";

import { useEffect } from "react";

export default function SiteConfigHandler({ settings }) {
    useEffect(() => {
        if (!settings) return;

        // CSS 변수 적용
        const root = document.documentElement;

        // 메인 테마 색상 (Primary Color)
        if (settings.themeColor) {
            root.style.setProperty('--color-primary', settings.themeColor);
            root.style.setProperty('--color-accent', settings.themeColor); // 기존 테마와 호환
        }

        // 폰트 적용
        if (settings.fontFamily) {
            root.style.setProperty('--font-main', settings.fontFamily);
            document.body.style.fontFamily = settings.fontFamily;
        }

        // 다크/라이트 모드 클래스 전환
        if (settings.themeMode === 'light') {
            document.body.classList.add('light-mode');
            document.body.classList.remove('dark-mode');
        } else {
            document.body.classList.add('dark-mode');
            document.body.classList.remove('light-mode');
        }

        // 브라우저 탭 타이틀 변경
        if (settings.appName) {
            document.title = settings.appName;
        }

    }, [settings]);

    if (!settings?.bgmUrl) return null;

    // 유튜브 BGM 처리 (간이 플레이어)
    const getYoutubeId = (url) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url?.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const videoId = getYoutubeId(settings.bgmUrl);
    if (!videoId) return null;

    // iframe으로 배경 음악 재생 (볼륨 조절은 유튜브 API 연동이 필요하나, 여기서는 기본 재생 위주)
    return (
        <div style={{ position: 'fixed', bottom: '-100px', pointerEvents: 'none', opacity: 0 }}>
            <iframe
                width="1"
                height="1"
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}`}
                allow="autoplay"
                frameBorder="0"
            ></iframe>
        </div>
    );
}
