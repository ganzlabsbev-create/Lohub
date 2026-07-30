import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import AppCard from "../components/AppCard";
import StateMessage from "../components/StateMessage";
import { useSearchIndex } from "../lib/useSearchIndex";
import { searchApps } from "../lib/search";
import { getSiteSettings } from "../lib/site";

export async function getStaticProps() {
  return { props: { site: getSiteSettings() } };
}

export default function SearchPage({ site }) {
  const router = useRouter();
  const { loading, error, data } = useSearchIndex();
  const [query, setQuery] = useState("");
  const [ready, setReady] = useState(false);

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

  return (
    <Layout site={site}>
      <section className="search-head">
        <h1>ค้นหาแอป</h1>
        <input
          type="search"
          className="search-input"
          placeholder="ค้นชื่อแอป, นักพัฒนา, หมวดหมู่ หรือฟีเจอร์..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </section>

      {loading && <StateMessage kind="loading">กำลังโหลดฐานข้อมูลแอป...</StateMessage>}
      {error && (
        <StateMessage kind="error">
          โหลดข้อมูลไม่สำเร็จ: {error} — ลองรีเฟรชหน้าใหม่อีกครั้ง
        </StateMessage>
      )}

      {data && ready && (
        <>
          {query.trim() === "" && (
            <StateMessage kind="empty">พิมพ์คำค้นด้านบนเพื่อเริ่มค้นหา</StateMessage>
          )}
          {query.trim() !== "" && results.length === 0 && (
            <StateMessage kind="empty">ไม่พบแอปที่ตรงกับ "{query}"</StateMessage>
          )}
          {results.length > 0 && (
            <>
              <p className="search-count">พบ {results.length} แอป</p>
              <div className="app-grid">
                {results.map((app) => (
                  <AppCard key={app.id} app={app} categories={data.categories} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </Layout>
  );
}
