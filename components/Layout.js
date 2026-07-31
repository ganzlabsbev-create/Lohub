import { useState } from "react";
import Link from "next/link";
import Head from "next/head";
import { useRouter } from "next/router";
import { useSession, signIn } from "next-auth/react";
import SideDrawer from "./SideDrawer";
import BottomNav from "./BottomNav";
import { IconMenu, IconSearch, IconUser } from "./Icons";

// ปุ่มสถานะ login แบบย่อ (ไอคอนกลม มุมขวาบน) — Part 10
// บั๊กเดิม: login แล้วกดปุ่มนี้ผูก signOut() ตรงๆ ทำให้กดแล้วออกจากระบบทันที (ผิด)
// แก้แล้ว: login แล้วกด = ไปหน้าโปรไฟล์ /account เหมือน DrawerProfile ใน SideDrawer.js
// ปุ่ม logout ย้ายไปอยู่จุดเดียวคือหน้า Settings (/account/settings) แล้ว
function AuthButton() {
  const { data: session, status } = useSession();
  const router = useRouter();
  if (status === "loading") return null;
  if (!session) {
    return (
      <button
        type="button"
        className="icon-btn"
        onClick={() => signIn("github")}
        aria-label="เข้าสู่ระบบ"
        title="เข้าสู่ระบบ"
      >
        <IconUser size={19} />
      </button>
    );
  }
  return (
    <button
      type="button"
      className="icon-btn icon-btn--active"
      onClick={() => router.push("/account")}
      aria-label={`${session.user?.login} · ดูโปรไฟล์`}
      title={`${session.user?.login} · ดูโปรไฟล์`}
    >
      <IconUser size={19} />
    </button>
  );
}

export default function Layout({ site, children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <Head>
        <title>{site.site_name}</title>
        <meta name="description" content={site.tagline} />
      </Head>

      <SideDrawer site={site} open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <header className="masthead">
        <div className="masthead__inner">
          <div className="masthead__row">
            <button
              type="button"
              className="icon-btn"
              onClick={() => setDrawerOpen(true)}
              aria-label="เปิดเมนู"
            >
              <IconMenu size={21} />
            </button>

            <Link href="/" className="masthead__brand">
              <span className="masthead__mark">▣</span>
              {site.site_name}
            </Link>

            <span className="masthead__spacer" />

            <Link href="/search" className="icon-btn" aria-label="ค้นหา" title="ค้นหา">
              <IconSearch size={19} />
            </Link>
            <AuthButton />
          </div>
        </div>
      </header>

      <main className="page">{children}</main>

      <BottomNav />

      <footer className="footer">
        <p>
          ทุกแอปผ่านการตรวจสอบก่อนขึ้นเว็บ · ติดตั้งได้หลายช่องทาง ไม่ผูกกับที่เดียว
        </p>
      </footer>
    </>
  );
}
