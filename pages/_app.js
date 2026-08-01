import { SessionProvider } from "next-auth/react";
import { LanguageProvider } from "../lib/i18n";
import "../styles/globals.css";

// SessionProvider (Part 10) ให้ทุกหน้า/คอมโพเนนต์เรียก useSession() อ่านสถานะ GitHub login ได้
// pageProps.session มาจาก NextAuth เอง เผื่อโหลด session ล่วงหน้าฝั่ง server ในอนาคต (ตอนนี้ยังไม่ได้ใช้)
// LanguageProvider ครอบทั้งแอปเพื่อให้ทุกหน้า/คอมโพเนนต์เรียก useI18n()/useTranslation() ได้ (ระบบ 2 ภาษา th/en)
export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <LanguageProvider>
        <Component {...pageProps} />
      </LanguageProvider>
    </SessionProvider>
  );
}
