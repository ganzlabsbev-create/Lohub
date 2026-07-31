import Link from "next/link";
import { useRouter } from "next/router";
import { IconHome, IconSearch, IconGrid, IconUser } from "./Icons";

// แถบเมนูล่างสำหรับมือถือเท่านั้น (ซ่อนบนจอกว้างด้วย CSS ใน globals.css)
// ตั้งใจให้มีแค่ 4 ปุ่มพื้นฐานที่ผู้ใช้ทุกคนเห็นเหมือนกัน — ไม่มีปุ่ม Dev/Admin ในนี้เด็ดขาด
// เมนู Dev/Admin (แสดงเฉพาะ role ที่เกี่ยวข้อง) อยู่ใน SideDrawer.js / หน้า /account เท่านั้น
const ITEMS = [
  { href: "/", label: "หน้าแรก", Icon: IconHome, match: (p) => p === "/" },
  { href: "/search", label: "ค้นหา", Icon: IconSearch, match: (p) => p === "/search" },
  { href: "/#categories", label: "หมวดหมู่", Icon: IconGrid, match: () => false },
  { href: "/account", label: "บัญชี", Icon: IconUser, match: (p) => p.startsWith("/account") },
];

export default function BottomNav() {
  const router = useRouter();

  return (
    <nav className="bottom-nav" aria-label="เมนูด่วน">
      {ITEMS.map(({ href, label, Icon, match }) => {
        const active = match(router.pathname);
        return (
          <Link
            key={href}
            href={href}
            className={`bottom-nav__item${active ? " bottom-nav__item--active" : ""}`}
          >
            <Icon size={21} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
