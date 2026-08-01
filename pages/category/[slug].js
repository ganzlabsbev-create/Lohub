import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "../../components/Layout";
import AppCard from "../../components/AppCard";
import StateMessage from "../../components/StateMessage";
import { useSearchIndex } from "../../lib/useSearchIndex";
import { sortApps, SORT_OPTIONS } from "../../lib/sort";
import { getSiteSettings } from "../../lib/site";
import { getEffectiveCategories } from "../../lib/mockAdmin";
import { useTranslation } from "../../lib/i18n";

export async function getStaticProps() {
  return { props: { site: getSiteSettings() } };
}

// จำเป็นต้องมี เพราะหน้านี้เป็น dynamic route ([slug]) ที่ใช้ getStaticProps — ถ้าไม่มี next build จะพังทั้งเว็บ
// ข้อมูลหมวดหมู่จริงโหลดฝั่ง client จาก search-index.json (useSearchIndex) เลยไม่ต้อง pre-list path ไหนล่วงหน้า
export async function getStaticPaths() {
  return { paths: [], fallback: "blocking" };
}

// ป้ายชื่อตัวเลือกการเรียง — key ต้องตรงกับ value ใน lib/sort.js (SORT_OPTIONS)
// แยกออกมาจาก lib/sort.js เพื่อให้ label แสดงผลได้ทั้ง 2 ภาษาโดยไม่แตะ logic การเรียงเดิม
const SORT_LABEL_KEYS = {
  popular: "category.sortPopular",
  newest: "category.sortNewest",
  name: "category.sortName",
};

export default function CategoryPage({ site }) {
  const router = useRouter();
  const { slug } = router.query;
  const { loading, error, data } = useSearchIndex();
  const [sortBy, setSortBy] = useState("popular");
  const { t } = useTranslation();

  // ใช้หมวดหมู่ effective (รวม override ของ admin) ไม่งั้นแก้หมวดหมู่แล้วจะไม่ขึ้นหน้านี้
  const categories = data ? getEffectiveCategories(data.categories) : [];
  const category = categories.find((c) => c.slug === slug);
  const appsInCategory = useMemo(() => {
    if (!data || !category) return [];
    const filtered = data.apps.filter((a) => a.category_ids.includes(category.id));
    return sortApps(filtered, sortBy);
  }, [data, category, sortBy]);

  return (
    <Layout site={site}>
      {loading && <StateMessage kind="loading">{t("category.loading")}</StateMessage>}
      {error && (
        <StateMessage kind="error">
          {t("category.loadError", { error })}
        </StateMessage>
      )}

      {data && !category && slug && (
        <StateMessage kind="empty">
          {t("category.notFound", { slug })} <Link href="/">{t("category.backToHome")}</Link>
        </StateMessage>
      )}

      {category && (
        <>
          <section className="cat-header" style={{ "--pill-color": category.color }}>
            <span className="cat-header__icon" aria-hidden="true">{category.icon}</span>
            <div>
              <h1>{category.name}</h1>
              <p>{t("category.appCount", { count: appsInCategory.length })}</p>
            </div>
          </section>

          <div className="sort-row">
            <span>{t("category.sortBy")}</span>
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`sort-btn${sortBy === opt.value ? " sort-btn--active" : ""}`}
                onClick={() => setSortBy(opt.value)}
              >
                {t(SORT_LABEL_KEYS[opt.value] || opt.label)}
              </button>
            ))}
          </div>

          {appsInCategory.length === 0 ? (
            <StateMessage kind="empty">{t("category.noApps")}</StateMessage>
          ) : (
            <div className="app-grid">
              {appsInCategory.map((app) => (
                <AppCard key={app.id} app={app} categories={categories} />
              ))}
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
