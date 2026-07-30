import { useState } from "react";
import Link from "next/link";
import Layout from "../../components/Layout";
import StateMessage from "../../components/StateMessage";
import DevGuard from "../../components/DevGuard";
import { useSearchIndex } from "../../lib/useSearchIndex";
import { getSiteSettings } from "../../lib/site";
import { slugify, nextAppId, validateDraftForm, buildAppDraft } from "../../lib/appDraft";
import { addMockSubmission } from "../../lib/mockAuth";

export async function getStaticProps() {
  return { props: { site: getSiteSettings() } };
}

const EMPTY_FORM = {
  name: "",
  slug: "",
  description_short: "",
  description_full: "",
  category_ids: [],
  license: "",
  min_os: "",
  languages: ["th"],
  features: "",
  install_type: "apk",
  install_url: "",
  current_version: "1.0.0",
  size_mb: "",
};

export default function SubmitAppPage({ site }) {
  const { loading, error, data } = useSearchIndex();

  return (
    <Layout site={site}>
      <section className="section dev-narrow">
        <div className="section__head">
          <h1>ส่งแอปใหม่</h1>
        </div>
        {loading && <StateMessage kind="loading">กำลังโหลดข้อมูล...</StateMessage>}
        {error && <StateMessage kind="error">โหลดข้อมูลไม่สำเร็จ: {error}</StateMessage>}
        {data && (
          <DevGuard developers={data.developers}>
            {(developer) => (
              <SubmitForm
                developer={developer}
                categories={data.categories}
                apps={data.apps}
                site={site}
              />
            )}
          </DevGuard>
        )}
      </section>
    </Layout>
  );
}

