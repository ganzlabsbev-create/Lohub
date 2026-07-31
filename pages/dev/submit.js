import { useState } from "react";
import Link from "next/link";
import Layout from "../../components/Layout";
import StateMessage from "../../components/StateMessage";
import DevGuard from "../../components/DevGuard";
import { useSearchIndex } from "../../lib/useSearchIndex";
import { getSiteSettings } from "../../lib/site";
import { slugify, validateDraftForm } from "../../lib/appDraft";
import { getEffectiveCategories } from "../../lib/mockAdmin";
import { IconClose } from "../../components/Icons";
import { apiPost } from "../../lib/apiClient";

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
  extra_links: [],
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
                categories={getEffectiveCategories(data.categories)}
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

const MAX_SCREENSHOTS = 8;

// อ่านไฟล์เป็น data URL (base64) ฝั่ง browser — ใช้ส่งไอคอน/ภาพหน้าจอไป /api/dev/submit-app
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`อ่านไฟล์ ${file.name} ไม่สำเร็จ`));
    reader.readAsDataURL(file);
  });
}

function SubmitForm({ developer, categories, apps, site }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(false);
  const [errors, setErrors] = useState({});
  const [iconFile, setIconFile] = useState(null);
  const [screenshotFiles, setScreenshotFiles] = useState([]);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [result, setResult] = useState(null);

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

  function addExtraLink() {
    setForm((f) => ({ ...f, extra_links: [...f.extra_links, { name: "", url: "" }] }));
  }

  function updateExtraLink(index, field, value) {
    setForm((f) => ({
      ...f,
      extra_links: f.extra_links.map((link, i) => (i === index ? { ...link, [field]: value } : link)),
    }));
  }

  function removeExtraLink(index) {
    setForm((f) => ({ ...f, extra_links: f.extra_links.filter((_, i) => i !== index) }));
  }

  function onIconChange(e) {
    const file = e.target.files?.[0] || null;
    setIconFile(file);
    setErrors((er) => ({
      ...er,
      icon: file && file.type !== "image/png" ? "ไฟล์ไอคอนต้องเป็น PNG เท่านั้น" : null,
    }));
  }

  function onScreenshotsChange(e) {
    const files = Array.from(e.target.files || []);
    const nonPng = files.some((f) => f.type !== "image/png");
    setScreenshotFiles(files.slice(0, MAX_SCREENSHOTS));
    setErrors((er) => ({
      ...er,
      screenshots: nonPng
        ? "รับเฉพาะไฟล์ PNG เท่านั้น"
        : files.length > MAX_SCREENSHOTS
        ? `เลือกได้สูงสุด ${MAX_SCREENSHOTS} ภาพ (ใช้ ${MAX_SCREENSHOTS} ภาพแรกที่เลือก)`
        : null,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const existingSlugs = apps.map((a) => a.slug);
    const { valid, errors: nextErrors } = validateDraftForm(form, {
      existingSlugs,
      licenseOptions: site.license_options,
    });
    const iconError = !iconFile
      ? "กรุณาแนบไอคอนแอป (PNG)"
      : iconFile.type !== "image/png"
      ? "ไฟล์ไอคอนต้องเป็น PNG เท่านั้น"
      : null;
    setErrors({ ...nextErrors, icon: iconError });
    if (!valid || iconError) return;

    setSubmitting(true);
    setSubmitError("");
    try {
      const iconBase64 = await fileToDataUrl(iconFile);
      const screenshotsBase64 = await Promise.all(screenshotFiles.map(fileToDataUrl));
      const res = await apiPost("/api/dev/submit-app", {
        form,
        icon: { base64: iconBase64 },
        screenshots: screenshotsBase64.map((base64) => ({ base64 })),
      });
      setResult(res);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function startAnother() {
    setResult(null);
    setForm(EMPTY_FORM);
    setSlugTouched(false);
    setErrors({});
    setIconFile(null);
    setScreenshotFiles([]);
    setFileInputKey((k) => k + 1); // บังคับ remount <input type="file"> เพื่อล้างค่าที่เลือกไว้
    setSubmitError("");
  }

  if (result) {
    return (
      <div className="submit-success">
        <p className="banner-note banner-note--ok">
          ✅ สร้าง Pull Request สำเร็จ! ระบบจะแจ้ง admin ให้ตรวจและ merge ก่อนแอปจะขึ้นเว็บจริง
        </p>
        <p>
          ดูสถานะ PR ได้ที่{" "}
          <a href={result.pr_url} target="_blank" rel="noreferrer">
            {result.pr_url}
          </a>{" "}
          — หลัง admin กด merge ระบบจะกำหนด app_id จริง ย้ายไฟล์เข้า <code>data/apps/</code> และขึ้นเว็บให้
          อัตโนมัติ ดูสถานะการส่งทั้งหมดได้ที่ <Link href="/dev/dashboard">Dashboard</Link>
        </p>
        <div className="form-actions">
          <a href={result.pr_url} target="_blank" rel="noreferrer" className="btn-primary">
            เปิดดู Pull Request
          </a>
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

      <FieldGroup label="ลิงก์เว็บเพิ่มเติม (ไม่บังคับ)">
        <p className="section__hint">
          เผื่อว่านอกจากวิธีติดตั้งด้านบนแล้ว ยังมีเว็บให้ใช้งานก่อนก็ได้ — ใส่ชื่อลิงก์และ URL ได้กี่รายการก็ได้
        </p>
        <div className="link-list">
          {form.extra_links.map((link, i) => (
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

      <Field label="ไอคอนแอป (PNG เท่านั้น)" error={errors.icon}>
        <input
          key={`icon-${fileInputKey}`}
          type="file"
          accept="image/png"
          onChange={onIconChange}
        />
      </Field>
      {iconFile && <p className="section__hint">เลือกแล้ว: {iconFile.name}</p>}

      <Field label={`ภาพหน้าจอ (PNG, ไม่บังคับ, สูงสุด ${MAX_SCREENSHOTS} ภาพ)`} error={errors.screenshots}>
        <input
          key={`screenshots-${fileInputKey}`}
          type="file"
          accept="image/png"
          multiple
          onChange={onScreenshotsChange}
        />
      </Field>
      {screenshotFiles.length > 0 && (
        <p className="section__hint">เลือกแล้ว {screenshotFiles.length} ภาพ: {screenshotFiles.map((f) => f.name).join(", ")}</p>
      )}

      {submitError && <p className="field-error">{submitError}</p>}

      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "กำลังส่ง..." : "ส่งแอปนี้เข้าคิวตรวจ"}
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
