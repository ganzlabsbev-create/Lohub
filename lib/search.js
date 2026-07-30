// ค้นหาแอปจากข้อมูลที่โหลดมาแล้ว (search-index.json ฝั่ง client) — ไม่ต้อง fetch เพิ่ม
// ค้นจาก: ชื่อแอป, ชื่อนักพัฒนา, คำอธิบายสั้น, ชื่อหมวดหมู่, features
export function searchApps(apps, query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return apps.filter((app) => {
    const haystack = [
      app.name,
      app.developer_name,
      app.description_short,
      ...(app.category_names || []),
      ...(app.features || []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}
