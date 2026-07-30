import { SessionProvider } from "next-auth/react";
import "../styles/globals.css";

// SessionProvider (Part 10) ให้ทุกหน้า/คอมโพเนนต์เรียก useSession() อ่านสถานะ GitHub login ได้
// pageProps.session มาจาก NextAuth เอง เผื่อโหลด session ล่วงหน้าฝั่ง server ในอนาคต (ตอนนี้ยังไม่ได้ใช้)
export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}
