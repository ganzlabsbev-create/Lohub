import Link from "next/link";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import DevAvatar from "../../components/DevAvatar";
import AppCard from "../../components/AppCard";
import StateMessage from "../../components/StateMessage";
import { useSearchIndex } from "../../lib/useSearchIndex";
import { sortApps } from "../../lib/sort";
import { formatDate } from "../../lib/format";
import { getSiteSettings } from "../../lib/site";
import { getEffectiveCategories } from "../../lib/mockAdmin";

export async function getStaticProps() {
  return { props: { site: getSiteSettings() } };
}

// จำเป็นต้องมี เพราะหน้านี้เป็น dynamic route ([id]) ที่ใช้ getStaticProps — ถ้าไม่มี next build จะพังทั้งเว็บ
export async function getStaticPaths() {
  return { paths: [], fallback: "blocking" };
}

export default function DeveloperPage({ site }) {
  const router = useRouter();
  const { id } = router.query;
  const { loading, error, data } = useSearchIndex();

  const developer = data?.developers.find((d) => d.id === id);
  const apps = developer
    ? sortApps(data.apps.filter((a) => a.developer_id === developer.id), "newest")
    : [];
  // ใช้หมวดหมู่ effective (รวม override ของ admin) ไม่งั้นแก้หมวดหมู่แล้วจะไม่ขึ้นหน้านี้
  const categories = data ? getEffectiveCategories(data.categories) : [];

  return (
    <Layout site={site}>
      {loading && <StateMessage kind="loading">กำลังโหลดข้อมูลนักพัฒนา...</StateMessage>}
      {error && (
        <StateMessage kind="error">
          โหลดข้อมูลไม่สำเร็จ: {error} — ลองรีเฟรชหน้าใหม่อีกครั้ง
        </StateMessage>
      )}

      {data && !developer && id && (
        <StateMessage kind="empty">
          ไม่พบนักพัฒนา — <Link href="/">กลับหน้าแรก</Link>
        </StateMessage>
      )}

      {developer && (
        <>
          <p className="breadcrumb">
            <Link href="/">หน้าแรก</Link> {" › "}
            <span>{developer.name}</span>
          </p>

          <section className="dev-head">
            <DevAvatar developer={developer} />
            <div className="dev-head__info">
              <h1>
                {developer.name}
                {developer.verified && (
                  <span className="stamp stamp--inline" title="ยืนยันตัวตนแล้ว">✓ verified</span>
                )}
              </h1>
              <p className="dev-head__meta">
                เข้าร่วมเมื่อ {formatDate(developer.joined_at)} · {apps.length} แอป
              </p>
              <div className="dev-head__links">
                {developer.website && (
                  <a href={developer.website} target="_blank" rel="noopener noreferrer">
                    🔗 เว็บไซต์
                  </a>
                )}
                {developer.github_username && (
                  <a
                    href={`https://github.com/${developer.github_username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    ◈ @{developer.github_username}
                  </a>
                )}
              </div>
            </div>
          </section>

          <section className="section">
            <div className="section__head">
              <h2>แอปทั้งหมดจากนักพัฒนานี้</h2>
            </div>
            {apps.length === 0 ? (
              <StateMessage kind="empty">นักพัฒนาคนนี้ยังไม่มีแอปที่เผยแพร่</StateMessage>
            ) : (
              <div className="app-grid">
                {apps.map((app) => (
                  <AppCard key={app.id} app={app} categories={categories} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </Layout>
  );
}
