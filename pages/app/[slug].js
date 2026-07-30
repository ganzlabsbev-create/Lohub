import Link from "next/link";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import AppIcon from "../../components/AppIcon";
import CategoryPill from "../../components/CategoryPill";
import InstallButtons from "../../components/InstallButtons";
import ScreenshotGallery from "../../components/ScreenshotGallery";
import VersionHistory from "../../components/VersionHistory";
import StateMessage from "../../components/StateMessage";
import { useSearchIndex } from "../../lib/useSearchIndex";
import { formatSize } from "../../lib/format";
import { getSiteSettings } from "../../lib/site";
import { getMockApprovedApps } from "../../lib/mockAdmin";

export async function getStaticProps() {
  return { props: { site: getSiteSettings() } };
}

// จำเป็นต้องมี เพราะหน้านี้เป็น dynamic route ([slug]) ที่ใช้ getStaticProps — ถ้าไม่มี next build จะพังทั้งเว็บ
// ข้อมูลแอปจริงโหลดฝั่ง client จาก search-index.json (useSearchIndex) เลยไม่ต้อง pre-list path ไหนล่วงหน้า
export async function getStaticPaths() {
  return { paths: [], fallback: "blocking" };
}

export default function AppDetailPage({ site }) {
  const router = useRouter();
  const { slug } = router.query;
  const { loading, error, data } = useSearchIndex();

  // แอปที่ admin mock-อนุมัติแล้ว (Part 8) ยังไม่ได้อยู่ใน search-index.json จริง (client เขียนไฟล์ไม่ได้) — เลยเผื่อหาที่นี่ด้วย
  const mockApproved = data ? Object.values(getMockApprovedApps()) : [];
  const app = data?.apps.find((a) => a.slug === slug) || mockApproved.find((a) => a.slug === slug);
  const developer = app && data.developers.find((d) => d.id === app.developer_id);
  const cats = app
    ? (app.category_ids || []).map((id) => data.categories.find((c) => c.id === id)).filter(Boolean)
    : [];
  const accentColor = cats[0]?.color || "#A9A38C";

  return (
    <Layout site={site}>
      {loading && <StateMessage kind="loading">กำลังโหลดข้อมูลแอป...</StateMessage>}
      {error && (
        <StateMessage kind="error">
          โหลดข้อมูลไม่สำเร็จ: {error} — ลองรีเฟรชหน้าใหม่อีกครั้ง
        </StateMessage>
      )}

      {data && !app && slug && (
        <StateMessage kind="empty">
          ไม่พบแอป "{slug}" — <Link href="/">กลับหน้าแรก</Link>
        </StateMessage>
      )}

      {app && (
        <>
          <p className="breadcrumb">
            <Link href="/">หน้าแรก</Link>
            {cats[0] && (
              <>
                {" › "}
                <Link href={`/category/${cats[0].slug}`}>{cats[0].name}</Link>
              </>
            )}
            {" › "}
            <span>{app.name}</span>
          </p>

          <section className="app-detail__head">
            <AppIcon app={app} accentColor={accentColor} size={88} />
            <div className="app-detail__title">
              <h1>
                {app.name}
                {app.verified && <span className="stamp stamp--inline" title="ยืนยันตัวตนแล้ว">✓ verified</span>}
              </h1>
              <p className="app-detail__dev">
                โดย{" "}
                {developer ? (
                  <Link href={`/developer/${developer.id}`}>{developer.name}</Link>
                ) : (
                  "ไม่ทราบนักพัฒนา"
                )}
              </p>
              <div className="app-detail__cats">
                {cats.map((c) => (
                  <CategoryPill key={c.id} category={c} />
                ))}
              </div>
            </div>
          </section>

          <InstallButtons methods={app.install_methods} />

          <div className="meta-grid">
            <div><span>เวอร์ชันล่าสุด</span><strong className="mono">v{app.current_version}</strong></div>
            <div><span>ขนาดไฟล์</span><strong>{formatSize(app.size_mb)}</strong></div>
            <div><span>รองรับ</span><strong>{app.min_os || "-"}</strong></div>
            <div><span>สัญญาอนุญาต</span><strong>{app.license || "-"}</strong></div>
            <div><span>ภาษา</span><strong>{(app.languages || []).join(", ") || "-"}</strong></div>
          </div>

          {app.features?.length > 0 && (
            <div className="feature-row">
              {app.features.map((f) => (
                <span key={f} className="tag tag--feature">{f}</span>
              ))}
            </div>
          )}

          <section className="section">
            <div className="section__head">
              <h2>เกี่ยวกับแอปนี้</h2>
            </div>
            <p className="app-detail__desc">{app.description_full || app.description_short}</p>
          </section>

          <ScreenshotGallery screenshots={app.screenshots} />

          <VersionHistory versions={app.version_history} currentVersion={app.current_version} />
        </>
      )}
    </Layout>
  );
}
