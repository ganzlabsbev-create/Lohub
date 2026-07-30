import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import AdminNav from "../../components/AdminNav";
import AdminGuard from "../../components/AdminGuard";
import StateMessage from "../../components/StateMessage";
import { useSearchIndex } from "../../lib/useSearchIndex";
import { getSiteSettings } from "../../lib/site";
import { slugify } from "../../lib/appDraft";
import {
  getEffectiveCategories,
  updateMockCategory,
  addMockCategory,
  removeMockNewCategory,
  nextMockCategoryId,
} from "../../lib/mockAdmin";

export async function getStaticProps() {
  return { props: { site: getSiteSettings() } };
}

// Part 10: หน้านี้จำกัดเฉพาะบัญชีที่อยู่ใน admin_github_usernames (ดู AdminGuard)
export default function AdminCategoriesPage({ site }) {
  const { loading, error, data } = useSearchIndex();
  const [list, setList] = useState(null);

  useEffect(() => {
    if (data) setList(getEffectiveCategories(data.categories));
  }, [data]);

  function refresh() {
    if (data) setList(getEffectiveCategories(data.categories));
  }

  return (
    <Layout site={site}>
      <AdminGuard site={site}>
        <section className="section dev-narrow">
          <AdminNav active="categories" />
          <div className="section__head">
            <h1>จัดการหมวดหมู่</h1>
          </div>
          <p className="banner-note">
            หน้านี้ยังเป็นโหมดทดสอบในเครื่องนี้เท่านั้น (เขียนทับ <code>data/categories/*.json</code> จริงไม่ได้ —
            รอ Part 10 ต่อเป็น PR) ใช้ปุ่ม ▲▼ เพื่อสลับลำดับ (<code>order</code>) กับหมวดที่อยู่ติดกัน
          </p>

          {loading && <StateMessage kind="loading">กำลังโหลดข้อมูล...</StateMessage>}
          {error && <StateMessage kind="error">โหลดข้อมูลไม่สำเร็จ: {error}</StateMessage>}

          {data && list && (
            <CategoryManager
              list={list}
              baseCategories={data.categories}
              apps={data.apps}
              onChanged={refresh}
            />
          )}
        </section>
      </AdminGuard>
    </Layout>
  );
}

function CategoryManager({ list, baseCategories, apps, onChanged }) {
  function move(index, dir) {
    const target = index + dir;
    if (target < 0 || target >= list.length) return;
    const a = list[index];
    const b = list[target];
    updateMockCategory(a.id, { order: b.order }, a.__isNew);
    updateMockCategory(b.id, { order: a.order }, b.__isNew);
    onChanged();
  }

  return (
    <>
      <ul className="cat-list">
        {list.map((cat, i) => (
          <CategoryRow
            key={cat.id}
            category={cat}
            appCount={apps.filter((a) => a.category_ids?.includes(cat.id)).length}
            onMoveUp={() => move(i, -1)}
            onMoveDown={() => move(i, 1)}
            isFirst={i === 0}
            isLast={i === list.length - 1}
            onSaved={onChanged}
          />
        ))}
      </ul>

      <AddCategoryForm baseCategories={baseCategories} existingList={list} onAdded={onChanged} />
    </>
  );
}

function CategoryRow({ category, appCount, onMoveUp, onMoveDown, isFirst, isLast, onSaved }) {
  const [form, setForm] = useState({ name: category.name, icon: category.icon, color: category.color });
  const dirty =
    form.name !== category.name || form.icon !== category.icon || form.color !== category.color;

  function save() {
    if (!form.name.trim()) return;
    updateMockCategory(
      category.id,
      { name: form.name.trim(), icon: form.icon.trim() || "📦", color: form.color },
      category.__isNew
    );
    onSaved();
  }

  function remove() {
    if (!window.confirm(`ลบหมวด "${category.name}" ที่เพิ่งสร้างในเครื่องนี้?`)) return;
    removeMockNewCategory(category.id);
    onSaved();
  }

  return (
    <li className="cat-row">
      <div className="cat-row__order">
        <button type="button" className="order-btn" onClick={onMoveUp} disabled={isFirst} aria-label="เลื่อนขึ้น">
          ▲
        </button>
        <button type="button" className="order-btn" onClick={onMoveDown} disabled={isLast} aria-label="เลื่อนลง">
          ▼
        </button>
      </div>

      <span className="cat-row__swatch" style={{ background: form.color }} aria-hidden="true">
        {form.icon}
      </span>

      <div className="cat-row__fields">
        <input
          className="cat-row__name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
        <p className="cat-row__meta mono">
          {category.id} · {category.slug} · {appCount} แอป
          {category.__isNew && " · สร้างใหม่ในเครื่องนี้"}
        </p>
      </div>

      <input
        className="cat-row__icon"
        value={form.icon}
        onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
        maxLength={4}
        aria-label="ไอคอน (emoji)"
      />
      <input
        type="color"
        className="cat-row__color"
        value={form.color}
        onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
        aria-label="สี"
      />

      <div className="cat-row__actions">
        {dirty && (
          <button type="button" className="btn-primary btn-small" onClick={save}>
            บันทึก
          </button>
        )}
        {category.__isNew && (
          <button type="button" className="btn-danger btn-small" onClick={remove}>
            ลบ
          </button>
        )}
      </div>
    </li>
  );
}

function AddCategoryForm({ baseCategories, existingList, onAdded }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [icon, setIcon] = useState("📦");
  const [color, setColor] = useState("#4A90D9");
  const [error, setError] = useState("");

  function submit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    const finalSlug = slugify(slug.trim() || trimmed);

    if (trimmed.length < 2) {
      setError("กรอกชื่อหมวดหมู่อย่างน้อย 2 ตัวอักษร");
      return;
    }
    if (existingList.some((c) => c.slug === finalSlug)) {
      setError("slug นี้ถูกใช้ไปแล้ว ลองเปลี่ยนชื่อหรือแก้ slug เอง");
      return;
    }

    addMockCategory({
      schema_version: "1.0",
      id: nextMockCategoryId(baseCategories),
      name: trimmed,
      slug: finalSlug,
      icon: icon.trim() || "📦",
      color,
      order: existingList.length + 1,
    });

    setName("");
    setSlug("");
    setIcon("📦");
    setColor("#4A90D9");
    setError("");
    setOpen(false);
    onAdded();
  }

  if (!open) {
    return (
      <button type="button" className="btn-secondary" onClick={() => setOpen(true)}>
        ➕ เพิ่มหมวดหมู่ใหม่
      </button>
    );
  }

  return (
    <form className="dev-form cat-add-form" onSubmit={submit}>
      <Field label="ชื่อหมวดหมู่" error={error}>
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Slug (ไม่บังคับ เว้นว่างจะสร้างจากชื่อ)">
        <input
          className="mono"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder={slugify(name) || "auto-from-name"}
        />
      </Field>
      <div className="cat-add-form__row">
        <Field label="ไอคอน (emoji)">
          <input value={icon} onChange={(e) => setIcon(e.target.value)} maxLength={4} />
        </Field>
        <Field label="สี">
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
        </Field>
      </div>
      <div className="form-actions">
        <button type="submit" className="btn-primary">
          บันทึกหมวดหมู่ใหม่
        </button>
        <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
          ยกเลิก
        </button>
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
