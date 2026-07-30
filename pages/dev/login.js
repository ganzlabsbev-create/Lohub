import { useEffect } from "react";
import { useRouter } from "next/router";
import { useSession, signIn } from "next-auth/react";
import Layout from "../../components/Layout";
import StateMessage from "../../components/StateMessage";
import { getSiteSettings } from "../../lib/site";

export async function getStaticProps() {
  return { props: { site: getSiteSettings() } };
}

// Part 10: เข้าสู่ระบบจริงผ่าน GitHub OAuth (NextAuth) แทน mock picker เดิม
// ต้องเป็นบัญชี GitHub ที่ตรงกับ "github_username" ในไฟล์ data/developers/{id}.json อยู่แล้ว
// (DevGuard เป็นคนเช็คจุดจับคู่นี้จริงๆ ตอนเข้าหน้า /dev/submit หรือ /dev/dashboard)
export default function DevLoginPage({ site }) {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "authenticated") router.replace("/dev/dashboard");
  }, [status, router]);

  return (
    <Layout site={site}>
      <section className="section dev-narrow">
        <div className="section__head">
          <h1>เข้าสู่ระบบนักพัฒนา</h1>
        </div>
        <p className="banner-note">
          เข้าสู่ระบบด้วยบัญชี GitHub เดียวกับที่ลงทะเบียนไว้ในระบบ (field <code>github_username</code> ใน{" "}
          <code>data/developers/{"{id}"}.json</code>) — ถ้ายังไม่มีโปรไฟล์นักพัฒนา ให้ติดต่อ Admin ก่อน
        </p>

        {status === "loading" && <StateMessage kind="loading">กำลังตรวจสอบสถานะ...</StateMessage>}

        {status === "unauthenticated" && (
          <button
            type="button"
            className="btn-primary"
            onClick={() => signIn("github", { callbackUrl: "/dev/dashboard" })}
          >
            เข้าสู่ระบบด้วย GitHub
          </button>
        )}
      </section>
    </Layout>
  );
}
