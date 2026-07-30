// เรียงลำดับรายการแอป — ใช้ร่วมกันหลายหน้า
// หมายเหตุ: download_count ตอนนี้เป็น 0 ทุกแอป (นับจริงไม่ได้จนกว่าจะมี DB)
// เลยเรียง "ยอดนิยม" ด้วย download_count ก่อน แล้ว fallback เป็น verified + ชื่อ กันผลลัพธ์มั่ว
export const SORT_OPTIONS = [
  { value: "popular", label: "ยอดนิยม" },
  { value: "newest", label: "ใหม่ล่าสุด" },
  { value: "name", label: "ชื่อ (ก-ฮ / A-Z)" },
];

export function sortApps(apps, sortBy) {
  const list = [...apps];
  switch (sortBy) {
    case "newest":
      return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    case "name":
      return list.sort((a, b) => a.name.localeCompare(b.name, "th"));
    case "popular":
    default:
      return list.sort((a, b) => {
        if (b.download_count !== a.download_count) return b.download_count - a.download_count;
        if (a.verified !== b.verified) return a.verified ? -1 : 1;
        return a.name.localeCompare(b.name, "th");
      });
  }
}