function SubmitForm({ developer, categories, apps, site }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(false);
  const [errors, setErrors] = useState({});
  const [draft, setDraft] = useState(null);
  const [copied, setCopied] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function onNameChange(value) {
    setForm((f) => ({ ...f, name: value, slug: slugTouched ? f.slug : slugify(value) }));
  }

  function toggleInArray(field, value) {
    setForm((f) => {
      const has = f[field].includes(value);
      return { ...f, [field]: has ? f[field].filter((v) => v !== value) : [...f[field], value] };
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    const existingSlugs = apps.map((a) => a.slug);
    const { valid, errors: nextErrors } = validateDraftForm(form, {
      existingSlugs,
      licenseOptions: site.license_options,
    });
    setErrors(nextErrors);
    if (!valid) return;

    const appId = nextAppId(apps);
    const built = buildAppDraft(form, { developerId: developer.id, appId });
    addMockSubmission(built);
    setDraft(built);
  }

  function startAnother() {
    setDraft(null);
    setForm(EMPTY_FORM);
    setSlugTouched(false);
    setErrors({});
    setCopied(false);
  }

  function copyJson() {
    navigator.clipboard.writeText(JSON.stringify(draft, null, 2)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (draft) {
    return (
      <div className="submit-success">
        <p className="banner-note banner-note--ok">
          ✅ สร้าง draft สำเร็จ! บันทึกไว้ในเครื่องนี้แล้ว (สถานะ: รอตรวจ)
        </p>
        <p>
          ขั้นตอนต่อไป (จะทำระบบจริงใน Part 10): ระบบจะสร้างไฟล์นี้เป็น{" "}
          <code>data/pending/{draft.id}.json</code> ผ่าน PR อัตโนมัติ ตอนนี้ยังเป็น mock — คัดลอก JSON
          ด้านล่างไปใช้ต่อได้ ดูสถานะการส่งทั้งหมดได้ที่{" "}
          <Link href="/dev/dashboard">Dashboard</Link>
        </p>
        <pre className="json-preview">{JSON.stringify(draft, null, 2)}</pre>
        <div className="form-actions">
          <button type="button" className="btn-primary" onClick={copyJson}>
            {copied ? "คัดลอกแล้ว ✓" : "คัดลอก JSON"}
          </button>
          <button type="button" className="btn-secondary" onClick={startAnother}>
            ส่งแอปอีกรายการ
          </button>
          <Link href="/dev/dashboard" className="btn-secondary">
            ไป Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form className="dev-form" onSubmit={handleSubmit} noValidate>
      <p className="banner-note">
        กำลังส่งในนามนักพัฒนา: <strong>{developer.name}</strong>
      </p>

      <Field label="ชื่อแอป" error={errors.name}>
        <input value={form.name} onChange={(e) => onNameChange(e.target.value)} />
      </Field>

      <Field label="Slug (ใช้ในลิงก์)" error={errors.slug}>
        <input
          className="mono"
          value={form.slug}
          onChange={(e) => {
            setSlugTouched(true);
            update("slug", slugify(e.target.value));
          }}
        />
      </Field>

      <Field label="คำอธิบายสั้น" error={errors.description_short}>
        <input value={form.description_short} onChange={(e) => update("description_short", e.target.value)} />
      </Field>

      <Field label="คำอธิบายเต็ม" error={errors.description_full}>
        <textarea
          rows={4}
          value={form.description_full}
          onChange={(e) => update("description_full", e.target.value)}
        />
      </Field>

      <FieldGroup label="หมวดหมู่" error={errors.category_ids}>
        <div className="checkbox-row">
          {categories.map((c) => (
            <label key={c.id} className="checkbox-chip">
              <input
                type="checkbox"
                checked={form.category_ids.includes(c.id)}
                onChange={() => toggleInArray("category_ids", c.id)}
              />
              {c.icon} {c.name}
            </label>
          ))}
        </div>
      </FieldGroup>

      <Field label="สัญญาอนุญาต (license)" error={errors.license}>
        <select value={form.license} onChange={(e) => update("license", e.target.value)}>
          <option value="">— เลือก —</option>
          {site.license_options.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </Field>

      <Field label="รองรับระบบ (min OS, ไม่บังคับ)">
        <input value={form.min_os} onChange={(e) => update("min_os", e.target.value)} placeholder="เช่น Android 8+" />
      </Field>

      <FieldGroup label="ภาษาที่รองรับ">
        <div className="checkbox-row">
          {(site.supported_languages || ["th", "en"]).map((lang) => (
            <label key={lang} className="checkbox-chip">
              <input
                type="checkbox"
                checked={form.languages.includes(lang)}
                onChange={() => toggleInArray("languages", lang)}
              />
              {lang}
            </label>
          ))}
        </div>
      </FieldGroup>

      <Field label="ฟีเจอร์เด่น (คั่นด้วยจุลภาค, ไม่บังคับ)">
        <input
          value={form.features}
          onChange={(e) => update("features", e.target.value)}
          placeholder="เช่น Offline, Open Source, No Ads"
        />
      </Field>

      <FieldGroup label="วิธีติดตั้งที่ส่ง">
        <div className="checkbox-row">
          {site.install_method_types.map((type) => (
            <button
              key={type}
              type="button"
              className={`sort-btn${form.install_type === type ? " sort-btn--active" : ""}`}
              onClick={() => update("install_type", type)}
            >
              {{ apk: "APK", github: "GitHub", pwa: "PWA / Web" }[type]}
            </button>
          ))}
        </div>
      </FieldGroup>

      {form.install_type === "apk" && (
        <>
          <Field label="ลิงก์ไฟล์ APK" error={errors.install_url}>
            <input value={form.install_url} onChange={(e) => update("install_url", e.target.value)} placeholder="https://github.com/.../releases/download/..." />
          </Field>
          <Field label="เวอร์ชันปัจจุบัน" error={errors.current_version}>
            <input
              className="mono"
              value={form.current_version}
              onChange={(e) => update("current_version", e.target.value)}
              placeholder="1.0.0"
            />
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
      )}

      {form.install_type === "github" && (
        <Field label="ลิงก์ GitHub repository" error={errors.install_url}>
          <input value={form.install_url} onChange={(e) => update("install_url", e.target.value)} placeholder="https://github.com/username/repo" />
        </Field>
      )}

      {form.install_type === "pwa" && (
        <Field label="ลิงก์เว็บแอป" error={errors.install_url}>
          <input value={form.install_url} onChange={(e) => update("install_url", e.target.value)} placeholder="https://example.com/app" />
        </Field>
      )}

      <p className="section__hint">
        ไอคอน/ภาพหน้าจอยังไม่รองรับการอัปโหลดในตอนนี้ — เพิ่มทีหลังผ่าน PR ได้ (ดูโครงสร้างไฟล์ในสเปก)
      </p>

      <div className="form-actions">
        <button type="submit" className="btn-primary">
          ส่งแอปนี้เข้าคิวตรวจ
        </button>
        <Link href="/">ยกเลิก</Link>
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

// เหมือน Field แต่ใช้ <div> แทน <label> — สำหรับกลุ่มที่มี checkbox/ปุ่มหลายตัวข้างใน
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
