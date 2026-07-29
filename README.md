# Mini App Store

เว็บ "ศูนย์รวมแอป" ขนาดเล็ก — เป็น "ทางเข้า" ให้ผู้ใช้ไปติดตั้งแอปได้หลายช่องทาง (APK / GitHub / PWA) ไม่ใช่ที่เก็บแอปเอง

เริ่มต้นแบบฟรี ไม่ใช้ฐานข้อมูล เก็บข้อมูลเป็นไฟล์ JSON ใน `data/` โดยมี GitHub PR เป็น approval queue และ GitHub Actions รัน Builder script เพื่อรวมข้อมูลเป็น `public/search-index.json` ให้เว็บโหลดจุดเดียว

ดูรายละเอียดสเปกเต็มได้ที่ `app-store-spec.md` (ไฟล์สเปกต้นทาง) และสถานะงานปัจจุบันที่ `PROGRESS.md`

## โครงสร้างโปรเจกต์

```
data/
  apps/          # 1 ไฟล์ต่อ 1 แอป (published)
  pending/       # แอปที่รอ Admin ตรวจ
  rejected/      # แอปที่ถูกปฏิเสธ
  developers/    # ข้อมูลนักพัฒนา
  categories/    # หมวดหมู่แอป
  settings/      # ค่าตั้งค่าเว็บ (site-level)
  manifest.json  # สรุปจำนวนรวม

public/
  assets/            # ไฟล์รูปภาพ (icon/screenshot/banner) — ที่เก็บเดียว ดูหมายเหตุด้านล่าง
    icons/ banners/ screenshots/
  search-index.json  # ไฟล์รวม generated จาก Builder (Part 2)

scripts/
  builder/       # Builder script (Part 2)

pages/           # โค้ดหน้าเว็บ User / Developer / Admin (Part 3+)
```

> **หมายเหตุ (แก้ไขหลัง Part 8):** สเปกต้นฉบับให้ `assets/` อยู่ level เดียวกับ `public/` แยกกัน แล้วใช้ symlink
> `public/assets -> ../assets` เชื่อมสองที่ (ดู Part 3) แต่ symlink พึ่งพา git โดยตรงเก็บได้ถูกต้อง —
> ถ้า push ผ่านวิธีอื่น (เช่น upload zip/ลากไฟล์ผ่านเว็บ GitHub บนมือถือ) symlink มักเสียหรือหายไป ทำให้รูปขึ้นเว็บไม่ได้
> เลยรวมเหลือที่เดียวคือ `public/assets/` ตรงๆ ไม่มี symlink อีกต่อไป (ปลอดภัยกว่าเวลาไม่ได้ push ด้วย `git` จากคอมที่มีเน็ต)

## สถานะปัจจุบัน (Part 3)
- ✅ ตั้งโครงสร้าง repository ตามสเปก
- ✅ Schema JSON ตายตัวสำหรับ apps / categories / developers / manifest
- ✅ Mock data: แอปตัวอย่าง 5 แอป, นักพัฒนา 2 คน, หมวดหมู่ 3 หมวด
- ✅ Builder script (`scripts/builder/build.js`) — รวมข้อมูลเป็น `public/search-index.json` + อัปเดต `data/manifest.json` + คำนวณ sha256 ของ apk ให้อัตโนมัติ
- ✅ หน้า User (บางส่วน): หน้าแรก + หน้ารายการแอปตามหมวด — Next.js (Pages Router)
- ⬜ หน้าค้นหา + หน้ารายละเอียดแอป — Part 4
- ⬜ หน้าโปรไฟล์นักพัฒนา — Part 5

## รันเว็บ (ต้องมีเน็ตสำหรับ npm install)
```bash
npm install
npm run dev      # http://localhost:3000
```

รัน Builder ด้วย:
```bash
node scripts/builder/build.js
```
ดูรายละเอียดเพิ่มเติมใน `scripts/builder/README.md` และ `PROGRESS.md`

## Deploy จริง (Part 10)

**1) GitHub Actions (auto-build):**
ทำงานอัตโนมัติแล้ว (`.github/workflows/build-index.yml`) — ทุกครั้งที่ merge PR เข้า `main` แล้วมีไฟล์ใน
`data/apps|categories|developers` เปลี่ยน จะรัน Builder แล้ว commit `public/search-index.json` +
`data/manifest.json` กลับเข้า `main` ให้เอง ไม่ต้องตั้งค่าเพิ่ม (ใช้สิทธิ์ `GITHUB_TOKEN` มาตรฐานของ repo)

**2) GitHub OAuth App (login จริงของ Developer/Admin):**
สร้างที่ `github.com/settings/developers` → New OAuth App
- Homepage URL = URL เว็บจริง (เช่น `https://your-app.vercel.app`)
- Authorization callback URL = `{URL เว็บจริง}/api/auth/callback/github`
- คัดลอก Client ID/Secret ไปตั้งเป็น `GITHUB_ID`/`GITHUB_SECRET` (ดู `.env.local.example`)

**3) ตัวแปรที่ต้องตั้งบน Vercel** (Project Settings → Environment Variables):
| ตัวแปร | ค่า |
|---|---|
| `GITHUB_ID` / `GITHUB_SECRET` | จาก OAuth App ข้อ 2 |
| `NEXTAUTH_SECRET` | สร้างด้วย `openssl rand -base64 32` |
| `NEXTAUTH_URL` | URL เว็บจริงบน Vercel |

**4) กำหนดว่าใครเป็น Admin:** แก้ `admin_github_usernames` ใน `data/settings/site.json` ให้เป็น GitHub
username จริง (ต้องผ่าน PR เหมือนข้อมูลอื่นๆ) ส่วนสิทธิ์ Developer อิงจาก field `github_username` ที่มีอยู่แล้ว
ในไฟล์ `data/developers/{id}.json` — ใครยังไม่มีโปรไฟล์นักพัฒนาจะเข้าหน้า `/dev/*` ไม่ได้จนกว่า Admin จะสร้างให้

