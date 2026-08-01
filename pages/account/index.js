import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
import Layout from "../../components/Layout";
import DevAvatar from "../../components/DevAvatar";
import StateMessage from "../../components/StateMessage";
import { getSiteSettings } from "../../lib/site";
import { apiGet, apiPost } from "../../lib/apiClient";
import { formatDate } from "../../lib/format";
import { useSearchIndex } from "../../lib/useSearchIndex";
import { useTranslation } from "../../lib/i18n";

export async function getStaticProps() {
  return { props: { site: getSiteSettings() } };
}

// หน้าโปรไฟล์ผู้ใช้ที่ login แล้ว ใช้ร่วมกันทุก role (member/developer/admin)
// role/ข้อมูลจริงเชื่อจาก GET /api/profile เป็นหลัก ไม่คำนวณ role เองซ้ำฝั่ง client
// รายละเอียดเพิ่มเติมของ role "developer" (avatar/เว็บไซต์/จำนวนแอป) ดึงจาก search-index.json
// (แหล่งข้อมูลเดิมที่ทุกหน้าสาธารณะใช้อยู่แล้ว) — ไม่ได้เพิ่มการเรียก backend ใหม่
export default function AccountPage({ site }) {
  const { data: session, status } = useSession();
  const { t } = useTranslation();

  return (
    <Layout site={site}>
      <section className="section dev-narrow">
        <div className="section__head">
          <h1>{t("account.title")}</h1>
        </div>

        {status === "loading" && (
          <StateMessage kind="loading">{t("account.checkingLogin")}</StateMessage>
        )}

        {status !== "loading" && !session && (
          <StateMessage kind="empty">
            {t("account.loginPrompt")}{" "}
            <button type="button" className="link-button" onClick={() => signIn("github")}>
              {t("common.loginWithGithub")}
            </button>
          </StateMessage>
        )}

        {session && <ProfilePanel />}
      </section>
    </Layout>
  );
}

function ProfilePanel() {
  const [state, setState] = useState({ loading: true, error: null, profile: null });
  const { data: searchIndex } = useSearchIndex();
  const { t } = useTranslation();

  function load() {
    setState((s) => ({ ...s, loading: true, error: null }));
    apiGet("/api/profile")
      .then((data) => setState({ loading: false, error: null, profile: data }))
      .catch((err) => setState({ loading: false, error: err.message, profile: null }));
  }

  useEffect(() => {
    load();
  }, []);

  const { loading, error, profile } = state;

  if (loading) return <StateMessage kind="loading">{t("account.loadingProfile")}</StateMessage>;
  if (error) return <StateMessage kind="error">{t("account.loadProfileError", { error })}</StateMessage>;
  if (!profile) return null;

  const { username, role, profile: memberRow } = profile;
  const displayName = memberRow?.display_name || username;
  const avatar = memberRow?.avatar_url;
  const verified = !!memberRow?.verified;
  const joinedAt = memberRow?.created_at || memberRow?.joined_at;

  // /api/profile คืน "role" เดียว ตามลำดับความสำคัญ admin > developer > member (ของเดิม, ห้ามแก้)
  // แต่บัญชีจริงอาจมีสถานะซ้อนกันได้ (เช่น เป็นทั้งแอดมินและมีโปรไฟล์นักพัฒนาอยู่แล้ว) —
  // เช็คสถานะ developer แยกต่างหากจาก search-index.json (ข้อมูลสาธารณะเดียวกับที่หน้า /developer ใช้)
  // เพื่อโชว์ทุกแผงที่เกี่ยวข้อง ไม่ผูกกับ role เดียวที่ backend ส่งมา (ไม่แตะ resolveRole/isAdminUsername)
  const isAdmin = role === "admin";
  const developerRecord = searchIndex?.developers.find(
    (d) => (d.github_username || "").toLowerCase() === username.toLowerCase()
  );
  const isDeveloper = role === "developer" || !!developerRecord;

  const statusLabels = [];
  if (isAdmin) statusLabels.push(t("account.roleAdmin"));
  if (isDeveloper) statusLabels.push(t("account.roleDeveloper"));
  if (!statusLabels.length) statusLabels.push(t("account.roleMember"));

  return (
    <>
      <div className="account-head">
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt="" className="dev-avatar" width={72} height={72} />
        ) : (
          <div className="dev-avatar dev-avatar--fallback" style={{ width: 72, height: 72 }} aria-hidden="true">
            {displayName?.trim()?.[0]?.toUpperCase() || "?"}
          </div>
        )}
        <div>
          <p className="account-name">
            {displayName}
            {verified && (
              <span className="stamp stamp--inline" title={t("common.verified")}>
                ✓ verified
              </span>
            )}
          </p>
          <p className="account-role mono">
            @{username} · {statusLabels.join(" · ")}
            {joinedAt ? t("account.joinedOnShort", { date: formatDate(joinedAt) }) : ""}
          </p>
        </div>
        <Link
          href="/account/settings"
          className="icon-btn"
          aria-label={t("account.settings")}
          title={t("account.settings")}
          style={{ marginLeft: "auto" }}
        >
          ⚙️
        </Link>
      </div>

      {isDeveloper ? (
        <DeveloperProfileSummary username={username} />
      ) : (
        role === "member" && <DeveloperRequestPanel />
      )}
      {isAdmin && <AdminQuickLinks />}
      <ReporterReportsPanel />
    </>
  );
}

