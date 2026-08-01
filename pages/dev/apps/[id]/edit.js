import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "../../../../components/Layout";
import StateMessage from "../../../../components/StateMessage";
import DevGuard from "../../../../components/DevGuard";
import { useSearchIndex } from "../../../../lib/useSearchIndex";
import { getSiteSettings } from "../../../../lib/site";
import { validateVersionForm, buildVersionUpdate, validateExtraLinks, buildExtraInstallMethods } from "../../../../lib/appDraft";
import { IconClose } from "../../../../components/Icons";
import {
  getMockSubmissions,
  updateMockSubmission,
  getMockAppUpdate,
  setMockAppUpdate,
} from "../../../../lib/mockAuth";
import { getMockApprovedApp } from "../../../../lib/mockAdmin";
import { useTranslation } from "../../../../lib/i18n";

export async function getStaticProps() {
  return { props: { site: getSiteSettings() } };
}

// route มี segment [id] แบบ dynamic แต่โหลดข้อมูลจริงฝั่ง client จาก search-index.json
// (เหมือน pages/app/[slug].js, pages/developer/[id].js) เลยไม่ต้อง pre-render path ไหนล่วงหน้า
export async function getStaticPaths() {
  return { paths: [], fallback: "blocking" };
}

export default function EditAppPage({ site }) {
  const router = useRouter();
  const { id } = router.query;
  const { loading, error, data } = useSearchIndex();
  const { t } = useTranslation();

  return (
    <Layout site={site}>
      <section className="section dev-narrow">
        <div className="section__head">
          <h1>{t("devEdit.title")}</h1>
        </div>
        {loading && <StateMessage kind="loading">{t("devEdit.loading")}</StateMessage>}
        {error && <StateMessage kind="error">{t("devEdit.loadError", { error })}</StateMessage>}
        {data && id && (
          <DevGuard developers={data.developers}>
            {(developer) => <EditAppBody developer={developer} apps={data.apps} appId={id} />}
          </DevGuard>
        )}
      </section>
    </Layout>
  );
}

function EditAppBody({ developer, apps, appId }) {
  const { t } = useTranslation();
  // แหล่งข้อมูล: แอปที่ผ่านแล้ว (search-index จริง หรือ admin mock-อนุมัติใน Part 8) มาก่อน,
  // ถ้าไม่เจอลองหา draft ที่ยัง pending
  const published = apps.find((a) => a.id === appId) || getMockApprovedApp(appId);
  const pendingUpdate = published ? getMockAppUpdate(published.id) : null;
  const baseApp = published ? pendingUpdate || published : null;

  const pendingDraft = !published
    ? getMockSubmissions().find((s) => s.id === appId)
    : null;

  const app = baseApp || pendingDraft;
  const isPublished = Boolean(published);

  if (!app || app.developer_id !== developer.id) {
    return (
      <StateMessage kind="empty">
        {t("devEdit.notFound")}{" "}
        <Link href="/dev/dashboard">{t("devEdit.backToDashboard")}</Link>
      </StateMessage>
    );
  }

  return (
    <VersionForm
      app={app}
      isPublished={isPublished}
      onSaved={(updatedApp) => {
        if (isPublished) {
          setMockAppUpdate(app.id, updatedApp);
        } else {
          updateMockSubmission(app.id, updatedApp);
        }
      }}
    />
  );
}

