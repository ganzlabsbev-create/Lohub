# Builder Script

สคริปต์ที่รวม `data/apps/*.json` + `data/categories/*.json` + `data/developers/*.json`
เข้าเป็นไฟล์เดียว `public/search-index.json` (ให้เว็บโหลดจุดเดียว แทนการ fetch ทีละไฟล์)
พร้อมอัปเดต `data/manifest.json` ให้ตรงกับจำนวนไฟล์จริง

## วิธีรัน (ด้วยมือ)

ต้องมี Node.js 18 ขึ้นไป (ใช้ `fetch` และ `crypto` ที่มีติดตัว ไม่ต้อง `npm install` เพิ่ม)

```bash
# รันจาก root ของ repo
node scripts/builder/build.js

# ข้ามการคำนวณ sha256 ของ apk (เร็วกว่า เหมาะกับตอนไม่มีเน็ต/ทดสอบ)
node scripts/builder/build.js --no-hash
```

## Builder ทำอะไรบ้าง

1. อ่านทุกไฟล์ใน `data/apps/`, `data/categories/`, `data/developers/`
2. ตรวจสอบข้อมูลเบื้องต้น (ฟิลด์จำเป็นครบไหม, `id` ตรงกับชื่อไฟล์ไหม, `install_methods` มีอย่างน้อย 1 ช่องทาง) — ถ้าพบปัญหา **หยุด build ทันที** (exit code 1) ไม่เขียนไฟล์ทับ เพื่อกันข้อมูลพังไปถึง production
3. คำนวณ `sha256` ให้กับไฟล์ apk ใน `version_history` ที่ยังเป็น `null` อยู่ โดยดาวน์โหลดจาก `apk_url` แล้ว hash — ถ้าดาวน์โหลดไม่ได้ (เน็ตหลุด/ลิงก์เสีย) จะแค่เตือนแล้วปล่อย `null` ไว้เหมือนเดิม ไม่ทำให้ build ล้มเหลวทั้งหมด
4. เขียนไฟล์ `data/apps/*.json` กลับ (เผื่อมีการเติม sha256 ใหม่ ให้ source of truth ตรงกับ search-index เสมอ)
5. รวมข้อมูลเป็น `public/search-index.json` — เอาเฉพาะแอปที่ `status === "published"`, เติม `developer_name` และ `category_names` ให้แต่ละแอปด้วย (กันหน้าเว็บต้อง fetch ไฟล์ developer/category แยกอีกรอบ)
6. อัปเดต `data/manifest.json` (`app_count`, `category_count`, `developer_count`, `generated_at`)

## จะรันอัตโนมัติเมื่อไหร่

ตอนนี้ (Part 2) รันด้วยมือก่อน — จะต่อ GitHub Actions ให้รันอัตโนมัติตอน merge PR เข้า `main` ใน **Part 10**