// Section "รายงานที่ฉันส่ง" — โชว์สถานะ + reply thread จาก dev ของรายงานที่ user คนนี้เคยส่งเอง
// (ตอบกลับเพิ่มได้เพื่อคุยต่อกับ dev, เปลี่ยนสถานะไม่ได้ — ตามสเปก dev-report-inbox)
function ReporterReportsPanel() {
  const [state, setState] = useState({ loading: true, error: null, reports: null });
  const { t } = useTranslation();

  function load() {
    setState((s) => ({ ...s, loading: true, error: null }));
    apiGet("/api/account/reports")
      .then((data) => setState({ loading: false, error: null, reports: data.reports || [] }))
      .catch((err) => setState({ loading: false, error: err.message, reports: null }));
  }

  useEffect(() => {
    load();
  }, []);

  const { loading, error, reports } = state;

  return (
    <section className="section">
      <div className="section__head">
        <h2>{t("account.myReportsTitle")}</h2>
      </div>

      {loading && <StateMessage kind="loading">{t("account.myReportsLoading")}</StateMessage>}
      {error && <StateMessage kind="error">{t("account.myReportsError", { error })}</StateMessage>}
      {reports && reports.length === 0 && <StateMessage kind="empty">{t("account.myReportsEmpty")}</StateMessage>}

      {reports && reports.length > 0 && (
        <ul className="dev-list">
          {reports.map((r) => (
            <MyReportRow key={r.id} report={r} onChanged={load} />
          ))}
        </ul>
      )}
    </section>
  );
}

