import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import AppCard from "../components/AppCard";
import StateMessage from "../components/StateMessage";
import { useSearchIndex } from "../lib/useSearchIndex";
import { searchApps } from "../lib/search";
import { getSiteSettings } from "../lib/site";
import { getEffectiveCategories } from "../lib/mockAdmin";
import { useTranslation } from "../lib/i18n";

export async function getStaticProps() {
  return { props: { site: getSiteSettings() } };
}

export default function SearchPage({ site }) {
  const router = useRouter();
  const { loading, error, data } = useSearchIndex();
  const [query, setQuery] = useState("");
  const [ready, setReady] = useState(false);
  const { t } = useTranslation();

  // เติมค่าเริ่มต้นจาก ?q= ใน URL (ทำให้แชร์ลิงก์ผลค้นหาได้)
  useEffect(() => {
    if (!router.isReady) return;
    const q = typeof router.query.q === "string" ? router.query.q : "";
    setQuery(q);
    setReady(true);
  }, [router.isReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // sync คำค้นกลับเข้า URL (shallow, ไม่ reload หน้า) กันการยิงถี่ตอนพิมพ์
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      const next = query ? { q: query } : {};
      router.replace({ pathname: "/search", query: next }, undefined, { shallow: true });
    }, 350);
    return () => clearTimeout(t);
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  const results = useMemo(() => {
    if (!data) return [];
    return searchApps(data.apps, query);
  }, [data, query]);
  // ใช้หมวดหมู่ effective (รวม override ของ admin) ไม่งั้นแก้หมวดหมู่แล้วจะไม่ขึ้นหน้านี้
  const categories = data ? getEffectiveCategories(data.categories) : [];

  return (
    <Layout site={site}>
      <section className="search-head">
        <h1>{t("search.title")}</h1>
        <input
          type="search"
          className="search-input"
          placeholder={t("search.placeholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </section>

      {loading && <StateMessage kind="loading">{t("search.loading")}</StateMessage>}
      {error && (
        <StateMessage kind="error">
          {t("search.loadError", { error })}
        </StateMessage>
      )}

      {data && ready && (
        <>
          {query.trim() === "" && (
            <StateMessage kind="empty">{t("search.startTyping")}</StateMessage>
          )}
          {query.trim() !== "" && results.length === 0 && (
            <StateMessage kind="empty">{t("search.noResults", { query })}</StateMessage>
          )}
          {results.length > 0 && (
            <>
              <p className="search-count">{t("search.resultsCount", { count: results.length })}</p>
              <div className="app-grid">
                {results.map((app) => (
                  <AppCard key={app.id} app={app} categories={categories} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </Layout>
  );
}
