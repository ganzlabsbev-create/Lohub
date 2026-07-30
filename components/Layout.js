import Link from "next/link";
import Head from "next/head";
import { useSession, signIn, signOut } from "next-auth/react";

// สถานะ login แบบย่อในแถบบน — Part 10
function AuthStatus() {
  const { data: session, status } = useSession();
  if (status === "loading") return null;
  if (!session) {
    return (
      <button type="button" className="masthead__search masthead__auth" onClick={() => signIn("github")}>
        👤 เข้าสู่ระบบ
      </button>
    );
  }
  return (
    <button type="button" className="masthead__search masthead__auth" onClick={() => signOut()}>
      👤 {session.user?.login} · ออกจากระบบ
    </button>
  );
}

export default function Layout({ site, children }) {
  return (
    <>
      <Head>
        <title>{site.site_name}</title>
        <meta name="description" content={site.tagline} />
      </Head>

      <header className="masthead">
        <div className="masthead__inner">
          <div className="masthead__row">
            <Link href="/" className="masthead__brand">
              <span className="masthead__mark">▣</span>
              {site.site_name}
            </Link>
            <div className="masthead__nav">
              <Link href="/dev/submit" className="masthead__search">
                ➕ ส่งแอป
              </Link>
              <Link href="/dev/dashboard" className="masthead__search">
                📋 Dashboard
              </Link>
              <Link href="/admin/queue" className="masthead__search">
                🛠 Admin
              </Link>
              <AuthStatus />
            </div>
          </div>
          <p className="masthead__tagline">{site.tagline}</p>
          <Link href="/search" className="searchbar" aria-label="ค้นหาแอป">
            <span className="searchbar__icon" aria-hidden="true">🔍</span>
            ค้นหาแอปและนักพัฒนา
          </Link>
        </div>
      </header>

      <main className="page">{children}</main>

      <footer className="footer">
        <p>
          ทุกแอปผ่านการตรวจสอบก่อนขึ้นเว็บ · ติดตั้งได้หลายช่องทาง ไม่ผูกกับที่เดียว
        </p>
      </footer>
    </>
  );
}