function MyReportRow({ report, onChanged }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { t } = useTranslation();

  function sendReply(e) {
    e.preventDefault();
    if (!message.trim()) return;
    setBusy(true);
    setError("");
    apiPost(`/api/account/reports/${report.id}/reply`, { message })
      .then(() => {
        setMessage("");
        onChanged();
      })
      .catch((err) => setError(err.message))
      .finally(() => setBusy(false));
  }

  return (
    <li className="dev-row" style={{ flexDirection: "column", alignItems: "stretch" }}>
      <div className="dev-row__body">
        <p className="dev-row__meta mono">
          {report.app_id} · {formatDate(report.created_at)} · {t(`devInbox.status${report.status?.charAt(0).toUpperCase()}${report.status?.slice(1)}`)}
        </p>
        <p className="dev-row__text">{report.message}</p>
      </div>

      {report.replies && report.replies.length > 0 && (
        <ul className="dev-row__thread">
          {report.replies.map((rep) => (
            <li key={rep.id} className="dev-row__thread-item">
              <strong>
                {rep.author_role === "developer" ? t("adminReports.fromDeveloper") : t("adminReports.fromReporter")} @{rep.author_username}
              </strong>{" "}
              <span className="mono">{formatDate(rep.created_at)}</span>
              <p>{rep.message}</p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={sendReply} className="form-actions" style={{ gap: 8 }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t("devInbox.replyPlaceholder")}
          style={{ flex: 1 }}
          disabled={busy}
        />
        <button type="submit" className="btn-secondary btn-small" disabled={busy || !message.trim()}>
          {t("devInbox.sendReply")}
        </button>
      </form>
      {error && <span className="field-error">{error}</span>}
    </li>
  );
}

// สรุปโปรไฟล์นักพัฒนาให้ดูเองในหน้าบัญชี — จับคู่ด้วย github_username กับ search-index.json
// (ไฟล์เดียวกับที่หน้า /developer/{id} ใช้อยู่แล้ว จึงข้อมูลตรงกันเป๊ะ ไม่ต้องมี backend ใหม่)
function DeveloperProfileSummary({ username }) {
  const { loading, error, data } = useSearchIndex();
  const { t } = useTranslation();

  if (loading) return <StateMessage kind="loading">{t("account.loadingDevProfile")}</StateMessage>;
  if (error) return <StateMessage kind="error">{t("account.loadDevProfileError", { error })}</StateMessage>;

  const developer = data?.developers.find(
    (d) => (d.github_username || "").toLowerCase() === username.toLowerCase()
  );

  if (!developer) {
    return (
      <p className="banner-note">
        {t("account.devSummaryNotFound")}{" "}
        <Link href="/dev/dashboard">{t("account.devDashboard")}</Link>{" "}
        {t("account.devSummaryNotFoundSuffix")}
      </p>
    );
  }

  const apps = data.apps.filter((a) => a.developer_id === developer.id);

  return (
    <section className="section">
      <div className="section__head">
        <h2>{t("account.devSummaryTitle")}</h2>
      </div>

      <div className="dev-head" style={{ marginBottom: 16 }}>
        <DevAvatar developer={developer} size={56} />
        <div className="dev-head__info">
          <p className="account-name" style={{ margin: 0 }}>
            {developer.name}
            {developer.verified && (
              <span className="stamp stamp--inline" title={t("common.verified")}>
                ✓ verified
              </span>
            )}
          </p>
          <div className="dev-head__links">
            <Link href={`/developer/${developer.id}`}>{t("account.viewPublicProfile")}</Link>
            {developer.website && (
              <a href={developer.website} target="_blank" rel="noopener noreferrer">
                {t("account.website")}
              </a>
            )}
            <a
              href={`https://github.com/${developer.github_username}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              ◈ @{developer.github_username}
            </a>
          </div>
        </div>
      </div>

      <div className="meta-grid">
        <div>
          <span>{t("account.accountStatusLabel")}</span>
          <strong>{developer.status === "suspended" ? t("statusBadge.suspended") : t("statusBadge.active")}</strong>
        </div>
        <div>
          <span>{t("account.joinedLabel")}</span>
          <strong>{formatDate(developer.joined_at)}</strong>
        </div>
        <div>
          <span>{t("account.appCountLabel")}</span>
          <strong>{t("account.appCountValue", { count: apps.length })}</strong>
        </div>
        <div>
          <span>{t("account.contactLabel")}</span>
          <strong>{developer.contact || "-"}</strong>
        </div>
      </div>

      <p className="banner-note" style={{ marginTop: 16 }}>
        {t("account.goToDashboardPrefix")} <Link href="/dev/dashboard">{t("account.devDashboard")}</Link>{" "}
        {t("account.goToDashboardMid")}{" "}
        <Link href="/dev/submit">{t("account.submitApp")}</Link> {t("account.goToDashboardSuffix")}
      </p>
    </section>
  );
}

// ย่อจากลิงก์แอดมินยาวๆ ทุกหน้าย่อย เหลือปุ่มเดียวไปหน้า /admin — เมนูย่อยแอดมิน
// (คิว/นักพัฒนา/หมวดหมู่/รายงาน/รีวิว/สมาชิก) ให้ไปอยู่ในหน้า /admin เอง ไม่ต้องแปะซ้ำไว้ที่ Account
function AdminQuickLinks() {
  const { t } = useTranslation();
  return (
    <section className="section">
      <div className="section__head">
        <h2>{t("account.adminLinksTitle")}</h2>
      </div>
      <div className="form-actions">
        <Link href="/admin" className="btn-primary">
          {t("account.goToAdminPanel")}
        </Link>
      </div>
    </section>
  );
}

// สมัครเป็น Developer (เฉพาะ role === "member") — โชว์ฟอร์มถ้ายังไม่มีคำขอ/ถูกปฏิเสธ,
// ถ้ามีคำขอ pending อยู่แล้ว ให้ซ่อนฟอร์มแล้วโชว์สถานะรอตรวจ + รายละเอียดที่กรอกไว้แทนตามที่ระบุไว้
function DeveloperRequestPanel() {
  const [state, setState] = useState({ loading: true, error: null, request: null });
  const [form, setForm] = useState({
    reason: "",
    portfolio_url: "",
    display_name: "",
    website: "",
    contact: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const { t } = useTranslation();

  function loadRequest() {
    setState((s) => ({ ...s, loading: true, error: null }));
    apiGet("/api/developer-requests")
      .then((data) => setState({ loading: false, error: null, request: data.request }))
      .catch((err) => setState({ loading: false, error: err.message, request: null }));
  }

  useEffect(() => {
    loadRequest();
  }, []);

  const { loading, error, request } = state;

  function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    apiPost("/api/developer-requests", form)
      .then(() => loadRequest())
      .catch((err) => setSubmitError(err.message))
      .finally(() => setSubmitting(false));
  }

  if (loading) return <StateMessage kind="loading">{t("account.loadingRequestStatus")}</StateMessage>;
  if (error) return <StateMessage kind="error">{t("account.loadRequestError", { error })}</StateMessage>;

  if (request && request.status === "pending") {
    return (
      <section className="section">
        <div className="section__head">
          <h2>{t("account.devRequestTitle")}</h2>
        </div>
        <p className="banner-note">
          {t("account.devRequestPending", { date: formatDate(request.created_at) })}
        </p>
        {request.reason && (
          <p className="dev-row__text">
            <strong>{t("account.reasonLabel")}</strong> {request.reason}
          </p>
        )}
        {request.portfolio_url && (
          <p className="dev-row__text">
            <strong>{t("account.portfolioLabel")}</strong>{" "}
            <a href={request.portfolio_url} target="_blank" rel="noreferrer">
              {request.portfolio_url}
            </a>
          </p>
        )}
        {request.website && (
          <p className="dev-row__text">
            <strong>{t("account.websiteLabel")}</strong> {request.website}
          </p>
        )}
        {request.contact && (
          <p className="dev-row__text">
            <strong>{t("account.contactLabelColon")}</strong> {request.contact}
          </p>
        )}
      </section>
    );
  }

  return (
    <section className="section">
      <div className="section__head">
        <h2>{t("account.requestFormTitle")}</h2>
      </div>
      <p className="dev-row__text">{t("account.requestPitch")}</p>
      <p className="dev-row__text" style={{ fontSize: "0.85rem" }}>
        {t("account.hasProfilePrompt")}{" "}
        <button type="button" className="link-button" onClick={() => signIn("github")}>
          {t("account.loginAsDev")}
        </button>
      </p>

      {request?.status === "rejected" && (
        <p className="banner-note">
          {t("account.requestRejected")}
          {request.admin_note ? t("account.requestRejectedReason", { note: request.admin_note }) : ""}{" "}
          {t("account.requestRejectedSuffix")}
        </p>
      )}

      <form onSubmit={submit}>
        <label className="form-field">
          <span className="form-field__label">{t("account.reasonFieldLabel")}</span>
          <textarea
            rows={3}
            value={form.reason}
            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            required
          />
        </label>
        <label className="form-field">
          <span className="form-field__label">{t("account.portfolioFieldLabel")}</span>
          <input
            type="url"
            value={form.portfolio_url}
            onChange={(e) => setForm((f) => ({ ...f, portfolio_url: e.target.value }))}
            placeholder="https://..."
          />
        </label>
        <label className="form-field">
          <span className="form-field__label">{t("account.displayNameFieldLabel")}</span>
          <input
            type="text"
            value={form.display_name}
            onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
            placeholder={t("account.displayNamePlaceholder")}
          />
        </label>
        <label className="form-field">
          <span className="form-field__label">{t("account.websiteFieldLabel")}</span>
          <input
            type="url"
            value={form.website}
            onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
            placeholder="https://..."
          />
        </label>
        <label className="form-field">
          <span className="form-field__label">{t("account.contactFieldLabel")}</span>
          <input
            type="text"
            value={form.contact}
            onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))}
          />
        </label>
        <p className="dev-row__text" style={{ fontSize: "0.8rem" }}>
          {t("account.autoNote")}
        </p>
        {submitError && <span className="field-error">{submitError}</span>}
        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? t("account.sending") : t("account.submitRequest")}
          </button>
        </div>
      </form>
    </section>
  );
}
