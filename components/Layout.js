import { useState } from "react";
import Link from "next/link";
import Head from "next/head";
import { useRouter } from "next/router";
import { useSession, signIn } from "next-auth/react";
import SideDrawer from "./SideDrawer";
import BottomNav from "./BottomNav";
import BrandMark from "./BrandMark";
import NotificationBell from "./NotificationBell";
import { IconMenu, IconSearch, IconUser } from "./Icons";
import { useTranslation } from "../lib/i18n";

// ปุ่มสถานะ login แบบย่อ (ไอคอนกลม มุมขวาบน) — Part 10
// บั๊กเดิม: login แล้วกดปุ่มนี้ผูก signOut() ตรงๆ ทำให้กดแล้วออกจากระบบทันที (ผิด)
// แก้แล้ว: login แล้วกด = ไปหน้าโปรไฟล์ /account เหมือน DrawerProfile ใน SideDrawer.js
// ปุ่ม logout ย้ายไปอยู่จุดเดียวคือหน้า Settings (/account/settings) แล้ว
function AuthButton() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useTranslation();
  if (status === "loading") return null;
  if (!session) {
    return (
      <button
        type="button"
        className="icon-btn"
        onClick={() => signIn("github")}
        aria-label={t("nav.login")}
        title={t("nav.login")}
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
      aria-label={`${session.user?.login} · ${t("nav.viewProfileTitle")}`}
      title={`${session.user?.login} · ${t("nav.viewProfileTitle")}`}
    >
      <IconUser size={19} />
    </button>
  );
}

export default function Layout({ site, children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { t } = useTranslation();

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
              aria-label={t("nav.openMenu")}
            >
              <IconMenu size={21} />
            </button>

            <Link href="/" className="masthead__brand">
              <BrandMark size={22} />
              {site.site_name}
            </Link>

            <span className="masthead__spacer" />

            <Link href="/search" className="icon-btn" aria-label={t("nav.search")} title={t("nav.search")}>
              <IconSearch size={19} />
            </Link>
            <NotificationBell />
            <AuthButton />
          </div>
        </div>
      </header>

      <main className="page">{children}</main>

      <BottomNav />

      <footer className="footer">
        <p>{t("footer.note")}</p>
      </footer>
    </>
  );
}
