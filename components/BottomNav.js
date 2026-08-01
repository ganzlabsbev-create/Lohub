import Link from "next/link";
import { useRouter } from "next/router";
import { IconHome, IconSearch, IconGrid, IconUser } from "./Icons";
import { useTranslation } from "../lib/i18n";

// แถบเมนูล่างสำหรับมือถือเท่านั้น (ซ่อนบนจอกว้างด้วย CSS ใน globals.css)
// ตั้งใจให้มีแค่ 4 ปุ่มพื้นฐานที่ผู้ใช้ทุกคนเห็นเหมือนกัน — ไม่มีปุ่ม Dev/Admin ในนี้เด็ดขาด
// เมนู Dev/Admin (แสดงเฉพาะ role ที่เกี่ยวข้อง) อยู่ใน SideDrawer.js / หน้า /account เท่านั้น
const ITEMS = [
  { href: "/", labelKey: "nav.home", Icon: IconHome, match: (p) => p === "/" },
  { href: "/search", labelKey: "nav.search", Icon: IconSearch, match: (p) => p === "/search" },
  { href: "/#categories", labelKey: "nav.categories", Icon: IconGrid, match: () => false },
  { href: "/account", labelKey: "nav.account", Icon: IconUser, match: (p) => p.startsWith("/account") },
];

export default function BottomNav() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <nav className="bottom-nav" aria-label={t("nav.quickMenu")}>
      {ITEMS.map(({ href, labelKey, Icon, match }) => {
        const active = match(router.pathname);
        return (
          <Link
            key={href}
            href={href}
            className={`bottom-nav__item${active ? " bottom-nav__item--active" : ""}`}
          >
            <Icon size={21} />
            <span>{t(labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
