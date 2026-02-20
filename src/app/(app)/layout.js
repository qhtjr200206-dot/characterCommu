import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import styles from "./layout.module.css";
import { SignOutButton } from "@/components/SignOutButton";
import { getSiteSettings } from "@/lib/settings";
import SiteConfigHandler from "@/components/SiteConfigHandler";

export default async function AppLayout({ children }) {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    const { user } = session;
    const settings = await getSiteSettings();

    return (
        <div className={styles.appContainer}>
            <SiteConfigHandler settings={settings} />
            {/* 사이드바 네비게이션 */}
            <aside className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <Link href="/dashboard" className={styles.logo}>
                        {settings.appName || "Character Commu"}
                    </Link>
                </div>

                <nav className={styles.navMenu}>
                    <div className={styles.navGroup}>
                        <div className={styles.navLabel}>메뉴</div>
                        <Link href="/dashboard" className={styles.navItem}>
                            📊 대시보드
                        </Link>
                        <Link href="/investigation" className={styles.navItem}>
                            🔍 조사 게시판
                        </Link>
                        <Link href="/profile" className={styles.navItem}>
                            🎭 캐릭터 및 프로필
                        </Link>
                        <Link href="/board" className={styles.navItem}>
                            📝 일반 게시판
                        </Link>
                    </div>

                    {user.role === "ADMIN" && (
                        <div className={styles.navGroup}>
                            <div className={styles.navLabel}>관리자</div>
                            <Link href="/admin" className={styles.navItem}>
                                ⚙️ 관리자 설정
                            </Link>
                        </div>
                    )}
                </nav>

                <div className={styles.sidebarFooter}>
                    <div className={styles.userInfo}>
                        <div className={styles.userAvatar}>
                            {user.name?.charAt(0) || "U"}
                        </div>
                        <div className={styles.userDetails}>
                            <div className={styles.userName}>{user.name}</div>
                            <div className={styles.userRole}>
                                {user.role === "ADMIN" ? "관리자" : "일반 유저"}
                            </div>
                        </div>
                    </div>
                    <SignOutButton />
                </div>
            </aside>

            {/* 메인 콘텐츠 영역 */}
            <main className={styles.mainContent}>
                <div className={styles.contentWrapper}>
                    {children}
                </div>
            </main>
        </div>
    );
}
