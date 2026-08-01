import { useEffect, useState } from "react";
import Link from "next/link";
import Layout from "../../components/Layout";
import StateMessage from "../../components/StateMessage";
import AppIcon from "../../components/AppIcon";
import AdminNav from "../../components/AdminNav";
import AdminGuard from "../../components/AdminGuard";
import { useSearchIndex } from "../../lib/useSearchIndex";
import { getSiteSettings } from "../../lib/site";
import { formatDate, formatSize } from "../../lib/format";
import { apiGet, apiPatch } from "../../lib/apiClient";
import { useTranslation } from "../../lib/i18n";

export async function getStaticProps() {
  return { props: { site: getSiteSettings() } };
}

// Part 10: หน้านี้จำกัดเฉพาะบัญชีที่อยู่ใน admin_github_usernames (ดู AdminGuard)
//
// เดิมหน้านี้อ่าน/เขียนผ่าน lib/mockAdmin.js (localStorage mock) ซึ่งเป็นคนละระบบกับแอปที่ merge
// เข้ามาจริงผ่าน PR เลยไม่เคยเห็นแอปที่ส่งจริงๆ เลย ตอนนี้แก้เป็นของจริง 2 ขั้นตอนต่อกัน:
//   1) PR ที่ /dev/submit เปิดไว้ (ยังไม่ merge) — กด "ผสาน (merge)" ตรงนี้ได้เลย ไม่ต้องไป GitHub
//   2) หลัง merge, workflow convert-submissions.yml จะสร้าง data/apps/{id}.json (status: pending)
//      ให้อัตโนมัติ (รอสักครู่) แล้วมาโผล่ในคิวรอตรวจด้านล่าง กด "อนุมัติ" เพื่อ publish ขึ้นเว็บจริง
export default function AdminQueuePage({ site }) {
  const { loading: siteLoading, error: siteError, data } = useSearchIndex();
  const [prState, setPrState] = useState({ loading: true, error: null, prs: null });
  const [appState, setAppState] = useState({ loading: true, error: null, apps: null });
  const { t } = useTranslation();

  function loadPRs() {
    setPrState((s) => ({ ...s, loading: true, error: null }));
    apiGet("/api/admin/apps/submission-prs")
      .then((res) => setPrState({ loading: false, error: null, prs: res.prs || [] }))
      .catch((err) => setPrState({ loading: false, error: err.message, prs: null }));
  }

  function loadApps() {
    setAppState((s) => ({ ...s, loading: true, error: null }));
    apiGet("/api/admin/apps/pending")
      .then((res) => setAppState({ loading: false, error: null, apps: res.apps || [] }))
      .catch((err) => setAppState({ loading: false, error: err.message, apps: null }));
  }

  useEffect(() => {
    loadPRs();
    loadApps();
  }, []);

  return (
    <Layout site={site}>
      <AdminGuard site={site}>
        <section className="section dev-narrow">
          <AdminNav active="queue" />
          <div className="section__head">
            <h1>{t("adminQueue.title")}</h1>
          </div>

          <h2 style={{ marginTop: 4 }}>{t("adminQueue.prSectionTitle")}</h2>
          <p className="banner-note">{t("adminQueue.prSectionNote")}</p>
          {prState.loading && <StateMessage kind="loading">{t("adminQueue.loadingPr")}</StateMessage>}
          {prState.error && <StateMessage kind="error">{t("adminQueue.loadPrError", { error: prState.error })}</StateMessage>}
          {prState.prs && <PRList prs={prState.prs} onChanged={() => { loadPRs(); loadApps(); }} />}

          <h2 style={{ marginTop: 32 }}>{t("adminQueue.publishSectionTitle")}</h2>
          <p className="banner-note">{t("adminQueue.publishSectionNote")}</p>
          {(appState.loading || siteLoading) && <StateMessage kind="loading">{t("adminQueue.loading")}</StateMessage>}
          {(appState.error || siteError) && (
            <StateMessage kind="error">{t("adminQueue.loadError", { error: appState.error || siteError })}</StateMessage>
          )}
          {data && appState.apps && (
            <QueueList
              queue={appState.apps}
              developers={data.developers}
              categories={data.categories}
              onChanged={loadApps}
            />
          )}
        </section>
      </AdminGuard>
    </Layout>
  );
}

function PRList({ prs, onChanged }) {
  const { t } = useTranslation();
  if (prs.length === 0) {
    return <StateMessage kind="empty">{t("adminQueue.noPrs")}</StateMessage>;
  }
  return (
    <ul className="dev-list">
      {prs.map((pr) => (
        <PRRow key={pr.number} pr={pr} onChanged={onChanged} />
      ))}
    </ul>
  );
}

