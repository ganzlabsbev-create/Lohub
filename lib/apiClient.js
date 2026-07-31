// Helper เรียก pages/api/** ฝั่ง client แบบเดียวกันทุกหน้าใหม่ (รีวิว/รายงาน/บัญชี/แอดมิน)
// รวม error handling ไว้ที่เดียว: ถ้า response ไม่ใช่ 2xx จะ throw Error(message จาก body.error)
// เพื่อให้ทุกฟอร์ม .catch((err) => setError(err.message)) แล้วโชว์ผ่าน field-error ได้แบบเดียวกัน

async function parseJson(res) {
  return res.json().catch(() => ({}));
}

export async function apiGet(url) {
  const res = await fetch(url);
  const data = await parseJson(res);
  if (!res.ok) throw new Error(data.error || `โหลดข้อมูลไม่สำเร็จ (HTTP ${res.status})`);
  return data;
}

export async function apiPost(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  const data = await parseJson(res);
  if (!res.ok) throw new Error(data.error || `ส่งข้อมูลไม่สำเร็จ (HTTP ${res.status})`);
  return data;
}

export async function apiPatch(url, body) {
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  const data = await parseJson(res);
  if (!res.ok) throw new Error(data.error || `อัปเดตไม่สำเร็จ (HTTP ${res.status})`);
  return data;
}

export async function apiDelete(url) {
  const res = await fetch(url, { method: "DELETE" });
  const data = await parseJson(res);
  if (!res.ok) throw new Error(data.error || `ลบไม่สำเร็จ (HTTP ${res.status})`);
  return data;
}
