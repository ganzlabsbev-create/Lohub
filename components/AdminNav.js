import Link from "next/link";
import { useTranslation } from "../lib/i18n";

// เมนูย่อยฝั่ง Admin — ใช้ร่วมกัน 3 หน้า (คิวรอตรวจ / หมวดหมู่ / นักพัฒนา)
// ไม่ได้เพิ่มลิงก์พวกนี้ใน masthead ตรงๆ เพราะ nav บนสุดแน่นอยู่แล้ว — เข้าทาง "🛠 Admin" แล้วสลับแท็บที่นี่แทน
const TABS = [
  { key: "queue", href: "/admin/queue", labelKey: "adminNav.queue" },
  { key: "categories", href: "/admin/categories", labelKey: "adminNav.categories" },
  { key: "developers", href: "/admin/developers", labelKey: "adminNav.developers" },
  { key: "members", href: "/admin/members", labelKey: "adminNav.members" },
  { key: "reviews", href: "/admin/reviews", labelKey: "adminNav.reviews" },
  { key: "reports", href: "/admin/reports", labelKey: "adminNav.reports" },
  { key: "developer-requests", href: "/admin/developer-requests", labelKey: "adminNav.developerRequests" },
];

export default function AdminNav({ active }) {
  const { t } = useTranslation();
  return (
    <nav className="admin-nav">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={`admin-nav__tab${active === tab.key ? " admin-nav__tab--active" : ""}`}
        >
          {t(tab.labelKey)}
        </Link>
      ))}
    </nav>
  );
}
