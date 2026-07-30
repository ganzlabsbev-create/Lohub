import { useSession, signIn } from "next-auth/react";
import StateMessage from "./StateMessage";
import { isAdminUsername } from "../lib/auth";

// ป้องกันหน้าฝั่ง Admin ด้วย GitHub OAuth จริง (Part 10 — ก่อนหน้านี้ทุกหน้า /admin/* เข้าดูได้อิสระ)
// site: props "site" ที่ทุกหน้า Admin โหลดมาจาก getStaticProps อยู่แล้ว (มี admin_github_usernames)
// children: JSX ปกติ (ไม่ใช่ render-prop เหมือน DevGuard เพราะหน้า Admin ไม่ต้องใช้ข้อมูล developer)
export default function AdminGuard({ site, children }) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <StateMessage kind="loading">กำลังตรวจสอบสิทธิ์ Admin...</StateMessage>;
  }

  if (!session) {
    return (
      <StateMessage kind="empty">
        หน้านี้สำหรับ Admin เท่านั้น —{" "}
        <button type="button" className="link-button" onClick={() => signIn("github")}>
          เข้าสู่ระบบด้วย GitHub
        </button>
      </StateMessage>
    );
  }

  const username = session.user?.login;
  if (!isAdminUsername(username, site)) {
    return (
      <StateMessage kind="error">
        บัญชี GitHub @{username} ไม่มีสิทธิ์ Admin — ถ้าควรมีสิทธิ์ ให้เพิ่ม username นี้ในฟิลด์{" "}
        <code>admin_github_usernames</code> ที่ <code>data/settings/site.json</code>
      </StateMessage>
    );
  }

  return children;
}
