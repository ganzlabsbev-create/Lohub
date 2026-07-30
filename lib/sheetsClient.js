// เรียก Google Apps Script Web App API — ใช้ได้เฉพาะฝั่ง server (pages/api/**) เท่านั้น
// ห้าม import ไฟล์นี้จาก component ฝั่ง client เด็ดขาด เพราะ GAS_API_SECRET ต้องไม่หลุดไปที่ browser

const GAS_URL = process.env.GAS_WEB_APP_URL;
const GAS_SECRET = process.env.GAS_API_SECRET;

function assertConfigured() {
  if (!GAS_URL || !GAS_SECRET) {
    throw new Error(
      "ยังไม่ได้ตั้งค่า GAS_WEB_APP_URL / GAS_API_SECRET ใน Environment Variables"
    );
  }
}

// เรียก action แบบอ่านข้อมูล (doGet ฝั่ง Apps Script)
export async function gasGet(action, params = {}) {
  assertConfigured();
  const url = new URL(GAS_URL);
  url.searchParams.set("action", action);
  url.searchParams.set("token", GAS_SECRET);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString());
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "Google Sheets API error (GET)");
  return data.data;
}

// เรียก action แบบเขียนข้อมูล (doPost ฝั่ง Apps Script)
export async function gasPost(action, payload = {}) {
  assertConfigured();
  const res = await fetch(GAS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: GAS_SECRET, action, ...payload }),
    redirect: "follow", // Apps Script web app มักตอบ 302 ก่อนถึงปลายทางจริง
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "Google Sheets API error (POST)");
  return data.data;
}
