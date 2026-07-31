import { useMemo, useState } from "react";
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

  return (
    <Layout site={site}>
      <section className="section dev-narrow">
        <div className="section__head">
          <h1>แก้ไข / อัปเวอร์ชันแอป</h1>
        </div>
        {loading && <StateMessage kind="loading">กำลังโหลดข้อมูล...</StateMessage>}
        {error && <StateMessage kind="error">โหลดข้อมูลไม่สำเร็จ: {error}</StateMessage>}
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
        ไม่พบแอปนี้ หรือคุณไม่มีสิทธิ์แก้ไข —{" "}
        <Link href="/dev/dashboard">กลับไป Dashboard</Link>
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
          ✅ บันทึกแล้ว! (สถานะ: {isPublished ? "รอตรวจอัปเดต" : "รอตรวจ (แก้ไขแล้ว)"})
        </p>
        <p>
          {isPublished
            ? "ขั้นตอนต่อไป (ทำระบบจริงใน Part 10): อัปเดตนี้จะกลายเป็น PR แก้ไข data/apps/{id}.json ตอนนี้เก็บไว้ในเครื่องนี้ก่อน — คัดลอก JSON ด้านล่างไปใช้ต่อได้"
            : "แก้ไข draft ที่ยังรอตรวจนี้เรียบร้อย — ดูสถานะทั้งหมดได้ที่ Dashboard"}
        </p>
        <pre className="json-preview">{JSON.stringify(saved, null, 2)}</pre>
        <div className="form-actions">
          <button type="button" className="btn-primary" onClick={copyJson}>
            {copied ? "คัดลอกแล้ว ✓" : "คัดลอก JSON"}
          </button>
          <Link href="/dev/dashboard" className="btn-secondary">
            กลับไป Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form className="dev-form" onSubmit={handleSubmit} noValidate>
      <p className="banner-note">
        กำลังแก้ไข: <strong>{app.name}</strong> · เวอร์ชันปัจจุบัน{" "}
        <span className="mono">v{app.current_version}</span>
      </p>

      <Field label="เวอร์ชันใหม่" error={errors.version}>
        <input
          className="mono"
          value={form.version}
          onChange={(e) => update("version", e.target.value)}
          placeholder="1.3.0"
        />
      </Field>

      <Field label="โน้ตเวอร์ชันนี้ (มีอะไรเปลี่ยนแปลง)" error={errors.note}>
        <textarea rows={3} value={form.note} onChange={(e) => update("note", e.target.value)} />
      </Field>

      {isApk ? (
        <>
          <Field label="ลิงก์ไฟล์ APK เวอร์ชันใหม่" error={errors.apk_url}>
            <input value={form.apk_url} onChange={(e) => update("apk_url", e.target.value)} />
          </Field>
          <Field label="ขนาดไฟล์ (MB)" error={errors.size_mb}>
            <input
              type="number"
              step="0.1"
              value={form.size_mb}
              onChange={(e) => update("size_mb", e.target.value)}
            />
          </Field>
        </>
      ) : (
        <Field label="ลิงก์ใหม่ (ไม่บังคับ ถ้ายังใช้ลิงก์เดิม เว้นว่างไว้ได้)" error={errors.apk_url}>
          <input value={form.apk_url} onChange={(e) => update("apk_url", e.target.value)} />
        </Field>
      )}

      <p className="section__hint">
        {isPublished
          ? "การอัปเวอร์ชันแอปที่ผ่านแล้วจะเพิ่มรายการใหม่เข้า version_history (ประวัติเก่ายังอยู่ครบ)"
          : "แอปนี้ยังไม่ผ่านการตรวจ — การแก้ไขจะแทนที่ข้อมูลเวอร์ชันเดิมในคิวรอตรวจ ไม่ได้สะสมเป็นประวัติ"}
      </p>

      <FieldGroup label="ลิงก์เว็บเพิ่มเติม (ไม่บังคับ)">
        <p className="section__hint">
          เผื่อว่านอกจากวิธีติดตั้งหลักแล้ว ยังมีเว็บให้ใช้งานก่อนก็ได้ — ใส่ชื่อลิงก์และ URL ได้กี่รายการก็ได้
        </p>
        <div className="link-list">
          {extraLinks.map((link, i) => (
            <div className="link-row" key={i}>
              <input
                className="link-row__name"
                value={link.name}
                onChange={(e) => updateExtraLink(i, "name", e.target.value)}
                placeholder="ชื่อลิงก์ เช่น ใช้บนเว็บ"
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
                aria-label="ลบลิงก์นี้"
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
          ➕ เพิ่มลิงก์
        </button>
      </FieldGroup>

      <div className="form-actions">
        <button type="submit" className="btn-primary">
          บันทึก
        </button>
        <Link href="/dev/dashboard">ยกเลิก</Link>
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
