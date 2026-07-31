import { useEffect, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import Layout from "../../components/Layout";
import StateMessage from "../../components/StateMessage";
import { getSiteSettings } from "../../lib/site";

export async function getStaticProps() {
  return { props: { site: getSiteSettings() } };
}

const NOTIF_STORAGE_KEY = "lohub:settings:notifications";
const DEFAULT_NOTIFS = { app_updates: true, dev_request_result: true };

// หน้า Settings จริง แยกออกจาก Profile (/account) — ต่างจากเดิมที่ลิงก์ "ตั้งค่า"
// เคยพาไป /account เฉยๆ ทั้งที่ชื่อไม่ตรงปลายทาง
// - บัญชีที่เชื่อมต่อ: อ่านจาก session ตรงๆ ไม่ต้องเรียก API เพิ่ม
// - การแจ้งเตือน: ยังไม่มี backend รองรับ เก็บลง localStorage ไปก่อนตามที่ระบุไว้ ค่อยต่อ API ทีหลัง
// - ธีม: โปรเจกต์นี้ยังไม่มีระบบธีม (มีแค่ prefers-color-scheme อัตโนมัติ) จึงข้ามไปก่อน ไม่เพิ่ม dependency ใหม่
// - Danger zone: ปุ่ม signOut() ตรงๆ จุดเดียวในแอป (ยกเว้นปุ่มเล็กใน SideDrawer ที่คงไว้เหมือนเดิม)
export default function SettingsPage({ site }) {
  const { data: session, status } = useSession();

  return (
    <Layout site={site}>
      <section className="section dev-narrow">
        <div className="section__head">
          <h1>ตั้งค่า</h1>
        </div>

        {status === "loading" && (
          <StateMessage kind="loading">กำลังตรวจสอบสถานะเข้าสู่ระบบ...</StateMessage>
        )}

        {status !== "loading" && !session && (
          <StateMessage kind="empty">
            เข้าสู่ระบบเพื่อจัดการการตั้งค่า —{" "}
            <button type="button" className="link-button" onClick={() => signIn("github")}>
              เข้าสู่ระบบด้วย GitHub
            </button>
          </StateMessage>
        )}

        {session && <SettingsPanel session={session} />}
      </section>
    </Layout>
  );
}

function SettingsPanel({ session }) {
  return (
    <>
      <ConnectedAccountSection session={session} />
      <NotificationsSection />
      <DangerZoneSection />
    </>
  );
}

function ConnectedAccountSection({ session }) {
  return (
    <section className="section">
      <div className="section__head">
        <h2>บัญชีที่เชื่อมต่อ</h2>
      </div>
      <div className="dev-row">
        <div className="dev-row__body">
          <p className="dev-row__name">◈ GitHub — @{session.user?.login}</p>
          <p className="dev-row__meta">
            นี่คือวิธีเข้าสู่ระบบเดียวของ Lohub — ยังไม่รองรับการเชื่อมต่อบัญชีอื่นเพิ่ม จึงไม่มีปุ่ม
            ยกเลิกการเชื่อมต่อ
          </p>
        </div>
      </div>
    </section>
  );
}

function NotificationsSection() {
  const [prefs, setPrefs] = useState(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(NOTIF_STORAGE_KEY);
      setPrefs(raw ? { ...DEFAULT_NOTIFS, ...JSON.parse(raw) } : DEFAULT_NOTIFS);
    } catch {
      setPrefs(DEFAULT_NOTIFS);
    }
  }, []);

  function toggle(key) {
    setPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        window.localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // เก็บ localStorage ไม่ได้ (เช่น private mode) ไม่ต้องทำอะไรเพิ่ม — เก็บใน state ต่อไปได้
      }
      return next;
    });
  }

  if (!prefs) return null;

  return (
    <section className="section">
      <div className="section__head">
        <h2>การแจ้งเตือน</h2>
        <p className="section__hint">บันทึกไว้ในเบราว์เซอร์นี้ก่อน — ยังไม่เชื่อมระบบแจ้งเตือนจริง</p>
      </div>
      <ToggleRow
        label="แอปที่ติดตามอัปเดต"
        description="แจ้งเตือนเมื่อแอปที่คุณติดตามมีเวอร์ชันใหม่"
        checked={prefs.app_updates}
        onChange={() => toggle("app_updates")}
      />
      <ToggleRow
        label="ผลคำขอเป็น Developer"
        description="แจ้งเตือนเมื่อแอดมินอนุมัติหรือปฏิเสธคำขอของคุณ"
        checked={prefs.dev_request_result}
        onChange={() => toggle("dev_request_result")}
      />
    </section>
  );
}

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <label className="dev-row" style={{ cursor: "pointer" }}>
      <div className="dev-row__body">
        <p className="dev-row__name">{label}</p>
        <p className="dev-row__meta">{description}</p>
      </div>
      <div className="dev-row__actions">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          aria-label={label}
          style={{ width: 20, height: 20 }}
        />
      </div>
    </label>
  );
}

function DangerZoneSection() {
  return (
    <section className="section">
      <div className="section__head">
        <h2>โซนอันตราย</h2>
      </div>
      <div className="form-actions">
        <button type="button" className="btn-primary" onClick={() => signOut()}>
          ออกจากระบบ
        </button>
      </div>
    </section>
  );
}
