import "./globals.css";

export const metadata = {
  title: "캐릭터 커뮤니티",
  description: "캐릭터 설정, 조사, 그리고 교류를 위한 커뮤니티 플랫폼",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        {children}
      </body>
    </html>
  );
}
