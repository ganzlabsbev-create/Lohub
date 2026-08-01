import { useSession, signIn } from "next-auth/react";
import StateMessage from "./StateMessage";
import { findDeveloperByGithubUsername } from "../lib/auth";
import { useSearchIndex } from "../lib/useSearchIndex";
import { useTranslation } from "../lib/i18n";

// Guard สำหรับ /dev/apps/[id]/inbox — "ownership guard" ไม่ใช่ AdminGuard และไม่ใช่ DevGuard เฉยๆ
// (DevGuard เช็คแค่ "เป็น developer คนใดคนหนึ่งไหม" แต่หน้านี้ต้องเช็คว่าเป็นเจ้าของ "แอปนี้" จริงหรือไม่)
// การตรวจสอบจริง (ที่ป้องกันได้จริง) อยู่ฝั่ง server ใน requireAppOwner (lib/apiAuth.js) แล้ว —
// guard นี้แค่กันหน้าเว็บไม่ให้ dev คนอื่นเห็น UI เฉยๆ ถ้า API ปฏิเสธ หน้าก็ยังใช้งานไม่ได้อยู่ดี
// children ต้องเป็นฟังก์ชัน (developer, app) => JSX
export default function AppOwnerGuard({ appId, children }) {
  const { data: session, status } = useSession();
  const { loading, error, data } = useSearchIndex();
  const { t } = useTranslation();

  if (status === "loading" || loading) {
    return <StateMessage kind="loading">{t("devGuard.checking")}</StateMessage>;
  }

  if (!session) {
    return (
      <StateMessage kind="empty">
        {t("devGuard.notLoggedIn")}{" "}
        <button type="button" className="link-button" onClick={() => signIn("github")}>
          {t("common.loginWithGithub")}
        </button>
      </StateMessage>
    );
  }

  if (error) return <StateMessage kind="error">{t("account.loadDevProfileError", { error })}</StateMessage>;

  const username = session.user?.login;
  const developer = findDeveloperByGithubUsername(data?.developers, username);
  const app = data?.apps.find((a) => a.id === appId);

  if (!developer || !app || app.developer_id !== developer.id) {
    return <StateMessage kind="error">{t("devInbox.notOwner")}</StateMessage>;
  }

  return children(developer, app);
}
