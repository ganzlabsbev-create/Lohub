import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession, signIn } from "next-auth/react";
import Layout from "../../components/Layout";
import AppIcon from "../../components/AppIcon";
import AppCard from "../../components/AppCard";
import CategoryPill from "../../components/CategoryPill";
import InstallButtons from "../../components/InstallButtons";
import ScreenshotGallery from "../../components/ScreenshotGallery";
import VersionHistory from "../../components/VersionHistory";
import StateMessage from "../../components/StateMessage";
import { useSearchIndex } from "../../lib/useSearchIndex";
import { formatSize, formatDate } from "../../lib/format";
import { getSiteSettings } from "../../lib/site";
import { getMockApprovedApps, getEffectiveCategories } from "../../lib/mockAdmin";
import { isAdminUsername } from "../../lib/auth";
import { apiGet, apiPost, apiDelete } from "../../lib/apiClient";

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
  const { data: session } = useSession();

  // แอปที่ admin mock-อนุมัติแล้ว (Part 8) ยังไม่ได้อยู่ใน search-index.json จริง (client เขียนไฟล์ไม่ได้) — เลยเผื่อหาที่นี่ด้วย
  const mockApproved = data ? Object.values(getMockApprovedApps()) : [];
  const app = data?.apps.find((a) => a.slug === slug) || mockApproved.find((a) => a.slug === slug);
  const developer = app && data.developers.find((d) => d.id === app.developer_id);
  // ใช้หมวดหมู่ effective (รวม override ของ admin) ไม่งั้นแก้หมวดหมู่แล้วจะไม่ขึ้นหน้านี้
  const categories = data ? getEffectiveCategories(data.categories) : [];
  const cats = app
    ? (app.category_ids || []).map((id) => categories.find((c) => c.id === id)).filter(Boolean)
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

          <ScreenshotGallery screenshots={app.screenshots} />

          <section className="section">
            <div className="section__head">
              <h2>เกี่ยวกับแอปนี้</h2>
            </div>
            <p className="app-detail__desc">{app.description_full || app.description_short}</p>
          </section>

          {app.features?.length > 0 && (
            <div className="feature-row">
              {app.features.map((f) => (
                <span key={f} className="tag tag--feature">{f}</span>
              ))}
            </div>
          )}

          <div className="meta-grid">
            <div><span>เวอร์ชันล่าสุด</span><strong className="mono">v{app.current_version}</strong></div>
            <div><span>ขนาดไฟล์</span><strong>{formatSize(app.size_mb)}</strong></div>
            <div><span>รองรับ</span><strong>{app.min_os || "-"}</strong></div>
            <div><span>สัญญาอนุญาต</span><strong>{app.license || "-"}</strong></div>
            <div><span>ภาษา</span><strong>{(app.languages || []).join(", ") || "-"}</strong></div>
          </div>

          <VersionHistory versions={app.version_history} currentVersion={app.current_version} />

          {isAdminUsername(session?.user?.login, site) && <AdminDeleteApp app={app} />}

          <ReviewsSection app={app} />

          <RelatedApps app={app} categories={categories} allApps={data.apps} />
        </>
      )}
    </Layout>
  );
}

// แอปที่เกี่ยวข้อง — คัดจากหมวดหมู่แรกของแอปนี้ (ใช้ข้อมูลที่โหลดมาแล้วทั้งหมด ไม่ fetch เพิ่ม)
function RelatedApps({ app, categories, allApps }) {
  const firstCatId = app.category_ids?.[0];
  if (!firstCatId) return null;
  const related = allApps
    .filter((a) => a.id !== app.id && (a.category_ids || []).includes(firstCatId))
    .slice(0, 4);
  if (related.length === 0) return null;

  return (
    <section className="section">
      <div className="section__head">
        <h2>แอปที่เกี่ยวข้อง</h2>
      </div>
      <div className="app-grid">
        {related.map((a) => (
          <AppCard key={a.id} app={a} categories={categories} />
        ))}
      </div>
    </section>
  );
}

