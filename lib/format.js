// ตัวช่วย format ตัวเลข/วันที่ — ใช้ร่วมหลายหน้า

export function formatDate(isoString) {
  if (!isoString) return "-";
  try {
    return new Date(isoString).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return isoString;
  }
}

export function formatSize(sizeMb) {
  if (!sizeMb || sizeMb <= 0) return "เว็บแอป (ไม่มีไฟล์ติดตั้ง)";
  if (sizeMb < 1) return `${Math.round(sizeMb * 1024)} KB`;
  return `${sizeMb} MB`;
}
