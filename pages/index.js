import Link from "next/link";
import Layout from "../components/Layout";
import AppCard from "../components/AppCard";
import CategoryPill from "../components/CategoryPill";
import StateMessage from "../components/StateMessage";
import { IconSearch } from "../components/Icons";
import { useSearchIndex } from "../lib/useSearchIndex";
import { sortApps } from "../lib/sort";
import { getSiteSettings } from "../lib/site";
import { getEffectiveCategories } from "../lib/mockAdmin";

export async function getStaticProps() {
  return { props: { site: getSiteSettings() } };
}

export default function Home({ site }) {
  const { loading, error, data } = useSearchIndex();
  // ใช้หมวดหมู่ "effective" (รวม override ที่ admin แก้ไว้) ไม่ใช่ data.categories ตรงๆ
  // ไม่งั้นแอดมินแก้หมวดหมู่แล้วจะเห็นผลแค่ในหน้า /admin/categories เท่านั้น ไม่ขึ้นหน้าหลัก
  const categories = data ? getEffectiveCategories(data.categories) : [];

  return (
    <Layout site={site}>
      <section className="hero">
        <h1>ค้นแอปที่ใช่ ติดตั้งได้เลย</h1>
        <p>รวมแอปจากนักพัฒนาอิสระ ทุกตัวผ่านการตรวจสอบแล้ว</p>
        <Link href="/search" className="searchbar" aria-label="ค้นหาแอป">
          <span className="searchbar__icon" aria-hidden="true"><IconSearch size={18} /></span>
          ค้นหาแอปและนักพัฒนา
        </Link>
      </section>

      {loading && <StateMessage kind="loading">กำลังโหลดรายการแอป...</StateMessage>}
      {error && (
        <StateMessage kind="error">
          โหลดข้อมูลไม่สำเร็จ: {error} — ลองรีเฟรชหน้าใหม่อีกครั้ง
        </StateMessage>
      )}

      {data && (
        <>
          <section className="section" id="categories">
            <div className="section__head">
              <h2>หมวดหมู่</h2>
            </div>
            <div className="cat-row">
              {[...categories]
                .sort((a, b) => a.order - b.order)
                .map((c) => (
                  <CategoryPill key={c.id} category={c} />
                ))}
            </div>
          </section>

          <FeaturedSection apps={data.apps} categories={categories} />
          <RecommendedSection apps={data.apps} categories={categories} />
          <NewestSection apps={data.apps} categories={categories} />
        </>
      )}
    </Layout>
  );
}

function FeaturedSection({ apps, categories }) {
  const featured = sortApps(apps, "popular").slice(0, 3);
  if (featured.length === 0) return null;
  return (
    <section className="section">
      <div className="section__head">
        <h2>แอปแนะนำ</h2>
        <p className="section__hint">คัดจากแอปที่ผ่านการยืนยันตัวตนและได้รับความนิยม</p>
      </div>
      <div className="app-grid">
        {featured.map((app) => (
          <AppCard key={app.id} app={app} categories={categories} />
        ))}
      </div>
    </section>
  );
}

function RecommendedSection({ apps, categories }) {
  // ต่อจากแอปแนะนำ (popular) แถวถัดไป — ใช้ sortApps เดิม ไม่มี logic ใหม่
  const recommended = sortApps(apps, "popular").slice(3, 7);
  if (recommended.length === 0) return null;
  return (
    <section className="section">
      <div className="section__head">
        <h2>แนะนำสำหรับคุณ</h2>
      </div>
      <div className="app-grid">
        {recommended.map((app) => (
          <AppCard key={app.id} app={app} categories={categories} />
        ))}
      </div>
    </section>
  );
}

function NewestSection({ apps, categories }) {
  const newest = sortApps(apps, "newest").slice(0, 4);
  if (newest.length === 0) return null;
  return (
    <section className="section">
      <div className="section__head">
        <h2>แอปใหม่</h2>
        <p className="section__hint">เพิ่งผ่านการอนุมัติขึ้นเว็บล่าสุด</p>
      </div>
      <div className="app-grid">
        {newest.map((app) => (
          <AppCard key={app.id} app={app} categories={categories} />
        ))}
      </div>
    </section>
  );
}