function PRRow({ pr, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { t } = useTranslation();

  function merge() {
    setBusy(true);
    setError("");
    apiPatch(`/api/admin/apps/submission-prs/${pr.number}`, { action: "merge" })
      .then(onChanged)
      .catch((err) => setError(err.message))
      .finally(() => setBusy(false));
  }

  return (
    <li className="dev-row">
      <div className="dev-row__body">
        <p className="dev-row__name">{pr.title}</p>
        <p className="dev-row__meta mono">
          #{pr.number} · @{pr.author} · {formatDate(pr.created_at)}
        </p>
        {error && <span className="field-error">{error}</span>}
      </div>
      <div className="dev-row__actions">
        <a href={pr.html_url} target="_blank" rel="noreferrer" className="btn-secondary btn-small">
          {t("adminQueue.viewDiff")}
        </a>
        <button type="button" className="btn-primary btn-small" onClick={merge} disabled={busy}>
          {t("adminQueue.merge")}
        </button>
      </div>
    </li>
  );
}

function QueueList({ queue, developers, categories, onChanged }) {
  const { t } = useTranslation();
  if (queue.length === 0) {
    return <StateMessage kind="empty">{t("adminQueue.noPending")}</StateMessage>;
  }

  return (
    <ul className="queue-list">
      {queue.map((draft) => (
        <QueueItem
          key={draft.id}
          draft={draft}
          developer={developers.find((d) => d.id === draft.developer_id)}
          categories={categories.filter((c) => draft.category_ids?.includes(c.id))}
          onChanged={onChanged}
        />
      ))}
    </ul>
  );
}

function QueueItem({ draft, developer, categories, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const { t } = useTranslation();

  const primaryMethod = draft.install_methods?.find((m) => m.primary) || draft.install_methods?.[0];

  function approve() {
    setBusy(true);
    setError("");
    apiPatch(`/api/admin/apps/${draft.id}`, { action: "approve" })
      .then(onChanged)
      .catch((err) => setError(err.message))
      .finally(() => setBusy(false));
  }

  function confirmReject() {
    if (reason.trim().length < 3) {
      setError(t("adminQueue.rejectReasonRequired"));
      return;
    }
    setBusy(true);
    setError("");
    apiPatch(`/api/admin/apps/${draft.id}`, { action: "reject", reason })
      .then(onChanged)
      .catch((err) => setError(err.message))
      .finally(() => setBusy(false));
  }

  return (
    <li className="queue-item">
      <div className="queue-item__head">
        <AppIcon app={draft} size={48} />
        <div className="queue-item__title">
          <h3>{draft.name}</h3>
          <p className="queue-item__meta mono">
            {draft.id} · {t("adminQueue.submittedBy")} {developer?.name || draft.developer_id} · {formatDate(draft.created_at)}
          </p>
        </div>
      </div>

      <p className="queue-item__desc">{draft.description_short}</p>

      <dl className="queue-item__facts">
        <div>
          <dt>{t("adminQueue.category")}</dt>
          <dd>{categories.map((c) => c.name).join(", ") || "—"}</dd>
        </div>
        <div>
          <dt>{t("adminQueue.license")}</dt>
          <dd>{draft.license}</dd>
        </div>
        <div>
          <dt>{t("adminQueue.installVia")}</dt>
          <dd>
            {primaryMethod ? (
              <a href={primaryMethod.url} target="_blank" rel="noreferrer">
                {primaryMethod.type.toUpperCase()} {t("adminQueue.checkLink")}
              </a>
            ) : (
              "—"
            )}
          </dd>
        </div>
        <div>
          <dt>{t("adminQueue.sizeMb")}</dt>
          <dd>{formatSize(draft.size_mb)}</dd>
        </div>
      </dl>

      {error && <p className="field-error">{error}</p>}

      {!rejecting ? (
        <div className="form-actions">
          <button type="button" className="btn-primary" onClick={approve} disabled={busy}>
            {t("adminQueue.approve")}
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={() => setRejecting(true)}
            disabled={busy}
          >
            {t("adminQueue.reject")}
          </button>
          {developer && (
            <Link href={`/developer/${developer.id}`} className="btn-secondary btn-small">
              {t("adminQueue.viewDeveloperProfile")}
            </Link>
          )}
        </div>
      ) : (
        <div className="reject-box">
          <label className="form-field">
            <span className="form-field__label">{t("adminQueue.rejectReasonLabel")}</span>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError("");
              }}
              placeholder={t("adminQueue.rejectReasonPlaceholder")}
            />
          </label>
          <div className="form-actions">
            <button type="button" className="btn-danger" onClick={confirmReject} disabled={busy}>
              {t("adminQueue.confirmReject")}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setRejecting(false);
                setReason("");
                setError("");
              }}
              disabled={busy}
            >
              {t("adminQueue.cancel")}
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
