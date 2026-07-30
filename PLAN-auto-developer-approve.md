# แผน: อนุมัติ Developer แล้วสร้างไฟล์ + PR อัตโนมัติ

สถานะ: **เขียนโค้ดฝั่งเว็บ (Next.js) เสร็จแล้ว** — เหลือแค่ทดสอบจริงตอน deploy (sandbox นี้เรียก GitHub API จริงไม่ได้)
ดูหัวข้อ "สิ่งที่ทำไปแล้ว" ท้ายไฟล์นี้สำหรับสิ่งที่เสร็จแล้ว และ "ที่ต้องทำต่อ/ทดสอบ" สำหรับสิ่งที่เหลือ

## เป้าหมาย
ตอนแอดมินกด "อนุมัติ" คำขอเป็น Developer ที่ `/admin/developer-requests` ให้ระบบ:
1. สร้างไฟล์ `data/developers/{id}.json` ให้อัตโนมัติ (ไม่ต้องพิมพ์/อัปโหลดเองผ่าน GitHub)
2. เปิด Pull Request ให้อัตโนมัติ (**ไม่ commit เข้า main ตรงๆ** — ตามที่ตัดสินใจไว้แล้ว ให้มีจุดตรวจสอบก่อนขึ้นจริง)
3. หน้าแอดมินโชว์ลิงก์ PR ให้กด merge เอง
4. Merge แล้ว GitHub Action เดิม (`.github/workflows/build-index.yml`) รันเองอัตโนมัติ → เว็บอัปเดต

## การตัดสินใจที่ยืนยันแล้ว (ไม่ต้องถามซ้ำ)
- **สร้าง PR** ไม่ commit ตรง (ปลอดภัยกว่า มีจุดตรวจสอบ)
- **verified: true ทันที** ตอนอนุมัติ (อนุมัติ = ยืนยันตัวตนแล้วในตัว ไม่ต้องมีขั้นตอนแยก)
- GitHub token (fine-grained, scope: Contents = Read&write, Pull requests = Read&write) **สร้างและตั้งใน Vercel แล้ว** — ชื่อ env var ที่ตั้งไว้: `GITHUB_COMMIT_TOKEN` (เช็คให้ตรงกับที่ตั้งจริงตอนเริ่มทำ อาจต้องถามชื่อ repo/branch ด้วยถ้ายังไม่ได้ตั้ง `GITHUB_REPO`)

## Flow ที่จะสร้าง
1. `POST /api/admin/developer-requests` (status = "approved") หลังจากเรียก `gasPost("admin_developer_request_status", ...)` เดิมสำเร็จ (role ใน Sheet เปลี่ยนเป็น developer แล้ว) ให้เรียกฟังก์ชันใหม่ `createDeveloperProfilePR(request)` ต่อ
2. `createDeveloperProfilePR`:
   - หา id ถัดไปแบบไม่ชนกัน (`dev_000N`) — อ่านรายชื่อไฟล์ใน `data/developers/` ผ่าน GitHub Contents API (list directory) ของ branch `main` เอานับ N ต่อจากจำนวนไฟล์ปัจจุบัน (ระวัง race condition ถ้ามีคนอนุมัติพร้อมกัน — เบื้องต้นรับความเสี่ยงนี้ไว้ก่อนเพราะ frequency ต่ำ ถ้าจะกันแน่นกว่านี้ค่อยทำ retry/lock ทีหลัง)
   - ประกอบ JSON ตาม schema เดิม (`schema_version`, `id`, `name`, `github_username`, `website`, `avatar`, `contact`, `verified: true`, `status: "active"`, `joined_at: now`)
     - `name` / `website` / `contact` มาจากฟิลด์ที่ผู้ใช้กรอกตอนสมัครอัพเกรด (ต้องขยายฟอร์ม/ payload ของ `submit_developer_request` ให้เก็บฟิลด์พวกนี้ด้วย — ตอนนี้ฟอร์มมีแค่ reason/portfolio_url)
     - `avatar` ใช้ `session.user.image` (avatar จาก GitHub) แทนการอัปโหลดเอง
   - สร้าง branch ใหม่จาก `main` (ชื่อ เช่น `add-developer-{username}-{timestamp}`)
   - Commit ไฟล์ใหม่ลง branch นั้นผ่าน GitHub Contents API (`PUT /repos/{owner}/{repo}/contents/{path}`)
   - เปิด PR จาก branch นั้น → `main` ผ่าน GitHub API (`POST /repos/{owner}/{repo}/pulls`)
   - คืนค่า PR URL กลับไปเก็บไว้กับ request (อาจต้องเพิ่ม action ใหม่ฝั่ง GAS เพื่อบันทึก PR URL ไว้กับ request row เผื่อดูย้อนหลัง หรือจะโชว์แค่ตอน approve เสร็จทันทีก็พอสำหรับตอนนี้)
3. หน้า `/admin/developer-requests` โชว์ลิงก์ "ดู PR ที่สร้างให้" หลัง approve สำเร็จ

