import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { IconBell } from "./Icons";
import { apiGet, apiPost } from "../lib/apiClient";
import { formatDate } from "../lib/format";
import { useTranslation } from "../lib/i18n";

const POLL_MS = 45000; // 45 วิ ตามสเปก (30-60 วิ) — ไม่มี WebSocket ในระบบนี้ ใช้ polling

// กระดิ่งแจ้งเตือน — โชว์เฉพาะตอน login และมี role เป็น "developer" เท่านั้น (admin ไม่เห็น)
// เช็ค role ทางอ้อมจาก response ของ /api/dev/notifications เอง: ถ้า 403 (ไม่ใช่ developer)
// แปลว่าไม่ต้องแสดงกระดิ่งเลย ไม่ต้องมี hook แยกไปเช็ค role ซ้ำ
export default function NotificationBell() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false); // true เมื่อยืนยันแล้วว่า user นี้เป็น developer
  const [state, setState] = useState({ count: 0, items: [] });
  const router = useRouter();
  const { t } = useTranslation();
  const boxRef = useRef(null);

  function load() {
    apiGet("/api/dev/notifications")
      .then((data) => {
        setVisible(true);
        setState({ count: data.count || 0, items: data.items || [] });
      })
      .catch(() => setVisible(false)); // 401/403/error -> ไม่ใช่ developer หรือยังไม่ login เลยไม่โชว์
  }

  useEffect(() => {
    if (status !== "authenticated") {
      setVisible(false);
      return undefined;
    }
    load();
    const interval = setInterval(load, POLL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    function onClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (!session || !visible) return null;

  function goToInbox(item) {
    apiPost(`/api/dev/notifications/${item.report_id}/read`, { app_id: item.app_id }).catch(() => {});
    setOpen(false);
    router.push(`/dev/apps/${item.app_id}/inbox`);
  }

  return (
    <div className="notif-bell" ref={boxRef}>
      <button
        type="button"
        className="icon-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("notifications.bellLabel", { count: state.count })}
        title={t("notifications.bellLabel", { count: state.count })}
      >
        <IconBell size={19} />
        {state.count > 0 && <span className="notif-bell__badge">{state.count > 9 ? "9+" : state.count}</span>}
      </button>

      {open && (
        <div className="notif-bell__dropdown">
          <p className="notif-bell__title">{t("notifications.title")}</p>
          {state.items.length === 0 && <p className="banner-note">{t("notifications.empty")}</p>}
          <ul className="notif-bell__list">
            {state.items.map((item) => (
              <li key={item.report_id}>
                <button type="button" className="notif-bell__item" onClick={() => goToInbox(item)}>
                  <strong>{item.app_name || item.app_id}</strong>
                  <span>{item.message}</span>
                  <span className="mono notif-bell__time">{formatDate(item.created_at)}</span>
                </button>
              </li>
            ))}
          </ul>
          <Link href="/dev/dashboard" className="notif-bell__viewall" onClick={() => setOpen(false)}>
            {t("notifications.viewDashboard")}
          </Link>
        </div>
      )}
    </div>
  );
}