// โซน Admin: ลบแอปนี้ทิ้งถาวร — ใช้ isAdminUsername แบบเดียวกับ AdminGuard (เทียบ site.admin_github_usernames)
// เพราะหน้านี้เป็นหน้าเดียวในโปรเจกต์ที่โชว์รายละเอียด "แอปที่ published จริง" ทีละแอป จึงเหมาะกว่าหน้า
// admin/queue.js ซึ่งโชว์เฉพาะ draft ที่ยังไม่ผ่านตรวจ (ยังไม่มีไฟล์ data/apps/{id}.json ให้ลบ)
function AdminDeleteApp({ app }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function handleDelete() {
    const confirmed = window.confirm(
      `ยืนยันลบแอป "${app.name}" ถาวร? การลบนี้กู้คืนไม่ได้ (ลบไฟล์จริงใน GitHub)`
    );
    if (!confirmed) return;

    setBusy(true);
    setError("");
    apiDelete(`/api/admin/apps/${app.id}`)
      .then(() => {
        window.alert(`ลบแอป "${app.name}" เรียบร้อยแล้ว`);
        router.push("/");
      })
      .catch((err) => {
        setError(err.message);
        setBusy(false);
      });
  }

  return (
    <section className="section banner-note" style={{ borderColor: "var(--danger-soft)" }}>
      <p style={{ margin: "0 0 10px" }}>
        โซน Admin — ลบแอปนี้ออกจากระบบถาวร (ลบไฟล์ <code>data/apps/{app.id}.json</code> ใน GitHub จริง)
      </p>
      <button type="button" className="btn-danger btn-small" onClick={handleDelete} disabled={busy}>
        {busy ? "กำลังลบ..." : "ลบแอปนี้"}
      </button>
      {error && <span className="field-error"> {error}</span>}
    </section>
  );
}

// ---------- ส่วนรีวิว + รายงานปัญหา ----------

function ReviewsSection({ app }) {
  const { data: session } = useSession();
  const [state, setState] = useState({ loading: true, error: null, reviews: [] });
  const [reportOpen, setReportOpen] = useState(false);

  function load() {
    setState((s) => ({ ...s, loading: true, error: null }));
    apiGet(`/api/reviews?app_id=${encodeURIComponent(app.id)}`)
      .then((data) => setState({ loading: false, error: null, reviews: data.reviews || [] }))
      .catch((err) => setState({ loading: false, error: err.message, reviews: [] }));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.id]);

  const { loading, error, reviews } = state;

  return (
    <section className="section">
      <div className="section__head">
        <h2>รีวิวจากผู้ใช้</h2>
      </div>

      {loading && <StateMessage kind="loading">กำลังโหลดรีวิว...</StateMessage>}
      {error && <StateMessage kind="error">โหลดรีวิวไม่สำเร็จ: {error}</StateMessage>}
      {!loading && !error && reviews.length === 0 && (
        <StateMessage kind="empty">ยังไม่มีรีวิว เป็นคนแรกที่รีวิวแอปนี้สิ</StateMessage>
      )}

      {reviews.length > 0 && (
        <ul className="dev-list">
          {reviews.map((r) => (
            <ReviewItem key={r.id} review={r} />
          ))}
        </ul>
      )}

      {session ? (
        // โหลดรีวิวใหม่ทั้งชุดหลังส่งสำเร็จ แทนที่จะต่อ object ที่ backend ส่งกลับเองตรงๆ
        // เผื่อ field ที่ backend เติมให้ (เช่น สถานะ visible/hidden) ไม่ตรงกับที่ client เดาไว้
        <ReviewForm appId={app.id} onSubmitted={load} />
      ) : (
        <StateMessage kind="empty">
          เข้าสู่ระบบเพื่อเขียนรีวิว —{" "}
          <button type="button" className="link-button" onClick={() => signIn("github")}>
            เข้าสู่ระบบด้วย GitHub
          </button>
        </StateMessage>
      )}

      <ReportProblem app={app} session={session} open={reportOpen} setOpen={setReportOpen} />
    </section>
  );
}