## ไฟล์ที่ต้องแก้/สร้างตอนลงมือจริง
- `lib/githubCommit.js` (ใหม่) — รวมฟังก์ชัน: `listDirFiles`, `createBranch`, `commitFile`, `openPullRequest` (เรียก GitHub REST API ด้วย `fetch` + header `Authorization: Bearer ${GITHUB_COMMIT_TOKEN}`) — import เฉพาะฝั่ง server (`pages/api/**`) เท่านั้น เหมือนแพทเทิร์นของ `lib/sheetsClient.js`
- `pages/api/admin/developer-requests.js` — เรียก `createDeveloperProfilePR` ต่อจาก approve, ดักเคส error แยกจาก error ของ GAS (ถ้า GAS สำเร็จแต่ GitHub ล้มเหลว ต้องบอกแอดมินตรงๆ ว่า role เปลี่ยนแล้วแต่ยังไม่มีไฟล์ ให้ลองกด "สร้างไฟล์อีกครั้ง" ได้ — เผื่อ retry แยกจาก approve เดิม)
- `pages/api/developer-requests.js` + `pages/account/index.js` (`DeveloperRequestPanel`) — ขยายฟอร์มให้กรอก `display_name`, `website`, `contact` เพิ่ม แล้วส่งต่อไปกับ `submit_developer_request` (ต้องเช็คว่า GAS ฝั่ง Apps Script รับ field พวกนี้ไหม ถ้า schema ของ Sheet ยังไม่มีคอลัมน์ ต้องไปเพิ่มใน Apps Script/Sheet ด้วย — งานนี้อยู่นอก repo นี้ ต้องแก้ที่ Google Apps Script โปรเจกต์แยก)
- `.env.local.example` — เพิ่ม `GITHUB_COMMIT_TOKEN`, `GITHUB_REPO` (`owner/repo`), `GITHUB_REPO_BRANCH` (default `main`)
- `pages/admin/developer-requests.js` — โชว์ลิงก์ PR หลัง approve, เอาข้อความเตือน "ต้องเพิ่มไฟล์เอง" ออก

## ความเสี่ยง/ข้อควรระวังที่ต้องคิดตอนลงมือ
- **GAS backend อยู่นอก repo นี้** — การเพิ่มฟิลด์ใหม่ในฟอร์มสมัครอัพเกรด (`display_name`/`website`/`contact`) ต้องไปแก้ Apps Script + Google Sheet ให้รับ/เก็บฟิลด์พวกนี้ด้วย ไม่งั้นข้อมูลจะหายไปเงียบๆ (GAS อาจ ignore field ที่ไม่รู้จัก) — ต้องถามผู้ใช้ว่ามีสิทธิ์แก้ Apps Script นั้นไหม หรือให้ช่วยดูโค้ด Apps Script ก่อน
- **Race condition ตอนคำนวณ `dev_id` ถัดไป** ถ้ามีการอนุมัติ 2 คำขอพร้อมกันในเวลาไล่เลี่ยกัน อาจได้ id ซ้ำกัน (สร้างเป็นคนละ PR แยกกัน merge ไม่ชนกันแต่ id ในไฟล์ซ้ำ) — เสี่ยงต่ำเพราะโปรเจกต์นี้ไม่ได้มีคนอนุมัติพร้อมกันถี่ๆ แต่ควรมี comment เตือนไว้ในโค้ด
- **GitHub token หมดอายุ/สิทธิ์ไม่พอ** — ควร handle error จาก GitHub API แล้วโชว์ข้อความชัดเจนที่หน้าแอดมิน ไม่ใช่แค่ throw 500 เฉยๆ
- **ยังไม่มีปุ่ม "reject → ลบ role กลับ"** ถ้า reject หลัง approve ไปแล้ว (edge case คนละเรื่อง ไม่ต้องทำตอนนี้)

## สิ่งที่ทำไปแล้วในตอนนี้ (ไม่ต้องทำซ้ำ)
- Redesign หน้า `/account` ให้โชว์รายละเอียดมากขึ้น — ใช้ข้อมูลจากแหล่งเดิมทั้งหมด (memberRow, search-index.json)
- **`lib/githubCommit.js`** — สร้างแล้ว ครบทุกฟังก์ชันตามแผน: `nextDeveloperId` (นับไฟล์ใน `data/developers/`),
  `createBranch`/`commitFile`/`openPullRequest` (เรียก GitHub REST API ตรงๆ), `fetchGithubPublicProfile`
  (ดึง name/avatar/website จากโปรไฟล์ GitHub สาธารณะของผู้สมัคร เป็น **fallback** เผื่อฟอร์มไม่ได้กรอกหรือ
  backend ยังไม่ส่งฟิลด์พวกนี้กลับมา) และ `createDeveloperProfilePR` (orchestrator หลัก) — export ใช้จาก
  `pages/api/admin/developer-requests.js` เท่านั้น (ฝั่ง server)
- **`pages/api/admin/developer-requests.js`** — approve สำเร็จแล้วเรียก `createDeveloperProfilePR` ต่อทันที
  ถ้า GitHub ล้มเหลว ตอบ 200 พร้อม `github: { ok: false, error }` (ไม่ทำให้ approve ทั้งก้อนพัง เพราะ role ใน
  sheet เปลี่ยนไปแล้วแยกจากกัน) หน้าแอดมินจะโชว์ข้อความเตือนให้ลองใหม่/เพิ่มไฟล์เอง
