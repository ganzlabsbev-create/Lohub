// ตัวช่วยสำหรับฟอร์มส่งแอปใหม่ — สร้าง slug, validate, และประกอบ JSON ให้ตรง schema data/apps/{app_id}.json

export function slugify(text) {
  const s = (text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "app";
}

// สร้าง app_id ถัดไปแบบง่าย (นับจากจำนวนแอปที่มีอยู่) — ของจริงต้องให้ backend/PR merge เป็นคนกำหนดกันชนกัน (Part 10)
export function nextAppId(existingApps) {
  const n = (existingApps?.length || 0) + 1;
  return `app_${String(n).padStart(4, "0")}`;
}

// ตรวจลิงก์เว็บเพิ่มเติม (นอกเหนือจากวิธีติดตั้งหลัก) — แต่ละแถวต้องมีทั้งชื่อและ URL ที่ถูกต้อง
// แถวที่ว่างทั้งชื่อและ URL จะถูกข้าม ไม่ถือเป็น error (เผื่อผู้ใช้กด + แล้วเปลี่ยนใจไม่กรอก)
export function validateExtraLinks(extraLinks) {
  if (!extraLinks || extraLinks.length === 0) return null;
  const rowErrors = {};
  let hasError = false;
  extraLinks.forEach((link, i) => {
    const name = (link.name || "").trim();
    const url = (link.url || "").trim();
    if (!name && !url) return;
    const rowError = {};
    if (!name) {
      rowError.name = "กรอกชื่อลิงก์";
    }
    if (!url || !/^https?:\/\/.+/.test(url)) {
      rowError.url = "กรอก URL ให้ถูกรูปแบบ (ต้องขึ้นต้นด้วย http:// หรือ https://)";
    }
    if (Object.keys(rowError).length > 0) {
      rowErrors[i] = rowError;
      hasError = true;
    }
  });
  return hasError ? rowErrors : null;
}

// แปลงลิงก์เว็บเพิ่มเติมที่กรอกครบ (ชื่อ+URL) ให้เป็น install_methods เพิ่มเติม (ไม่ใช่ primary)
export function buildExtraInstallMethods(extraLinks) {
  if (!extraLinks || extraLinks.length === 0) return [];
  return extraLinks
    .filter((link) => (link.name || "").trim() && (link.url || "").trim())
    .map((link) => ({
      type: "pwa",
      label: link.name.trim(),
      url: link.url.trim(),
      primary: false,
    }));
}

export function validateDraftForm(form, { existingSlugs = [], licenseOptions = [] } = {}) {
  const errors = {};

  if (!form.name || form.name.trim().length < 2) {
    errors.name = "กรอกชื่อแอปอย่างน้อย 2 ตัวอักษร";
  }
  if (!form.slug || form.slug.trim().length < 2) {
    errors.slug = "slug ต้องมีอย่างน้อย 2 ตัวอักษร";
  } else if (existingSlugs.includes(form.slug)) {
    errors.slug = "slug นี้ถูกใช้ไปแล้ว ลองเปลี่ยนชื่อหรือแก้ slug เอง";
  }
  if (!form.description_short || form.description_short.trim().length < 5) {
    errors.description_short = "กรอกคำอธิบายสั้นอย่างน้อย 5 ตัวอักษร";
  }
  if (!form.description_full || form.description_full.trim().length < 10) {
    errors.description_full = "กรอกคำอธิบายเต็มอย่างน้อย 10 ตัวอักษร";
  }
  if (!form.category_ids || form.category_ids.length === 0) {
    errors.category_ids = "เลือกอย่างน้อย 1 หมวดหมู่";
  }
  if (!form.license || !licenseOptions.includes(form.license)) {
    errors.license = "เลือกสัญญาอนุญาตจากตัวเลือกที่กำหนด";
  }
  if (!form.install_url || !/^https?:\/\/.+/.test(form.install_url.trim())) {
    errors.install_url = "กรอก URL ให้ถูกรูปแบบ (ต้องขึ้นต้นด้วย http:// หรือ https://)";
  }
  if (form.install_type === "apk") {
    if (!form.size_mb || Number(form.size_mb) <= 0) {
      errors.size_mb = "กรอกขนาดไฟล์ (MB) มากกว่า 0";
    }
    if (!form.current_version || !/^\d+\.\d+\.\d+$/.test(form.current_version.trim())) {
      errors.current_version = "รูปแบบเวอร์ชันต้องเป็น major.minor.patch เช่น 1.0.0";
    }
  }

  const extraLinksErrors = validateExtraLinks(form.extra_links);
  if (extraLinksErrors) {
    errors.extra_links = extraLinksErrors;
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

// ประกอบ object ให้ตรง schema data/apps/{app_id}.json (ใช้เป็น pending draft — Part 10 ค่อยต่อ PR จริง)
export function buildAppDraft(form, { developerId, appId }) {
  const now = new Date().toISOString();
  const installLabel = { apk: "Download APK", github: "GitHub", pwa: "Open Web App" }[form.install_type];

  const installMethod = {
    type: form.install_type,
    label: installLabel,
    url: form.install_url.trim(),
    primary: true,
  };

  return {
    schema_version: "1.0",
    id: appId,
    name: form.name.trim(),
    slug: form.slug.trim(),
    developer_id: developerId,
    category_ids: form.category_ids,
    description_short: form.description_short.trim(),
    description_full: form.description_full.trim(),
    icon: { type: "local", path: `/assets/icons/${appId}.png` },
    screenshots: [],
    install_methods: [installMethod, ...buildExtraInstallMethods(form.extra_links)],
    current_version: form.install_type === "apk" ? form.current_version.trim() : "1.0.0",
    version_history: [
      {
        version: form.install_type === "apk" ? form.current_version.trim() : "1.0.0",
        apk_url: form.install_type === "apk" ? form.install_url.trim() : null,
        sha256: null,
        date: now,
        note: "ส่งครั้งแรก",
      },
    ],
    size_mb: form.install_type === "apk" ? Number(form.size_mb) : 0,
    min_os: form.min_os.trim(),
    license: form.license,
    features: form.features
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean),
    languages: form.languages,
    verified: false,
    status: "pending",
    download_count: 0,
    created_at: now,
    updated_at: now,
  };
}

// ---------- Part 7: อัปเวอร์ชันใหม่ / แก้ไขแอปที่ส่งไปแล้ว ----------

export function validateVersionForm(form, { requireFile = false } = {}) {
  const errors = {};

  if (!form.version || !/^\d+\.\d+\.\d+$/.test(form.version.trim())) {
    errors.version = "รูปแบบเวอร์ชันต้องเป็น major.minor.patch เช่น 1.3.0";
  }
  if (!form.note || form.note.trim().length < 3) {
    errors.note = "กรอกโน้ตเวอร์ชันนี้อย่างน้อย 3 ตัวอักษร (เช่น มีอะไรเปลี่ยนแปลง)";
  }
  if (requireFile) {
    if (!form.apk_url || !/^https?:\/\/.+/.test(form.apk_url.trim())) {
      errors.apk_url = "กรอก URL ให้ถูกรูปแบบ (ต้องขึ้นต้นด้วย http:// หรือ https://)";
    }
    if (!form.size_mb || Number(form.size_mb) <= 0) {
      errors.size_mb = "กรอกขนาดไฟล์ (MB) มากกว่า 0";
    }
  } else if (form.apk_url && !/^https?:\/\/.+/.test(form.apk_url.trim())) {
    errors.apk_url = "กรอก URL ให้ถูกรูปแบบ (ต้องขึ้นต้นด้วย http:// หรือ https://)";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

// ประกอบแอปเวอร์ชันใหม่จาก app เดิม (ตรง schema เป๊ะ) — ใช้ทั้งกับแอปที่ผ่านแล้ว (เพิ่มเข้า version_history)
// และ draft ที่ยัง pending (replaceLatest: true เพราะยังไม่ผ่าน admin เลยแก้ทับรายการเดียวแทนสะสมประวัติ)
export function buildVersionUpdate(app, form, { replaceLatest = false } = {}) {
  const now = new Date().toISOString();
  const version = form.version.trim();
  const primaryMethod = app.install_methods.find((m) => m.primary) || app.install_methods[0];
  const isApk = primaryMethod?.type === "apk";
  const newUrl = form.apk_url ? form.apk_url.trim() : primaryMethod?.url || null;

  const entry = {
    version,
    apk_url: isApk ? newUrl : form.apk_url ? newUrl : null,
    sha256: null,
    date: now,
    note: form.note.trim(),
  };

  const restHistory = replaceLatest ? app.version_history.slice(1) : app.version_history;
  const installMethods = app.install_methods.map((m) =>
    m === primaryMethod && form.apk_url ? { ...m, url: newUrl } : m
  );

  return {
    ...app,
    current_version: version,
    version_history: [entry, ...restHistory],
    install_methods: installMethods,
    size_mb: isApk && form.size_mb ? Number(form.size_mb) : app.size_mb,
    updated_at: now,
  };
}
