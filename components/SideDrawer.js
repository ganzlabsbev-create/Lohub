import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  IconClose,
  IconHome,
  IconGrid,
  IconSearch,
  IconSettings,
  IconInfo,
  IconUser,
  IconLogout,
  IconChevronDown,
} from "./Icons";

function DrawerLink({ href, icon, children, onNavigate }) {
  return (
    <Link href={href} className="drawer__item" onClick={onNavigate}>
      <span className="drawer__item-icon">{icon}</span>
      {children}
    </Link>
  );
}

function DrawerGroup({ icon, label, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="drawer__group">
      <button
        type="button"
        className="drawer__item drawer__item--toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="drawer__item-icon">{icon}</span>
        {label}
        <span className={`drawer__chevron${open ? " drawer__chevron--open" : ""}`}>
          <IconChevronDown size={16} />
        </span>
      </button>
      {open && <div className="drawer__subnav">{children}</div>}
    </div>
  );
}

// บั๊กเดิม: ทั้งแถบ (avatar + ชื่อ) ผูก onClick={() => signOut()} ตรงๆ ทำให้กดโปรไฟล์แล้วออกจากระบบทันที
// (user รายงานว่า "กดโปรไฟล์แล้วล็อกเอาท์") — แก้เป็น: กดแถบโปรไฟล์ -> ไปหน้า /account จริง (มีอยู่แล้ว
// ครบทุก role) ส่วนปุ่มออกจากระบบแยกออกมาต่างหากเป็นไอคอนเล็กๆ ท้ายแถวแทน ไม่ปนกับการกดไปโปรไฟล์
function DrawerProfile({ onNavigate }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") return null;

  if (!session) {
    return (
      <button type="button" className="drawer__profile" onClick={() => signIn("github")}>
        <span className="drawer__avatar"><IconUser size={18} /></span>
        <div className="drawer__profile-text">
          <strong>เข้าสู่ระบบ</strong>
          <span>ด้วยบัญชี GitHub</span>
        </div>
      </button>
    );
  }

  function goToAccount() {
    router.push("/account");
    onNavigate?.();
  }

  return (
    <div className="drawer__profile-row">
      <button type="button" className="drawer__profile" onClick={goToAccount}>
        <span className="drawer__avatar"><IconUser size={18} /></span>
        <div className="drawer__profile-text">
          <strong>{session.user?.login}</strong>
          <span>ดูโปรไฟล์ของฉัน</span>
        </div>
      </button>
      <button
        type="button"
        className="icon-btn drawer__logout"
        onClick={() => signOut()}
        aria-label="ออกจากระบบ"
        title="ออกจากระบบ"
      >
        <IconLogout size={18} />
      </button>
    </div>
  );
}

export default function SideDrawer({ site, open, onClose }) {
  return (
    <>
      <div
        className={`drawer-overlay${open ? " drawer-overlay--open" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={`drawer${open ? " drawer--open" : ""}`} aria-label="เมนูหลัก" aria-hidden={!open}>
        <div className="drawer__head">
          <span className="masthead__mark">▣</span>
          <span className="drawer__site-name">{site.site_name}</span>
          <button type="button" className="icon-btn drawer__close" onClick={onClose} aria-label="ปิดเมนู">
            <IconClose size={20} />
          </button>
        </div>

        <DrawerProfile onNavigate={onClose} />

        <nav className="drawer__nav">
          <DrawerLink href="/" icon={<IconHome size={19} />} onNavigate={onClose}>หน้าแรก</DrawerLink>
          <DrawerLink href="/#categories" icon={<IconGrid size={19} />} onNavigate={onClose}>หมวดหมู่</DrawerLink>
          <DrawerLink href="/search" icon={<IconSearch size={19} />} onNavigate={onClose}>ค้นหา</DrawerLink>

          <div className="drawer__divider" />

          <DrawerLink href="/account/settings" icon={<IconSettings size={19} />} onNavigate={onClose}>ตั้งค่า</DrawerLink>

          <DrawerGroup icon={<IconInfo size={19} />} label="เกี่ยวกับ">
            <p className="drawer__about-text">{site.tagline}</p>
          </DrawerGroup>
        </nav>
      </aside>
    </>
  );
}
