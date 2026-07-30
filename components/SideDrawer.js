import { useState } from "react";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  IconClose,
  IconHome,
  IconGrid,
  IconSearch,
  IconUpload,
  IconDashboard,
  IconSettings,
  IconShield,
  IconInfo,
  IconUser,
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

function DrawerProfile() {
  const { data: session, status } = useSession();
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
  return (
    <button type="button" className="drawer__profile" onClick={() => signOut()}>
      <span className="drawer__avatar"><IconUser size={18} /></span>
      <div className="drawer__profile-text">
        <strong>{session.user?.login}</strong>
        <span>ออกจากระบบ</span>
      </div>
    </button>
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

        <DrawerProfile />

        <nav className="drawer__nav">
          <DrawerLink href="/" icon={<IconHome size={19} />} onNavigate={onClose}>หน้าแรก</DrawerLink>
          <DrawerLink href="/#categories" icon={<IconGrid size={19} />} onNavigate={onClose}>หมวดหมู่</DrawerLink>
          <DrawerLink href="/search" icon={<IconSearch size={19} />} onNavigate={onClose}>ค้นหา</DrawerLink>

          <div className="drawer__divider" />

          <DrawerGroup icon={<IconUpload size={19} />} label="พื้นที่นักพัฒนา">
            <DrawerLink href="/dev/submit" onNavigate={onClose}>ส่งแอปใหม่</DrawerLink>
            <DrawerLink href="/dev/dashboard" icon={<IconDashboard size={17} />} onNavigate={onClose}>Dashboard นักพัฒนา</DrawerLink>
            <DrawerLink href="/dev/login" onNavigate={onClose}>เข้าสู่ระบบนักพัฒนา</DrawerLink>
          </DrawerGroup>

          <DrawerGroup icon={<IconSettings size={19} />} label="ตั้งค่า">
            <DrawerLink href="/admin/queue" icon={<IconShield size={16} />} onNavigate={onClose}>คิวตรวจสอบแอป (แอดมิน)</DrawerLink>
            <DrawerLink href="/admin/categories" onNavigate={onClose}>จัดการหมวดหมู่</DrawerLink>
            <DrawerLink href="/admin/developers" onNavigate={onClose}>จัดการนักพัฒนา</DrawerLink>
          </DrawerGroup>

          <DrawerGroup icon={<IconInfo size={19} />} label="เกี่ยวกับ">
            <p className="drawer__about-text">{site.tagline}</p>
          </DrawerGroup>
        </nav>
      </aside>
    </>
  );
}