function ReviewItem({ review }) {
  return (
    <li className="dev-row">
      <div className="dev-row__body">
        <p className="dev-row__name mono">
          {"★".repeat(review.rating || 0)}
          {"☆".repeat(5 - (review.rating || 0))}
        </p>
        <p className="dev-row__meta mono">
          @{review.username || review.display_name || "ผู้ใช้"} · {formatDate(review.created_at)}
        </p>
        {review.comment && <p className="dev-row__text">{review.comment}</p>}
      </div>
    </li>
  );
}

function StarRatingInput({ value, onChange }) {
  return (
    <div className="star-input" role="radiogroup" aria-label="ให้คะแนน 1-5 ดาว">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={`star-btn${n <= value ? " star-btn--filled" : ""}`}
          onClick={() => onChange(n)}
          aria-label={`${n} ดาว`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function ReviewForm({ appId, onSubmitted }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function submit(e) {
    e.preventDefault();
    if (rating < 1) {
      setError("กรุณาเลือกจำนวนดาวก่อนส่งรีวิว");
      return;
    }
    setSubmitting(true);
    setError("");
    apiPost("/api/reviews", { app_id: appId, rating, comment })
      .then(() => {
        setRating(0);
        setComment("");
        onSubmitted();
      })
      .catch((err) => setError(err.message))
      .finally(() => setSubmitting(false));
  }

  return (
    <form className="review-form" onSubmit={submit}>
      <label className="form-field">
        <span className="form-field__label">ให้คะแนน</span>
        <StarRatingInput value={rating} onChange={setRating} />
      </label>
      <label className="form-field">
        <span className="form-field__label">ความคิดเห็น (ถ้ามี)</span>
        <textarea
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="บอกเล่าประสบการณ์การใช้งาน..."
        />
      </label>
      {error && <span className="field-error">{error}</span>}
      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "กำลังส่ง..." : "ส่งรีวิว"}
        </button>
      </div>
    </form>
  );
}

const REPORT_TYPES = [
  { value: "bug", label: "แอปมีปัญหา / ใช้งานไม่ได้" },
  { value: "content", label: "ข้อมูลไม่ถูกต้อง" },
  { value: "other", label: "อื่นๆ" },
];

function ReportProblem({ app, session, open, setOpen }) {
  const [type, setType] = useState("bug");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  if (!session) {
    return (
      <p className="report-toggle-row">
        พบปัญหากับแอปนี้? —{" "}
        <button type="button" className="link-button" onClick={() => signIn("github")}>
          เข้าสู่ระบบเพื่อรายงานปัญหา
        </button>
      </p>
    );
  }

  if (done) {
    return <p className="report-toggle-row">✓ ส่งรายงานปัญหาเรียบร้อย ขอบคุณที่แจ้งให้ทราบ</p>;
  }

  if (!open) {
    return (
      <p className="report-toggle-row">
        <button type="button" className="link-button" onClick={() => setOpen(true)}>
          รายงานปัญหาของแอปนี้
        </button>
      </p>
    );
  }

  function submit(e) {
    e.preventDefault();
    if (message.trim().length < 3) {
      setError("กรอกรายละเอียดปัญหาอย่างน้อย 3 ตัวอักษร");
      return;
    }
    setSubmitting(true);
    setError("");
    apiPost("/api/reports", { app_id: app.id, type, message })
      .then(() => setDone(true))
      .catch((err) => setError(err.message))
      .finally(() => setSubmitting(false));
  }

  return (
    <form className="review-form" onSubmit={submit}>
      <label className="form-field">
        <span className="form-field__label">ประเภทปัญหา</span>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          {REPORT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      <label className="form-field">
        <span className="form-field__label">รายละเอียด</span>
        <textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
      </label>
      {error && <span className="field-error">{error}</span>}
      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "กำลังส่ง..." : "ส่งรายงาน"}
        </button>
        <button type="button" className="btn-secondary" onClick={() => setOpen(false)} disabled={submitting}>
          ยกเลิก
        </button>
      </div>
    </form>
  );
}
