import Link from "next/link";

// เมนูย่อยฝั่ง Admin — ใช้ร่วมกัน 3 หน้า (คิวรอตรวจ / หมวดหมู่ / นักพัฒนา)
// ไม่ได้เพิ่มลิงก์พวกนี้ใน masthead ตรงๆ เพราะ nav บนสุดแน่นอยู่แล้ว — เข้าทาง "🛠 Admin" แล้วสลับแท็บที่นี่แทน
const TABS = [
  { key: "queue", href: "/admin/queue", label: "คิวรอตรวจ" },
  { key: "categories", href: "/admin/categories", label: "หมวดหมู่" },
  { key: "developers", href: "/admin/developers", label: "นักพัฒนา" },
];

export default function AdminNav({ active }) {
  return (
    <nav className="admin-nav">
      {TABS.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          className={`admin-nav__tab${active === t.key ? " admin-nav__tab--active" : ""}`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
