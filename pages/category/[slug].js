import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "../../components/Layout";
import AppCard from "../../components/AppCard";
import StateMessage from "../../components/StateMessage";
import { useSearchIndex } from "../../lib/useSearchIndex";
import { sortApps, SORT_OPTIONS } from "../../lib/sort";
import { getSiteSettings } from "../../lib/site";

export async function getStaticProps() {
  return { props: { site: getSiteSettings() } };
}

// จำเป็นต้องมี เพราะหน้านี้เป็น dynamic route ([slug]) ที่ใช้ getStaticProps — ถ้าไม่มี next build จะพังทั้งเว็บ
// ข้อมูลหมวดหมู่จริงโหลดฝั่ง client จาก search-index.json (useSearchIndex) เลยไม่ต้อง pre-list path ไหนล่วงหน้า
export async function getStaticPaths() {
  return { paths: [], fallback: "blocking" };
}

export default function CategoryPage({ site }) {
  const router = useRouter();
  const { slug } = router.query;
  const { loading, error, data } = useSearchIndex();
  const [sortBy, setSortBy] = useState("popular");

  const category = data?.categories.find((c) => c.slug === slug);
  const appsInCategory = useMemo(() => {
    if (!data || !category) return [];
    const filtered = data.apps.filter((a) => a.category_ids.includes(category.id));
    return sortApps(filtered, sortBy);
  }, [data, category, sortBy]);

  return (
    <Layout site={site}>
      {loading && <StateMessage kind="loading">กำลังโหลดรายการแอป...</StateMessage>}
      {error && (
        <StateMessage kind="error">
          โหลดข้อมูลไม่สำเร็จ: {error} — ลองรีเฟรชหน้าใหม่อีกครั้ง
        </StateMessage>
      )}

      {data && !category && slug && (
        <StateMessage kind="empty">
          ไม่พบหมวดหมู่ "{slug}" — <Link href="/">กลับหน้าแรก</Link>
        </StateMessage>
      )}

      {category && (
        <>
          <section className="cat-header" style={{ "--pill-color": category.color }}>
            <span className="cat-header__icon" aria-hidden="true">{category.icon}</span>
            <div>
              <h1>{category.name}</h1>
              <p>{appsInCategory.length} แอปในหมวดนี้</p>
            </div>
          </section>

          <div className="sort-row">
            <span>เรียงตาม:</span>
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`sort-btn${sortBy === opt.value ? " sort-btn--active" : ""}`}
                onClick={() => setSortBy(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {appsInCategory.length === 0 ? (
            <StateMessage kind="empty">ยังไม่มีแอปในหมวดนี้ — กลับมาดูใหม่ภายหลัง</StateMessage>
          ) : (
            <div className="app-grid">
              {appsInCategory.map((app) => (
                <AppCard key={app.id} app={app} categories={data.categories} />
              ))}
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