- **`pages/api/developer-requests.js`** — ฟอร์มสมัครอัพเกรดส่ง `display_name`/`website`/`contact` เพิ่มได้แล้ว
  (ส่งต่อไปให้ `gasPost("submit_developer_request", …)` — **ยังไม่ยืนยันว่า Apps Script ฝั่งนั้นเก็บฟิลด์พวกนี้จริง
  ดูหัวข้อความเสี่ยงเดิม** ถ้าไม่เก็บ ระบบจะ fallback ไปใช้ข้อมูลจากโปรไฟล์ GitHub สาธารณะแทนอัตโนมัติอยู่แล้ว
  ไม่พัง แค่ชื่อ/เว็บไซต์ที่ได้อาจไม่ตรงกับที่ผู้ใช้ตั้งใจกรอกในฟอร์ม)
- **`pages/account/index.js`** — ฟอร์มสมัครอัพเกรดเพิ่มช่อง ชื่อที่แสดง/เว็บไซต์/ช่องทางติดต่อ (ไม่บังคับ)
  พร้อมข้อความอธิบายว่าเอาไปทำอะไรต่อ
- **`pages/admin/developer-requests.js`** — ส่ง field ครบไปตอนกด "อนุมัติ", โชว์ลิงก์ PR ที่สร้างให้หลัง approve
  สำเร็จ หรือข้อความ error ถ้า GitHub ล้มเหลว, เอาข้อความเตือน "ต้องเพิ่มไฟล์เอง" แบบเดิมออกแล้ว
- **`.env.local.example`** — เพิ่ม `GITHUB_COMMIT_TOKEN` / `GITHUB_REPO` / `GITHUB_REPO_BRANCH`
- ทดสอบ `tsc --noEmit --allowJs --jsx react --moduleResolution bundler` ทุกไฟล์ในโปรเจกต์ผ่านหมด — **ยังไม่ได้
  ทดสอบเรียก GitHub API จริง** (sandbox นี้ไม่มีเน็ต)

## ที่ต้องทำต่อ/ทดสอบ (ทำในเครื่องที่มีเน็ตหรือหลัง deploy จริง)
1. เช็คว่าตั้ง `GITHUB_COMMIT_TOKEN`, `GITHUB_REPO` (`owner/repo`), `GITHUB_REPO_BRANCH` บน Vercel ครบแล้ว
   (ตามที่คุยไว้ว่าสร้าง token ไว้แล้ว — เช็คแค่ชื่อ env var ให้ตรงกับที่ใช้ในโค้ดนี้)
2. ทดสอบ flow เต็ม: member กดสมัครอัพเกรด (ลองทั้งกรอกครบและเว้นว่างฟิลด์เสริม) → แอดมินกด "อนุมัติ" ที่
   `/admin/developer-requests` → เช็คว่าโชว์ลิงก์ PR ขึ้นมาจริง → เปิด PR ดูว่าไฟล์ `data/developers/{id}.json`
   หน้าตาถูกต้อง (โดยเฉพาะกรณีเว้นฟิลด์เสริมว่างไว้ ให้เช็คว่า fallback ไปใช้ข้อมูล GitHub ได้จริง) → กด merge
   → รอ GitHub Action รันแล้วเช็คว่าเว็บขึ้นโปรไฟล์นักพัฒนาใหม่จริง (`/developer/{id}`) และหน้า `/account`
   ของคนที่เพิ่งอนุมัติโชว์การ์ด "โปรไฟล์นักพัฒนาของคุณ" ถูกต้อง
3. ลองเคส token ผิด/หมดสิทธิ์ดูว่าหน้าแอดมินโชว์ error อ่านออกไหม (ไม่ใช่แค่ 500 เฉยๆ)
4. ถ้าอยากให้ `display_name`/`website`/`contact` จากฟอร์มไปโผล่ในไฟล์จริงได้แน่นอน (ไม่ใช่แค่ fallback จาก
   GitHub) ต้องไปแก้ Google Apps Script โปรเจกต์แยกให้ action `submit_developer_request` เก็บ 3 ฟิลด์นี้ไว้ใน
   sheet ด้วย แล้วให้ `admin_developer_requests` คืนค่ากลับมาด้วย — งานนี้อยู่นอก repo นี้ ต้องขอโค้ด Apps Script
   มาดูก่อนถึงจะช่วยแก้ให้ได้
5. พิจารณาเพิ่มปุ่ม "ลองสร้างไฟล์อีกครั้ง" แยกจากปุ่มอนุมัติ สำหรับ request ที่ role เปลี่ยนเป็น developer ไปแล้ว
   แต่ GitHub PR ยังสร้างไม่สำเร็จ (ตอนนี้ต้องกด "อนุมัติ" ซ้ำซึ่งอาจ error จาก GAS ถ้า backend ไม่ยอมให้
   เปลี่ยนสถานะซ้ำ — ยังไม่ได้ทดสอบเคสนี้จริง)