function VersionForm({ app, isPublished, onSaved }) {
  const primaryMethod = app.install_methods.find((m) => m.primary) || app.install_methods[0];
  const isApk = primaryMethod?.type === "apk";
  const { t } = useTranslation();

  const [form, setForm] = useState({
    version: app.current_version,
    note: "",
    apk_url: isApk ? primaryMethod?.url || "" : "",
    size_mb: isApk ? String(app.size_mb || "") : "",
  });
  // ลิงก์เว็บเพิ่มเติม (นอกเหนือจากวิธีติดตั้งหลัก) — โหลดจาก install_methods เดิมที่ไม่ใช่ primary
  const [extraLinks, setExtraLinks] = useState(
    app.install_methods.filter((m) => m !== primaryMethod && !m.primary).map((m) => ({ name: m.label || "", url: m.url || "" }))
  );
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(null);
  const [copied, setCopied] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function addExtraLink() {
    setExtraLinks((links) => [...links, { name: "", url: "" }]);
  }

  function updateExtraLink(index, field, value) {
    setExtraLinks((links) => links.map((link, i) => (i === index ? { ...link, [field]: value } : link)));
  }

  function removeExtraLink(index) {
    setExtraLinks((links) => links.filter((_, i) => i !== index));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const { valid, errors: nextErrors } = validateVersionForm(form, { requireFile: isApk });
    const extraLinksErrors = validateExtraLinks(extraLinks);
    setErrors({ ...nextErrors, extra_links: extraLinksErrors });
    if (!valid || extraLinksErrors) return;

    const updatedApp = buildVersionUpdate(app, form, { replaceLatest: !isPublished });
    const updatedPrimary = updatedApp.install_methods.find((m) => m.primary) || updatedApp.install_methods[0];
    const finalApp = {
      ...updatedApp,
      install_methods: [updatedPrimary, ...buildExtraInstallMethods(extraLinks)],
    };
    onSaved(finalApp);
    setSaved(finalApp);
  }

  function copyJson() {
    navigator.clipboard.writeText(JSON.stringify(saved, null, 2)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (saved) {
    return (
      <div className="submit-success">
        <p className="banner-note banner-note--ok">
          {t("devEdit.savedBanner", { status: isPublished ? t("devEdit.statusUpdatePending") : t("devEdit.statusEditedPending") })}
        </p>
        <p>{isPublished ? t("devEdit.nextStepsPublished") : t("devEdit.nextStepsDraft")}</p>
        <pre className="json-preview">{JSON.stringify(saved, null, 2)}</pre>
        <div className="form-actions">
          <button type="button" className="btn-primary" onClick={copyJson}>
            {copied ? t("devEdit.copied") : t("devEdit.copyJson")}
          </button>
          <Link href="/dev/dashboard" className="btn-secondary">
            {t("devEdit.backToDashboard")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form className="dev-form" onSubmit={handleSubmit} noValidate>
      <p className="banner-note">
        {t("devEdit.editingPrefix")} <strong>{app.name}</strong> {t("devEdit.currentVersionMid")}{" "}
        <span className="mono">v{app.current_version}</span>
      </p>

      <Field label={t("devEdit.newVersion")} error={errors.version}>
        <input
          className="mono"
          value={form.version}
          onChange={(e) => update("version", e.target.value)}
          placeholder="1.3.0"
        />
      </Field>

      <Field label={t("devEdit.versionNote")} error={errors.note}>
        <textarea rows={3} value={form.note} onChange={(e) => update("note", e.target.value)} />
      </Field>

      {isApk ? (
        <>
          <Field label={t("devEdit.newApkUrl")} error={errors.apk_url}>
            <input value={form.apk_url} onChange={(e) => update("apk_url", e.target.value)} />
          </Field>
          <Field label={t("devEdit.sizeMb")} error={errors.size_mb}>
            <input
              type="number"
              step="0.1"
              value={form.size_mb}
              onChange={(e) => update("size_mb", e.target.value)}
            />
          </Field>
        </>
      ) : (
        <Field label={t("devEdit.newUrlOptional")} error={errors.apk_url}>
          <input value={form.apk_url} onChange={(e) => update("apk_url", e.target.value)} />
        </Field>
      )}

      <p className="section__hint">
        {isPublished ? t("devEdit.hintPublished") : t("devEdit.hintDraft")}
      </p>

      <FieldGroup label={t("devEdit.extraLinks")}>
        <p className="section__hint">{t("devEdit.extraLinksHint")}</p>
        <div className="link-list">
          {extraLinks.map((link, i) => (
            <div className="link-row" key={i}>
              <input
                className="link-row__name"
                value={link.name}
                onChange={(e) => updateExtraLink(i, "name", e.target.value)}
                placeholder={t("devEdit.extraLinkNamePlaceholder")}
              />
              <input
                className="link-row__url"
                value={link.url}
                onChange={(e) => updateExtraLink(i, "url", e.target.value)}
                placeholder="https://example.com"
              />
              <button
                type="button"
                className="link-row__remove"
                onClick={() => removeExtraLink(i)}
                aria-label={t("devEdit.removeLink")}
              >
                <IconClose size={16} />
              </button>
              {errors.extra_links?.[i] && (
                <p className="field-error link-row__error">
                  {errors.extra_links[i].name || errors.extra_links[i].url}
                </p>
              )}
            </div>
          ))}
        </div>
        <button type="button" className="btn-secondary btn-small" onClick={addExtraLink}>
          {t("devEdit.addLink")}
        </button>
      </FieldGroup>

      <div className="form-actions">
        <button type="submit" className="btn-primary">
          {t("devEdit.save")}
        </button>
        <Link href="/dev/dashboard">{t("devEdit.cancel")}</Link>
      </div>
    </form>
  );
}

function Field({ label, error, children }) {
  return (
    <label className={`form-field${error ? " form-field--error" : ""}`}>
      <span className="form-field__label">{label}</span>
      {children}
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}

// เหมือน Field แต่ใช้ <div> แทน <label> — สำหรับกลุ่มที่มีปุ่ม/แถวหลายอันข้างใน
// (ถ้าใช้ <label> ครอบ การคลิกข้อความ label จะไปโฟกัสแค่ input ตัวแรกข้างในผิดตัว)
function FieldGroup({ label, error, children }) {
  return (
    <div className={`form-field${error ? " form-field--error" : ""}`}>
      <span className="form-field__label">{label}</span>
      {children}
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}
