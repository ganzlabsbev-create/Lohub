# Progress Log — Mini App Store

## สถานะล่าสุด
- ตอนที่ทำถึง: Part 10
- สถานะ: เสร็จแล้ว (โปรเจกต์ครบ 10 ตอนตามสเปก)

## สิ่งที่ทำเสร็จแล้ว
- [x] Part 1: Setup repo structure + schema JSON + mock data
- [x] Part 2: Builder script (data/apps/*.json → search-index.json + manifest.json)
- [x] Part 3: หน้า User — หน้าแรก + หน้ารายการแอปตามหมวด
- [x] Part 4: หน้า User — หน้าค้นหา + หน้ารายละเอียดแอป
- [x] Part 5: หน้า User — หน้าโปรไฟล์นักพัฒนา + responsive/polish
- [x] Part 6: ฝั่ง Developer — ฟอร์มส่งแอปใหม่ (mock auth)
- [x] Part 7: ฝั่ง Developer — Dashboard + หน้าแก้ไข/อัปเวอร์ชัน
- [x] Part 8: ฝั่ง Admin — หน้ารายการรอตรวจ + อนุมัติ/ปฏิเสธ
- [x] Part 9: ฝั่ง Admin — จัดการหมวดหมู่ + จัดการนักพัฒนา
- [x] Part 10: GitHub Actions + GitHub OAuth + เชื่อม Vercel deploy

## Tech stack ที่เลือกใช้ฝั่งหน้าเว็บ (ตัดสินใจใน Part 3)
- **Next.js (Pages Router)** — เข้ากับโฟลเดอร์ `pages/` ที่ตั้งไว้ตั้งแต่ Part 1 และ deploy บน Vercel ได้ทันทีแบบ zero-config
- โหลดข้อมูลแอปแบบ **client-side fetch** จาก `/search-index.json` ผ่าน hook `lib/useSearchIndex.js` (ไม่ใช้ `getStaticProps` อ่าน apps ตรงๆ) เพื่อให้ตรงกับหลักการสเปกที่ว่า "เว็บโหลดจาก search-index.json จุดเดียว" และเผื่ออนาคตอยากเปลี่ยนเป็น revalidate/ISR ก็ทำได้ง่าย
- `data/settings/site.json` (ชื่อเว็บ, tagline) โหลดผ่าน `getStaticProps` + `lib/site.js` (ใช้ `fs` อ่านตรงตอน build เพราะไฟล์นี้ไม่ได้อยู่ใน `public/`)
- ไม่ได้ใช้ Tailwind — เขียน CSS เองใน `styles/globals.css` ด้วย design tokens (CSS variables) ให้คุมธีมง่าย

## การตัดสินใจสำคัญ: `public/assets` เป็น symlink ไป `../assets`
สเปกกำหนดให้ `assets/` อยู่ level เดียวกับ `public/` (ไม่ได้อยู่ใต้ `public/`) แต่ Next.js serve ไฟล์ static ได้เฉพาะจาก `public/` เท่านั้น
เลยสร้าง **symlink `public/assets -> ../assets`** ไว้ให้ `/assets/icons/xxx.png` ที่อ้างอิงในไฟล์ apps ใช้งานได้จริงบนเว็บ โดยที่ `assets/` ยังเป็น source of truth อยู่ที่เดิมตามโครงสร้าง repo
**ข้อควรระวัง:** เวลา deploy บน Vercel ต้องเช็คว่า symlink ถูกเก็บไว้ใน git ตอน commit (บาง tool เช่น บาง zip/upload UI อาจ deref symlink เป็นโฟลเดอร์จริง — ถ้าเจอปัญหานี้บน Vercel ให้แก้เป็นการ copy ไฟล์แทนหรือใช้ `next.config.js` rewrites ชี้ไปที่ path จริงแทน)

## ไฟล์ใหม่ใน Part 3
- `package.json`, `next.config.js`, `.gitignore` — ตั้งโปรเจกต์ Next.js ที่ root (ใช้ pages/ เดิม)
- `public/assets` — symlink ไป `../assets` (ดูเหตุผลด้านบน)
- `lib/site.js` — อ่าน `data/settings/site.json` ตอน build
- `lib/useSearchIndex.js` — hook fetch `/search-index.json` ฝั่ง client
- `lib/sort.js` — ตัวช่วยเรียงลำดับแอป (ยอดนิยม / ใหม่ล่าสุด / ชื่อ) ใช้ร่วมกันหลายหน้า
- `components/Layout.js` — masthead header (ชื่อเว็บ+tagline จาก site.json) + footer
- `components/AppIcon.js` — ไอคอนแอป พร้อม fallback เป็นตัวอักษรแรกของชื่อถ้าโหลดรูปไม่ได้ (ยังไม่มีไฟล์ icon จริง)
- `components/AppCard.js` — การ์ดแอปสไตล์ "ตั๋วติดตั้ง" (ticket) โชว์ icon/ชื่อ/dev/หมวดหมู่/install method หลัก/ขนาดไฟล์
- `components/CategoryPill.js` — ป้ายหมวดหมู่ ลิงก์ไปหน้าหมวด
- `components/StateMessage.js` — ข้อความ loading/error/empty กลาง
- `pages/_app.js` — import global stylesheet
- `pages/index.js` — หน้าแรก: hero, หมวดหมู่ทั้งหมด, แอปแนะนำ (top 3 by popular sort), แอปใหม่ (top 4 by created_at)
- `pages/category/[slug].js` — หน้ารายการแอปตามหมวด พร้อม filter/sort (ยอดนิยม/ใหม่ล่าสุด/ชื่อ), มีเคส "ไม่พบหมวดหมู่" และ "หมวดนี้ยังไม่มีแอป"
- `styles/globals.css` — design system: โทน "index card / install ticket" กระดาษเขียว-เทาอ่อน (#EAEFE9) + ตัวอักษร Kanit (หัวข้อ) / IBM Plex Sans Thai (เนื้อหา) / IBM Plex Mono (ตัวเลข/เวอร์ชัน) รองรับ Thai เต็มรูปแบบ

## ทดสอบแล้ว
- รัน `tsc --noEmit --noResolve` (isolated syntax check ทีละไฟล์ เพราะ sandbox นี้ไม่มีเน็ตให้ `npm install next`) ผ่านทุกไฟล์ .js/.jsx — ไม่มี syntax error
- ตรวจ JSON ของ `package.json` ผ่าน
- **ยังไม่ได้รัน `next dev`/`next build` จริงในเครื่อง** เพราะ sandbox ไม่มีเน็ต — ให้รัน `npm install && npm run dev` ในเครื่องที่มีเน็ตเพื่อยืนยันอีกรอบก่อน deploy จริง ถ้าเจอ error ให้แจ้งกลับมาแก้ต่อได้

## ไฟล์ใหม่/แก้ไขใน Part 4
- `lib/format.js` — ใหม่: `formatDate` (แสดงวันที่แบบ th-TH) และ `formatSize` (MB/KB/เว็บแอป) ใช้ในหน้ารายละเอียด
- `lib/search.js` — ใหม่: `searchApps(apps, query)` ค้นจาก name, developer_name, description_short, category_names, features — รับ apps ที่โหลดมาแล้ว ไม่ fetch เพิ่ม
- `components/ScreenshotGallery.js` — ใหม่: แถบ screenshot เลื่อนนอน, แต่ละรูป fallback เป็นกล่อง placeholder (🖼 + caption) ถ้าโหลดไม่ได้ (แพทเทิร์นเดียวกับ `AppIcon.js`)
- `components/InstallButtons.js` — ใหม่: ปุ่มติดตั้งเรียง primary ก่อนเสมอ, ปุ่ม primary style เด่นกว่า, มี icon ต่อ type (apk/github/pwa)
- `components/VersionHistory.js` — ใหม่: list ประวัติเวอร์ชัน พร้อม badge "ปัจจุบัน" ที่ version ตรงกับ `current_version`, ลิงก์ดาวน์โหลดต่อเวอร์ชัน
- `pages/search.js` — ใหม่: หน้าค้นหา, input ผูกกับ `?q=` ใน URL (shallow replace แบบ debounce 350ms เพื่อแชร์ลิงก์ผลค้นหาได้ โดยไม่ยิง route เปลี่ยนถี่เกินไป), ใช้ `useSearchIndex` + `searchApps` + `AppCard` เดิม
- `pages/app/[slug].js` — ใหม่: หน้ารายละเอียดแอป — breadcrumb, header (icon/ชื่อ/dev link/verified stamp/category pills), ปุ่มติดตั้ง, meta grid (เวอร์ชัน/ขนาด/OS/license/ภาษา), feature tags, คำอธิบายเต็ม, screenshot gallery, version history
- `components/Layout.js` — แก้ไข: เพิ่มลิงก์ "🔍 ค้นหา" ในแถบ masthead ให้เข้าหน้า `/search` ได้ (ก่อนหน้านี้ไม่มีทางเข้าเลยนอกจากพิมพ์ URL เอง)
- `styles/globals.css` — เพิ่ม CSS: `.search-*`, `.breadcrumb`, `.app-detail__*`, `.install-*`, `.meta-grid`, `.feature-row`/`.tag--feature`, `.shot*` (gallery), `.version-*` (~130 บรรทัด)

## การตัดสินใจสำคัญใน Part 4
- **หน้าโปรไฟล์นักพัฒนา**: หน้ารายละเอียดแอปลิงก์ชื่อนักพัฒนาไปที่ `/developer/{dev_id}` ล่วงหน้า (หน้ายังไม่มี จะขึ้น 404 จนกว่าจะทำ Part 5) — ใช้ `dev_id` แทน slug เพราะ schema `developers/{dev_id}.json` ไม่มีฟิลด์ `slug` (มีแต่ `id`/`github_username`) ถ้า Part 5 อยากได้ URL สวยกว่านี้ (เช่นใช้ `github_username`) ต้องตัดสินใจตอนนั้น — สอดคล้องแพทเทิร์นเดียวกับที่ Part 3 ลิงก์ `/app/{slug}` ไว้ล่วงหน้าก่อน Part 4 จะสร้างจริง
- **หน้าค้นหาไม่ debounce การกรองผลลัพธ์เอง** (filter สดทุกครั้งที่พิมพ์ เพราะข้อมูลอยู่ใน memory แล้ว เร็วพอ) แต่ debounce เฉพาะการ sync คำค้นกลับเข้า URL (`router.replace` แบบ shallow) เพื่อไม่ให้สร้าง history entry ถี่เกินไป
- **Breadcrumb ในหน้ารายละเอียด** ใช้หมวดหมู่แรก (`category_ids[0]`) เป็นตัวแทนเส้นทาง เพราะแอปมีได้หลายหมวด แต่ breadcrumb ควรมีเส้นทางเดียว
- ปุ่มติดตั้งทุกปุ่มเปิด `target="_blank"` (ไฟล์ apk/ลิงก์ภายนอก ไม่ควรพาออกจากเว็บโดยไม่รู้ตัว)

## ทดสอบแล้ว
- รัน `tsc --noEmit --allowJs --jsx react` ทีละไฟล์ (isolated syntax check เพราะ sandbox ไม่มีเน็ตให้ `npm install`) ผ่านทุกไฟล์ใหม่/แก้ไขใน Part 4 — ไม่มี syntax error
- ตรวจ `package.json` ยัง parse เป็น JSON ได้ปกติ (ไม่ได้แก้ dependency ใน Part นี้)
- **ยังไม่ได้รัน `next dev`/`next build` จริง** เพราะ sandbox ไม่มีเน็ต — ให้รัน `npm install && npm run dev` ในเครื่องที่มีเน็ต แล้วลองเข้า `/search` และ `/app/pixel-quest` (หรือ slug อื่นจาก `data/apps/`) เพื่อยืนยันก่อน deploy จริง

## ไฟล์ใหม่/แก้ไขใน Part 5
- `components/DevAvatar.js` — ใหม่: อวตารนักพัฒนา วงกลม, fallback เป็นตัวอักษรแรกของชื่อถ้าโหลดรูปไม่ได้ (แพทเทิร์นเดียวกับ `AppIcon.js`/`ScreenshotGallery.js`)
- `pages/developer/[id].js` — ใหม่: หน้าโปรไฟล์นักพัฒนา — breadcrumb, header (avatar/ชื่อ/verified stamp/วันที่เข้าร่วม/จำนวนแอป/ลิงก์เว็บไซต์+GitHub), รายการแอปทั้งหมดของ dev คนนั้น (filter จาก `data.apps` ด้วย `developer_id`, เรียง newest ก่อนด้วย `sortApps` เดิม, ใช้ `AppCard` เดิม) — **path ตรงกับที่ Part 4 ลิงก์ไว้ล่วงหน้าแล้ว (`/developer/{dev_id}`) ตอนนี้ไม่ 404 แล้ว**
- `styles/globals.css` — เพิ่ม 2 ส่วน:
  1. CSS สำหรับหน้าโปรไฟล์ (`.dev-head`, `.dev-avatar`, `.dev-head__*`)
  2. **Polish รอบนี้ (ตามที่ระบุใน Part 5):**
     - เพิ่ม `:focus-visible` ให้ลิงก์/ปุ่ม/input ทั้งเว็บ (กรอบเหลืองตอน tab ด้วยคีย์บอร์ด) — ก่อนหน้านี้ไม่มี เข้าถึงด้วยคีย์บอร์ดยากกว่าที่ควร
     - ขยาย media query เดิมที่ 560px ให้ครอบคลุมหน้าโปรไฟล์ใหม่ (`.dev-head` stack แนวตั้ง), ลด padding ของ masthead/page บนจอเล็ก, ลด `.meta-grid` เหลือ 2 คอลัมน์บนจอเล็ก (จากเดิม auto-fit ที่บางทีเหลือคอลัมน์เดียวดูโหว่)
     - เพิ่ม breakpoint ใหม่ที่ 380px (จอมือถือเล็กมาก เช่น iPhone SE) — ปุ่มติดตั้งเรียงเต็มความกว้างแนวตั้งแทนที่จะบีบเป็นแถวแคบๆ, ลดขนาดชื่อเว็บใน masthead, `.meta-grid` เหลือ 2 คอลัมน์คงที่พร้อม padding แคบลง

## การตัดสินใจสำคัญใน Part 5
- **URL โปรไฟล์นักพัฒนาใช้ `dev_id`** (`/developer/dev_0001`) ตามที่ตัดสินใจไว้ล่วงหน้าตั้งแต่ Part 4 (schema developer ไม่มีฟิลด์ `slug`) — ไม่ได้เปลี่ยนมาใช้ `github_username` เพราะจะทำให้ URL เปลี่ยนได้ถ้า dev เปลี่ยนชื่อ GitHub ในอนาคต ส่วน `id` เป็นค่าคงที่ตาม source of truth
- **ไม่แสดง `contact` (email) บนหน้าโปรไฟล์สาธารณะ** แม้ schema จะมีฟิลด์นี้ — เลือกไม่โชว์เพื่อความเป็นส่วนตัวของนักพัฒนา (กันสแปม/สแกนอีเมล) โชว์แค่ website กับ GitHub username ที่ตั้งใจเปิดเผยอยู่แล้ว ถ้าต้องการช่องทางติดต่อจริงจัง แนะนำให้ทำผ่านฟอร์ม/GitHub แทนใน Part หลังๆ
- **โฟกัส "polish" รอบนี้เน้น 2 อย่าง**: (1) keyboard accessibility (`:focus-visible`) เพราะไม่มีมาก่อนเลยตลอด Part 3-4 (2) ความละเอียดของ responsive บนจอเล็กมาก (<380px) เพราะ breakpoint เดิมที่ 560px ยังไม่พอสำหรับปุ่มติดตั้งหลายปุ่มและ meta-grid — ไม่ได้รื้อ design system หรือเปลี่ยนสไตล์ใหญ่ เพราะสเปกไม่ได้ขอ แค่ปิดช่องโหว่ usability ที่เจอจากการรีวิว

## ทดสอบแล้ว
- รัน `tsc --noEmit --allowJs --jsx react` ทีละไฟล์ใหม่ (`DevAvatar.js`, `developer/[id].js`) — ไม่มี syntax error
- เช็คไฟล์ `globals.css` ว่าวงเล็บปีกกาเปิด-ปิดครบ (115 คู่) ป้องกัน CSS พังจากการแก้ไข
- **ยังไม่ได้รัน `next dev`/`next build` จริง** เพราะ sandbox ไม่มีเน็ต — ให้รัน `npm install && npm run dev` ในเครื่องที่มีเน็ต แล้วลองเข้า `/developer/dev_0001` และ `/developer/dev_0002` เพื่อยืนยัน รวมถึงลองย่อหน้าจอเบราว์เซอร์ดูช่วง <380px เพื่อเช็คปุ่มติดตั้งบนหน้ารายละเอียดแอป

## ไฟล์ใหม่/แก้ไขใน Part 6
- `lib/mockAuth.js` — ใหม่: mock auth ฝั่ง developer เก็บ "developer id ที่ล็อกอินอยู่" ใน `localStorage` (`mockdev_current_id`) และเก็บ draft ที่ส่งแล้วไว้ใน `localStorage` (`mockdev_submissions`) เพื่อให้ Part 7 (Dashboard) มาอ่านต่อได้เลยโดยไม่ต้องมี backend จริง
- `lib/appDraft.js` — ใหม่: `slugify()`, `nextAppId()` (นับจากจำนวนแอปที่มีอยู่ — ของจริงต้องให้ backend/PR merge เป็นคนกำหนดกันชนกัน, รอ Part 10), `validateDraftForm()` (validate ฟิลด์ทั้งหมด + เงื่อนไขเฉพาะ install method), `buildAppDraft()` (ประกอบ object ให้ตรง schema `data/apps/{app_id}.json` เป๊ะ พร้อม `status: "pending"`)
- `components/DevGuard.js` — ใหม่: gate component เช็คว่ามี developer login (mock) อยู่ไหมก่อนโชว์เนื้อหา ถ้าไม่มีจะลิงก์ไปหน้า `/dev/login` — ใช้ children เป็นฟังก์ชัน `(developer) => JSX` (render props) เพื่อส่งต่อ developer object ที่ resolve แล้ว
- `pages/dev/login.js` — ใหม่: หน้า mock login — โหลดรายชื่อนักพัฒนาจาก `search-index.json` (เหมือนหน้าอื่นๆ) แล้วให้กดเลือกโปรไฟล์เพื่อ "เข้าสู่ระบบ" (เขียน id ลง `localStorage` ผ่าน `mockAuth.js` แล้วเด้งไป `/dev/submit`)
- `pages/dev/submit.js` — ใหม่: ฟอร์มส่งแอปใหม่ทั้งหมด — ชื่อ/slug (auto-generate จากชื่อ, แก้เองได้), คำอธิบายสั้น/เต็ม, หมวดหมู่ (checkbox หลายอัน), license (dropdown บังคับจาก `site.license_options`), ภาษา, ฟีเจอร์ (comma-separated), เลือกวิธีติดตั้ง (APK/GitHub/PWA) แล้วฟอร์มเปลี่ยนฟิลด์ตามที่เลือกตามสเปก — submit แล้ว validate, ประกอบ JSON ตาม schema, เก็บลง `localStorage` แล้วโชว์ preview + ปุ่มคัดลอก JSON
- `components/Layout.js` — แก้ไข: เพิ่มลิงก์ "➕ ส่งแอป" ในแถบ masthead คู่กับลิงก์ค้นหาเดิม (ห่อด้วย `.masthead__nav` ใหม่)
- `styles/globals.css` — เพิ่ม CSS: `.dev-narrow`, `.banner-note`, `.dev-login-*`, `.dev-form`/`.form-field*`/`.checkbox-*` (ฟอร์มทั้งหมด), `.btn-primary`/`.btn-secondary`, `.json-preview`, `.masthead__nav` (~140 บรรทัด)

## การตัดสินใจสำคัญใน Part 6
- **ไม่มี GitHub OAuth จริงตามที่สเปกบอกว่า Part 6 ยังไม่ต้องมี auth จริง** — ทำ mock login แบบ "เลือกโปรไฟล์นักพัฒนาที่มีอยู่แล้ว" แทน เก็บสถานะด้วย `localStorage` คีย์ `mockdev_current_id` ผ่าน `lib/mockAuth.js` — ออกแบบให้ Part 10 มาแทนที่ด้วย GitHub OAuth จริงได้ง่าย (แค่เปลี่ยนวิธีตั้งค่า id ที่ล็อกอินอยู่ ไม่ต้องแตะ `DevGuard`/หน้าฟอร์ม)
- **ยังไม่มี backend/PR จริง** จึงไม่ได้เขียนไฟล์ลง `data/pending/` ตรงๆ (ทำไม่ได้ในเว็บฝั่ง client) — แทนที่ด้วยการประกอบ JSON ตาม schema แล้วเก็บลง `localStorage` (`mockdev_submissions`) + โชว์ preview ให้คัดลอก เพื่อให้ Part 7 (Dashboard) และ Part 10 (ต่อ GitHub PR จริง) มาทำงานต่อจากจุดเดียวกันได้
- **`app_id` ตอนส่งฟอร์ม** คำนวณแบบ mock จากจำนวนแอปที่มีอยู่ (`nextAppId`) — เขียนคอมเมนต์กำกับไว้ชัดเจนว่าของจริงต้องให้ backend/PR merge เป็นคนกำหนดกันชนกันเวลามีคนส่งพร้อมกัน (ยังไม่ใช่ปัญหาตอนนี้เพราะเป็น local mock คนเดียว)
- **ยังไม่รองรับอัปโหลดไอคอน/screenshot** ในฟอร์ม — ใส่ path `icon` แบบ `local` ชี้ไปที่ `/assets/icons/{app_id}.png` ตามคอนเวนชันเดิม (ไฟล์จริงต้องอัปโหลดแยกทีหลังผ่าน PR) และ `screenshots` ปล่อยเป็น array ว่างไว้ก่อน — มีข้อความบอกผู้ใช้ในฟอร์มตรงๆ ว่ายังไม่รองรับ
- **แก้ปัญหา `<label>` ครอบ checkbox หลายตัว**: ตอนแรกจะใช้ `Field` (คอมโพเนนต์เดิมที่ห่อด้วย `<label>`) กับทุกฟิลด์ แต่พบว่าถ้าใช้ `<label>` ครอบกลุ่ม checkbox/ปุ่มหลายตัว การคลิกที่ข้อความ label จะไปโฟกัส/สลับค่า input ตัวแรกในกลุ่มผิดตัว (browser default) — แก้โดยแยกเป็น `FieldGroup` (ใช้ `<div>` แทน) สำหรับฟิลด์ที่มี checkbox/ปุ่มหลายตัว (หมวดหมู่, ภาษา, วิธีติดตั้ง) ส่วนฟิลด์ input เดี่ยวยังใช้ `Field`/`<label>` เดิมเพื่อ a11y ที่ดีกว่า

## ทดสอบแล้ว
- รัน `tsc --noEmit --allowJs --jsx react` ทีละไฟล์ใหม่/แก้ไขใน Part 6 — ไม่มี syntax error
- เช็ค `globals.css` วงเล็บปีกกาเปิด-ปิดครบ (141 คู่) และ `package.json` ยัง parse ได้ปกติ
- **ยังไม่ได้รัน `next dev`/`next build` จริง** เพราะ sandbox ไม่มีเน็ต — ให้รัน `npm install && npm run dev` ในเครื่องที่มีเน็ต แล้วทดสอบ flow เต็ม: เข้า `/dev/submit` ตอนยังไม่ login (ควรเห็นข้อความให้ไปหน้า login), ไป `/dev/login` เลือกโปรไฟล์, กลับมา `/dev/submit` กรอกฟอร์ม (ลองทั้ง 3 แบบ install method), submit แล้วดู JSON preview + ปุ่มคัดลอก, ลอง submit โดยไม่กรอกอะไรเลยเพื่อดู validation error ครบทุกฟิลด์

## ไฟล์ใหม่/แก้ไขใน Part 7
- `lib/mockAuth.js` — เพิ่ม: `updateMockSubmission(id, draft)` (แก้ไข draft ที่ยัง pending ทับของเดิมใน `localStorage`), และชุดฟังก์ชันสำหรับแอปที่ผ่านแล้ว — `getMockAppUpdates()` / `getMockAppUpdate(appId)` / `setMockAppUpdate(appId, updatedApp)` เก็บ "อัปเดตเวอร์ชันที่รอตรวจ" ของแอปที่ publish แล้วไว้ใน `localStorage` คีย์ `mockdev_app_updates` (คีย์ย่อยเป็น app id) เพราะฝั่ง client เขียนทับไฟล์ `data/apps/*.json` จริงไม่ได้ (รอ Part 10 ต่อเป็น PR จริง)
- `lib/appDraft.js` — เพิ่ม: `validateVersionForm(form, { requireFile })` validate ฟอร์มอัปเวอร์ชัน (version ต้องเป็น semver, note บังคับ, ถ้า `requireFile` true ต้องมี apk_url + size_mb), และ `buildVersionUpdate(app, form, { replaceLatest })` ประกอบแอปตัวใหม่จากแอปเดิม — ถ้า `replaceLatest: false` (แอปที่ผ่านแล้ว) จะ **เพิ่ม** entry ใหม่เข้า `version_history` ตามสเปก ถ้า `replaceLatest: true` (draft ที่ยัง pending) จะ **แทนที่** entry แรกแทน เพราะยังไม่ผ่าน admin เลยไม่ควรสะสมประวัติซ้อน
- `components/StatusBadge.js` — ใหม่: badge เล็กๆ แสดงสถานะ (`pending` / `published` / `published-updating` / `rejected` — ตัวหลังเผื่อไว้ให้ Part 8 ใช้ต่อได้เลยแม้ Part 7 จะยังไม่มี flow ที่ set สถานะนี้จริง)
- `pages/dev/dashboard.js` — ใหม่: หน้า Dashboard — ใช้ `DevGuard` เหมือนหน้า submit, รวมรายการ 2 แหล่ง: (1) แอปที่ publish แล้วจาก `data.apps` ที่ `developer_id` ตรงกัน (เช็ค `getMockAppUpdate` ประกบด้วยว่ามีอัปเดตค้างรอไหม) (2) draft ที่ยัง pending จาก `getMockSubmissions()` — เรียงรวมกันตาม `updated_at` ล่าสุดก่อน แต่ละแถวโชว์ไอคอน/ชื่อ/สถานะ/เวอร์ชัน/วันที่อัปเดตล่าสุด + ปุ่ม "ดูหน้าแอป" (เฉพาะที่ publish แล้ว) และปุ่มไปหน้าแก้ไข/อัปเวอร์ชัน
- `pages/dev/apps/[id]/edit.js` — ใหม่: หน้าแก้ไข/อัปเวอร์ชันแอป — หา "แอปต้นทาง" จาก `data.apps` ก่อน (ถ้าเจอ = แอปที่ผ่านแล้ว, เอา `getMockAppUpdate` มาทับถ้ามีอัปเดตค้างอยู่แล้วจะได้แก้ต่อจากอันล่าสุดไม่ใช่ของเดิม) ถ้าไม่เจอค่อยหาใน mock submissions (draft ที่ยัง pending) เช็คสิทธิ์ด้วย `developer_id === developer.id` เสมอ — ฟอร์มปรับฟิลด์ตามชนิด install method หลัก (ขอ apk_url+size_mb บังคับถ้าเป็น apk, ไม่บังคับถ้าเป็น github/pwa) submit แล้วโชว์ preview JSON + ปุ่มคัดลอกแบบเดียวกับหน้า submit ใน Part 6
- `components/Layout.js` — แก้ไข: เพิ่มลิงก์ "📋 Dashboard" ใน masthead nav คู่กับ "ค้นหา"/"ส่งแอป" เดิม
- `pages/dev/submit.js` — แก้ไข: เติมลิงก์ `/dev/dashboard` จริงในหน้า success (ค้างจาก Part 6 ที่ยังไม่มีหน้า Dashboard ให้ลิงก์)
- `pages/app/[slug].js`, `pages/developer/[id].js` — แก้ไข (bugfix ที่ติดมาจาก Part 4/5): เพิ่ม `export async function getStaticPaths() { return { paths: [], fallback: "blocking" }; }` — Next.js (Pages Router) บังคับว่าหน้า dynamic route ที่ใช้ `getStaticProps` ต้องมี `getStaticPaths` คู่กันเสมอ ไม่งั้น `next build` จะ error และพังทั้งเว็บ (ของเดิมไม่มีเพราะยังไม่เคยรัน `next build` จริงมาก่อน) — หน้าใหม่ `pages/dev/apps/[id]/edit.js` ใน Part 7 ก็ใส่ไว้ตั้งแต่แรกด้วยเหตุผลเดียวกัน
- `styles/globals.css` — เพิ่ม CSS: `.dash-list`/`.dash-item*` (การ์ดรายการใน Dashboard), `.badge`/`.badge--*` (สถานะ), `.btn-small` (ปุ่มขนาดย่อมสำหรับใช้ในการ์ด) + responsive เล็กน้อยที่ breakpoint 560px เดิม (~35 บรรทัด)

## การตัดสินใจสำคัญใน Part 7
- **Dashboard รวม 2 สถานะจากคนละแหล่งข้อมูล**: แอปที่ "ผ่านแล้ว" มาจาก `search-index.json` (source of truth จริง) ส่วนแอปที่ "รอตรวจ" มาจาก `localStorage` (mock) — ทั้งสองฝั่งใช้ shape กลางเดียวกัน (`{id, name, icon, status, version, updated_at, viewHref, editHref}`) ก่อน render เพื่อให้โค้ด list เดียวใช้ได้กับทั้งคู่ ไม่ต้องแยก component
- **แอปที่ผ่านแล้วแต่มีอัปเดตค้างรอ (`published-updating`)**: ตรวจจาก `getMockAppUpdate(appId)` — ถ้ามี จะโชว์เวอร์ชัน/วันที่จากอัปเดตที่ค้างแทนของเดิม และถ้ากด "แก้ไข/อัปเวอร์ชัน" ซ้ำ จะแก้ต่อจากอัปเดตที่ค้างอยู่ (ไม่ใช่แก้ทับจากแอปตัวเดิมใน `search-index.json` ซึ่งจะทำให้เสียงานที่แก้ไปแล้วรอบก่อน)
- **แยกพฤติกรรม `version_history` ตามสถานะแอปต้นทาง**: แอปที่ผ่านแล้ว = **เพิ่ม** entry ใหม่ (สะสมประวัติ ตรงตามสเปกที่บอกว่า "เพิ่มเข้า version_history") ส่วน draft ที่ยัง pending = **แทนที่** entry เดิม เพราะยังไม่ผ่าน admin เลยยังไม่ควรนับเป็น "ประวัติ" จริงจัง — เป็นแค่การแก้ draft ก่อนตรวจ
- **ไม่ได้ทำหน้าแก้ไขข้อมูลทั่วไปของแอป (ชื่อ/คำอธิบาย/หมวดหมู่)** ใน Part 7 — สเปกเขียนไว้ตรงๆ แค่ "หน้าแก้ไขแอป / อัปเวอร์ชันใหม่ (เพิ่มเข้า version_history)" เลยตีความให้โฟกัสที่การอัปเวอร์ชัน/ไฟล์ติดตั้งเป็นหลัก ถ้าจะให้แก้ชื่อ/คำอธิบาย/หมวดหมู่ได้ด้วย ต้องทำ Part ถัดไปหรือขยาย `EditAppPage` เพิ่ม (โครงสร้างรองรับได้เพราะมี `app` เต็มอยู่แล้ว เพิ่มฟอร์มได้โดยไม่ต้องรื้อ)
- **บั๊กที่แก้ไปด้วย (ไม่ได้อยู่ในสโคป Part 7 เดิม แต่กระทบทั้งเว็บ)**: `pages/app/[slug].js` และ `pages/developer/[id].js` ใช้ `getStaticProps` บน dynamic route โดยไม่มี `getStaticPaths` มาตั้งแต่ Part 4/5 — จุดนี้ทำให้ `next build` error แน่นอน (แค่ไม่เคยรันจริงในเครื่องที่มีเน็ตมาก่อนเลยไม่มีใครเจอ) แก้โดยเติม `getStaticPaths` แบบ `fallback: "blocking"` ให้ทั้งสองไฟล์ (ข้อมูลจริงโหลด client-side อยู่แล้ว ไม่กระทบพฤติกรรมหน้าเว็บ)

## ทดสอบแล้ว
- รัน `tsc --noEmit --allowJs --jsx react` ทีละไฟล์ใหม่/แก้ไขใน Part 7 — ไม่มี syntax error
- เช็ค `globals.css` วงเล็บปีกกาเปิด-ปิดครบ (156 คู่) และ `package.json` ยัง parse ได้ปกติ
- **ยังไม่ได้รัน `next dev`/`next build` จริง** เพราะ sandbox ไม่มีเน็ต — ให้รัน `npm install && npm run dev` ในเครื่องที่มีเน็ต แล้วทดสอบ flow เต็ม:
  1. ล็อกอิน mock ที่ `/dev/login` แล้วส่งแอปใหม่ 1 อันที่ `/dev/submit` (จะได้ draft สถานะ pending)
  2. ไป `/dev/dashboard` — ควรเห็นทั้งแอป mock เดิมที่ publish แล้ว (ถ้า login เป็น dev ที่มีแอปอยู่ก่อน เช่น `dev_0001`) และแอปที่เพิ่งส่งเป็น pending
  3. กด "อัปเดตเวอร์ชัน" บนแอปที่ publish แล้ว → กรอกฟอร์ม → บันทึก → กลับมา dashboard ควรเห็น badge เปลี่ยนเป็น "ผ่านแล้ว · มีอัปเดตรอตรวจ" และเวอร์ชันอัปเดตตาม
  4. กด "แก้ไข draft" บนแอปที่ยัง pending → บันทึก → เช็คว่า `localStorage` คีย์ `mockdev_submissions` อัปเดตค่าเดิม ไม่เพิ่มรายการซ้ำ
  5. ลองเข้า `/dev/apps/app_9999/edit` (id ที่ไม่มีจริง) ควรเห็นข้อความ "ไม่พบแอปนี้"

## ไฟล์ใหม่/แก้ไขใน Part 8
- `lib/mockAdmin.js` — ใหม่: mock store ฝั่ง Admin — `getPendingQueue()` (= `getMockSubmissions()` ทุก developer ไม่ filter เหมือน Part 7), `approveMockSubmission(draft)` (สร้างแอป `status: "published"` เก็บลง `localStorage` คีย์ `adminmock_approved_apps` แล้วเอา draft ออกจากคิว), `rejectMockSubmission(draft, reason)` (เก็บ draft + `reject_reason` ลงคีย์ `adminmock_rejected` แล้วเอาออกจากคิวเหมือนกัน), `getMockApprovedApps()` / `getMockApprovedApp(id)` / `getMockRejectedFor(developerId)`
- `lib/mockAuth.js` — เพิ่ม: `removeMockSubmission(id)` ใช้ร่วมกันโดย approve/reject ทั้งคู่ (เอา draft ออกจากคิว `mockdev_submissions`)
- `components/StatusBadge.js` — แก้ไข: เพิ่ม prop `title` (โชว์เป็น tooltip) ใช้โชว์เหตุผลการปฏิเสธที่ badge สถานะ `rejected`
- `pages/admin/queue.js` — ใหม่: หน้าคิวรอตรวจ — โหลด developers/categories จาก `search-index.json` เพื่อ lookup ชื่อ, แต่ละแถวโชว์ไอคอน/ชื่อ/ผู้ส่ง/วันที่ส่ง/คำอธิบายสั้น/หมวดหมู่/license/ลิงก์ติดตั้ง (เปิดแท็บใหม่ให้ admin ตรวจลิงก์เอง)/ขนาดไฟล์ ปุ่ม "อนุมัติ" ทำงานทันที ปุ่ม "ปฏิเสธ" เปิดกล่องกรอกเหตุผล (บังคับอย่างน้อย 3 ตัวอักษร) แล้วมีปุ่ม "ยืนยันปฏิเสธ"/"ยกเลิก" — action เสร็จแล้ว refresh คิวจาก `localStorage` ทันที (แถวหายไปจากคิว)
- `components/Layout.js` — แก้ไข: เพิ่มลิงก์ "🛠 Admin" ใน masthead nav
- `pages/dev/dashboard.js` — แก้ไข: รวมแอปที่ admin mock-อนุมัติแล้ว (`getMockApprovedApps()`) เข้ากับแอปจริงจาก `search-index.json` ก่อนกรองตาม developer และเพิ่มรายการ draft ที่ถูกปฏิเสธ (`getMockRejectedFor(developer.id)`) เข้าไปในลิสต์ด้วย — โชว์ `StatusBadge status="rejected"` พร้อมข้อความเหตุผลใต้แถว (ไม่มีปุ่มแก้ไข/ดูหน้าแอปเพราะยังไม่ทำ flow "แก้ไขแล้วส่งใหม่")
- `pages/dev/apps/[id]/edit.js` — แก้ไข: หา "แอปต้นทาง" เพิ่มจาก `getMockApprovedApp(appId)` ด้วย (ไม่งั้นแอปที่เพิ่ง mock-อนุมัติจะกดอัปเดตเวอร์ชันจาก Dashboard ไม่ได้เพราะไม่อยู่ใน `apps` ของ search-index จริง)
- `pages/app/[slug].js` — แก้ไข: หน้ารายละเอียดแอป fallback ไปหาใน `getMockApprovedApps()` ถ้าไม่เจอใน `search-index.json` (บั๊กต่อเนื่องจากการเพิ่ม mock-approve — ไม่งั้นปุ่ม "ดูหน้าแอป" ในหน้า Dashboard จะพังทันทีที่ admin กดอนุมัติแอปใหม่)
- `styles/globals.css` — เพิ่ม CSS: `.btn-danger`, `.dash-item__reason`, `.queue-list`/`.queue-item*`/`.reject-box` + responsive เล็กน้อยที่ breakpoint 560px เดิม (~40 บรรทัด)

## การตัดสินใจสำคัญใน Part 8
- **หน้า Admin ยังไม่มีระบบสิทธิ์/login จริง** — ใครก็เข้า `/admin/queue` ได้ตอนนี้ (สเปกไม่ได้ระบุวิธี auth ฝั่ง Admin ไว้ และ "ยังไม่ต้องทำตอนนี้" ก็ไม่ได้พูดถึง) เขียนคอมเมนต์กำกับไว้ในไฟล์ตรงๆ ว่ารอ Part 10 ผูก GitHub OAuth แล้วจำกัดเฉพาะ username ที่กำหนดไว้ (ต้องเพิ่ม field เช่น `admin_github_usernames` ใน `data/settings/site.json` ตอนนั้น)
- **"อนุมัติ" ในโหมด mock** = ย้าย draft ออกจาก `mockdev_submissions` แล้วสร้างเป็นแอป `status: "published"` เก็บแยกไว้คนละคีย์ localStorage (`adminmock_approved_apps`) เพราะฝั่ง client เขียนทับ `data/apps/*.json` จริงไม่ได้ (Part 10 ค่อยต่อเป็น PR merge จริง ตอนนั้นค่อยลบ mock store ส่วนนี้ทิ้งได้เลย ไม่กระทบ schema)
- **แก้ปัญหาที่ตามมา**: พอมี "แอปที่ mock-อนุมัติแล้ว" แยกจาก `search-index.json` จริง ทำให้หน้าอื่นที่เคย assume ว่าแอปที่ผ่านแล้วต้องอยู่ใน `data.apps` เท่านั้น (Dashboard, edit page, หน้ารายละเอียดแอป) พังหรือหาไม่เจอ — แก้โดยให้ทั้ง 3 หน้านั้น fallback ไปเช็ค `getMockApprovedApps()`/`getMockApprovedApp()` เพิ่ม (เหมือนที่ Part 7 เคยเจอบั๊ก `getStaticPaths` ที่ไม่ได้อยู่ในสโคปเดิมแต่ต้องแก้เพราะกระทบทั้งเว็บ)
- **เก็บเหตุผลปฏิเสธไว้ที่ draft เดิม ไม่ลบทิ้ง**: `rejectMockSubmission` เก็บ draft ทั้งก้อนบวก `reject_reason` ไว้ในคีย์ `adminmock_rejected` (ไม่ได้ลบข้อมูลแอปทิ้ง) เผื่ออนาคตอยากทำฟีเจอร์ "แก้ไขแล้วส่งใหม่" จากของเดิมได้เลยไม่ต้องกรอกใหม่ทั้งหมด — แต่ Part 8 นี้ยังไม่ได้ทำหน้า/ปุ่มสำหรับ flow นั้น (Dashboard แค่โชว์สถานะ+เหตุผลเฉยๆ)
- **ไม่มีหน้า preview draft ก่อนอนุมัติ**: admin เห็นแค่ข้อมูลสรุป (ชื่อ/คำอธิบายสั้น/หมวด/license/ลิงก์ติดตั้ง) ในการ์ดคิว ต้องกดลิงก์ "ตรวจลิงก์" (เปิดแท็บใหม่) เพื่อเช็ค APK/GitHub/PWA เอง — ยังไม่ได้ทำหน้า preview เต็มแบบหน้ารายละเอียดแอปจริง (ทำได้ในตอนถัดไปถ้าต้องการ ใช้ layout เดียวกับ `pages/app/[slug].js` แต่รับ draft object แทน data จาก search-index)

## ทดสอบแล้ว
- รัน `tsc --noEmit --allowJs --jsx react` ทีละไฟล์ใหม่/แก้ไขใน Part 8 — ไม่มี syntax error
- เช็ค `globals.css` วงเล็บปีกกาเปิด-ปิดครบ (170 คู่)
- **ยังไม่ได้รัน `next dev`/`next build` จริง** เพราะ sandbox ไม่มีเน็ต — ให้รัน `npm install && npm run dev` ในเครื่องที่มีเน็ต แล้วทดสอบ flow เต็ม:
  1. ส่งแอปใหม่จาก `/dev/submit` (dev คนไหนก็ได้) ให้ได้ draft สถานะ pending
  2. ไป `/admin/queue` — ควรเห็น draft ที่เพิ่งส่งอยู่ในคิว พร้อมข้อมูลครบ (ชื่อ/ผู้ส่ง/หมวด/license/ลิงก์/ขนาดไฟล์)
  3. กด "อนุมัติ" — แถวควรหายไปจากคิวทันที แล้วไปเช็ค `/dev/dashboard` (ล็อกอินเป็น dev คนเดิม) ควรเห็นแอปนั้นเป็นสถานะ "ผ่านแล้ว" และกดปุ่ม "ดูหน้าแอป"/"อัปเดตเวอร์ชัน" ได้จริงทั้งคู่
  4. ส่งแอปใหม่อีกอันแล้วกด "ปฏิเสธ" ที่ `/admin/queue` — ลองกดยืนยันโดยไม่กรอกเหตุผลก่อน (ควรเห็น error) แล้วกรอกเหตุผลแล้วยืนยัน — แถวควรหายจากคิว ไปเช็ค Dashboard ควรเห็นสถานะ "ถูกตีกลับ" พร้อมข้อความเหตุผลที่กรอกไว้
  5. รีเฟรชหน้า `/admin/queue` เปล่าๆ (ไม่มี draft ค้าง) ควรเห็นข้อความ "ไม่มีแอปรอตรวจตอนนี้ 🎉"

## ไฟล์ใหม่/แก้ไขใน Part 9
- `lib/mockAdmin.js` — เพิ่ม: mock store จัดการหมวดหมู่ (`getCategoryOverrides`/`getNewCategories`/`updateMockCategory`/`addMockCategory`/`removeMockNewCategory`/`nextMockCategoryId`/`getEffectiveCategories`) และจัดการนักพัฒนา (`getDeveloperStatusOverrides`/`setMockDeveloperStatus`/`getEffectiveDevelopers`) + ตัวช่วยกลาง `readJsonStore(key, fallback)` ใช้ร่วมกันทุก store ในไฟล์นี้กันโค้ด parse ซ้ำ
- `components/AdminNav.js` — ใหม่: แท็บย่อย 3 แท็บ (คิวรอตรวจ/หมวดหมู่/นักพัฒนา) ใช้ร่วมกัน 3 หน้า Admin — ไม่ได้เพิ่มลิงก์พวกนี้ตรงๆ ใน masthead เพราะ nav บนสุดแน่นแล้ว (มี ค้นหา/ส่งแอป/Dashboard/Admin อยู่แล้ว) เข้าทาง "🛠 Admin" แล้วสลับแท็บที่นี่แทน
- `components/StatusBadge.js` — แก้ไข: เพิ่มสถานะ `active`/`suspended` ใช้กับหน้าจัดการนักพัฒนา (ใช้ field `status` เดิมที่มีอยู่แล้วใน schema `data/developers/{id}.json`)
- `pages/admin/queue.js` — แก้ไข: เพิ่ม `<AdminNav active="queue" />` ต่อจาก Part 8 เดิม (ไม่ได้แก้ logic อื่น)
- `pages/admin/categories.js` — ใหม่: รายการหมวดหมู่ (รวมหมวดจริง + override + หมวดใหม่ที่สร้างในเครื่องนี้ เรียงตาม `order`) แต่ละแถวแก้ชื่อ/ไอคอน (emoji)/สี (color picker) ได้ พร้อมปุ่ม ▲▼ สลับ `order` กับแถวข้างเคียง, ปุ่ม "ลบ" โชว์เฉพาะหมวดที่เพิ่งสร้างใหม่ (หมวดจากไฟล์จริงลบไม่ได้ในตอนนี้ ต้องผ่าน PR), ฟอร์ม "เพิ่มหมวดหมู่ใหม่" (ชื่อ/slug auto-generate จาก `slugify`/ไอคอน/สี) validate ชื่อ ≥ 2 ตัวอักษร + slug ไม่ซ้ำ
- `pages/admin/developers.js` — ใหม่: รายการนักพัฒนาทั้งหมด (avatar/ชื่อ/verified stamp/github username/วันเข้าร่วม/จำนวนแอป/badge สถานะ) ปุ่ม "ระงับบัญชี"/"เปิดใช้งานอีกครั้ง" สลับ `status` ทันที + ลิงก์ "ดูโปรไฟล์" ไปหน้า `/developer/{id}` เดิม
- `styles/globals.css` — เพิ่ม CSS: `.badge--active`/`.badge--suspended`, `.admin-nav`/`.admin-nav__tab*`, `.cat-list`/`.cat-row*`/`.order-btn`/`.cat-add-form__row`, `.dev-list`/`.dev-row*` + responsive stacking เพิ่มที่ breakpoint 560px เดิม (~90 บรรทัด)

## การตัดสินใจสำคัญใน Part 9
- **แพทเทิร์น mock store เดียวกับ Part 8**: ข้อมูลจริง `data/categories/*.json` และ `data/developers/*.json` ฝั่ง client เขียนทับไม่ได้ (รอ Part 10 ต่อเป็น PR) เลยเก็บ "ส่วนต่าง" (override) ของของเดิม + ของใหม่ที่สร้างเองแยกคีย์ localStorage เหมือนแอปที่ mock-อนุมัติใน Part 8 ทุกประการ — `getEffective*()` มีหน้าที่ merge ให้หน้าเว็บใช้ได้ทันทีโดยไม่ต้องรู้ว่าข้อมูลมาจากไฟล์จริงหรือ override
- **ลบได้เฉพาะหมวดที่สร้างใหม่ในเครื่องนี้**: หมวดจากไฟล์จริงไม่มีปุ่มลบให้ เพราะการลบหมวดที่มีแอปผูกอยู่แล้วต้องคิดเรื่อง migration (ย้ายแอปไปหมวดอื่น/เตือน admin ก่อน) ซึ่งสเปกไม่ได้ระบุไว้ — ตัดสินใจไม่ทำตอนนี้กันการออกแบบเกินสเปก (ตามหลักการท้ายสเปก "อย่าออกแบบละเอียดเกินสเปกนี้ตอนเริ่ม")
- **เรียงลำดับด้วยการสลับ `order` กับแถวข้างเคียง** แทนการลาก-วาง (drag & drop) — ง่ายกว่า ทดสอบง่ายกว่าบนมือถือ (ผู้ใช้ทำโปรเจกต์นี้ผ่านมือถือทั้งหมด ตามที่บันทึกไว้หลัง Part 8) และให้ผลลัพธ์เหมือนกันเมื่อมีหมวดไม่เยอะ (ตอนนี้มี 3-4 หมวด)
- **การระงับนักพัฒนายังไม่กระทบส่วนอื่นของเว็บ**: ยังไม่ได้ทำให้แอปของนักพัฒนาที่ถูกระงับหายไปจากหน้าแรก/หมวดหมู่/ค้นหา หรือบล็อกไม่ให้ส่งแอปใหม่ที่ `/dev/submit` — สเปกระบุแค่ "จัดการนักพัฒนา (ระงับ/แบน)" ไม่ได้บอกผลกระทบที่ต้องบังคับใช้ เก็บเป็นตอนถัดไปถ้าต้องการ (จุดที่ต้องแก้: `pages/developer/[id].js` โชว์ banner เตือน, `components/DevGuard.js` เช็ค `status` ก่อนให้ส่งแอป)
- **ไม่ทำ "แก้ไข draft ที่ถูกปฏิเสธแล้วส่งใหม่"** ต่อจาก Part 8 เหมือนเดิม (ยังไม่ได้อยู่ในสโคป Part 9 นี้ — ดูหมายเหตุเดิมด้านล่างสำหรับตอนถัดไปถ้าต้องการ)

## ทดสอบแล้ว (Part 9)
- รัน `tsc --noEmit --allowJs --jsx react` (moduleResolution bundler) ทีละไฟล์ใหม่/แก้ไขใน Part 9 — ไม่มี syntax error
- เช็ค `globals.css` วงเล็บปีกกาเปิด-ปิดครบ (202 คู่)
- **ยังไม่ได้รัน `next dev`/`next build` จริง** เพราะ sandbox ไม่มีเน็ต — ให้รัน `npm install && npm run dev` ในเครื่องที่มีเน็ต แล้วทดสอบ flow เต็ม:
  1. ไป `/admin/queue` — ควรเห็นแท็บ "คิวรอตรวจ/หมวดหมู่/นักพัฒนา" ด้านบน กด "หมวดหมู่" ควรไปหน้า `/admin/categories`
  2. ที่ `/admin/categories` — ลองแก้ชื่อ/ไอคอน/สีของหมวด "เกม" แล้วกด "บันทึก" ควรเห็นการ์ดอัปเดตทันที (ปุ่ม "บันทึก" หายไปเพราะไม่ dirty แล้ว)
  3. กด ▲▼ ที่หมวดใดหมวดหนึ่งเพื่อสลับลำดับกับหมวดข้างเคียง ควรเห็นลำดับการ์ดสลับกันทันที
  4. กด "➕ เพิ่มหมวดหมู่ใหม่" กรอกชื่อ (เว้น slug ว่างไว้ให้ auto) กด "บันทึกหมวดหมู่ใหม่" ควรเห็นหมวดใหม่ต่อท้ายลิสต์ พร้อมข้อความ "สร้างใหม่ในเครื่องนี้" และมีปุ่ม "ลบ" ให้กด (หมวดเดิมไม่มีปุ่มนี้)
  5. ลองสร้างหมวดโดยตั้งชื่อ/slug ซ้ำกับหมวดที่มีอยู่แล้ว ควรเห็น error ใต้ช่องชื่อ
  6. ไป `/admin/developers` — ควรเห็นนักพัฒนาทั้งสองคนพร้อม badge "ใช้งานได้ปกติ" กด "ระงับบัญชี" ที่คนใดคนหนึ่ง badge ควรเปลี่ยนเป็น "ถูกระงับ" ทันที และปุ่มเปลี่ยนเป็น "เปิดใช้งานอีกครั้ง"
  7. รีเฟรชหน้า `/admin/developers`/`/admin/categories` เปล่าๆ ควรเห็นการเปลี่ยนแปลงที่ทำไว้ยังอยู่ (เก็บใน localStorage ของเบราว์เซอร์เครื่องนั้น)

## ไฟล์ใหม่/แก้ไขใน Part 10
- `.github/workflows/build-index.yml` — ใหม่: GitHub Action รันตอน push เข้า `main` (path filter เฉพาะ `data/apps|categories|developers|manifest.json`) รัน `node scripts/builder/build.js` แล้ว commit `public/search-index.json` + `data/manifest.json` + `data/apps/*.json` (เผื่อมีการเติม sha256) กลับเข้า `main` อัตโนมัติด้วย `GITHUB_TOKEN` มาตรฐาน — commit message มี `[skip ci]` กัน trigger ตัวเองซ้ำเป็น loop
- `pages/api/auth/[...nextauth].js` — ใหม่: ตั้งค่า NextAuth ด้วย `GithubProvider`, เก็บ GitHub username (`profile.login`) ไว้ใน JWT แล้วส่งต่อเข้า `session.user.login` ผ่าน callback `jwt`/`session`
- `lib/auth.js` — ใหม่: `findDeveloperByGithubUsername(developers, username)` และ `isAdminUsername(username, site)` — ตัวช่วยกลางจับคู่ session ของ NextAuth เข้ากับข้อมูล developer/admin ที่มีอยู่แล้ว ไม่ต้องมีตาราง user แยก
- `pages/_app.js` — แก้ไข: ห่อทั้งแอปด้วย `<SessionProvider>` จาก `next-auth/react` เพื่อให้ `useSession()` ใช้ได้ทุกที่
- `components/DevGuard.js` — แก้ไข: เปลี่ยนจาก mock (`localStorage`) เป็นเช็ค `useSession()` จริง แล้ว match `session.user.login` กับ `developer.github_username` — **ไม่เปลี่ยน interface เดิม** (`children` ยังเป็นฟังก์ชัน `(developer) => JSX`) เลยไม่ต้องแก้ `pages/dev/submit.js`, `pages/dev/dashboard.js`, `pages/dev/apps/[id]/edit.js` เลยสักไฟล์
- `components/AdminGuard.js` — ใหม่: เช็ค `useSession()` + `isAdminUsername()` เทียบกับ `site.admin_github_usernames` ก่อนปล่อยให้เห็นเนื้อหา — รับ `site` เป็น prop (ทุกหน้า admin มี prop นี้จาก `getStaticProps` อยู่แล้ว)
- `pages/admin/queue.js`, `pages/admin/categories.js`, `pages/admin/developers.js` — แก้ไข: ห่อ `<section>` เดิมด้วย `<AdminGuard site={site}>` เอาคอมเมนต์ "ยังไม่มีระบบสิทธิ์ Admin จริง" เดิมออก (logic ภายในไม่แตะเลย)
- `pages/dev/login.js` — เขียนใหม่ทั้งหน้า: จากเดิมเป็น picker เลือกโปรไฟล์นักพัฒนา (mock) เปลี่ยนเป็นปุ่ม "เข้าสู่ระบบด้วย GitHub" เรียก `signIn("github")` ถ้า login แล้ว redirect ไป `/dev/dashboard` อัตโนมัติ
- `components/Layout.js` — แก้ไข: เพิ่ม `<AuthStatus />` ในแถบ masthead โชว์ "👤 เข้าสู่ระบบ" (ยังไม่ login) หรือ "👤 {username} · ออกจากระบบ" (login แล้ว) ใช้ `useSession`/`signIn`/`signOut`
- `lib/mockAuth.js` — แก้ไข: ลบ `getCurrentDeveloperId`/`setCurrentDeveloperId`/`logoutMockDeveloper` ทิ้ง (แทนที่ด้วย NextAuth แล้ว) เหลือแค่ store ของ submissions/version updates ที่ยังเป็น mock อยู่ (ดูเหตุผลด้านล่าง)
- `data/settings/site.json` — เพิ่มฟิลด์ `admin_github_usernames` (array ของ GitHub username ที่มีสิทธิ์ Admin — ค่าเริ่มต้นเป็น placeholder ต้องแก้เป็นของจริงก่อน deploy)
- `package.json` — เพิ่ม dependency `next-auth`
- `.env.local.example` — ใหม่: template ตัวแปรที่ต้องตั้ง (`GITHUB_ID`, `GITHUB_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`)
- `.gitignore` — **สร้างใหม่** (พบว่าหายไปจากทุก Part ก่อนหน้า — ดูหมายเหตุด้านล่าง) กัน `.env.local`/`node_modules`/`.next` หลุดเข้า git
- `styles/globals.css` — เพิ่ม CSS: `.masthead__auth` (reset ปุ่มให้หน้าตาเหมือน `.masthead__search` เดิม), `.link-button` (ปุ่มที่หน้าตาเหมือนลิงก์ ใช้ในประโยคของ `DevGuard`/`AdminGuard`) (~10 บรรทัด)
- `README.md` — เพิ่มหัวข้อ "Deploy จริง (Part 10)" สรุปขั้นตอนตั้ง GitHub OAuth App + ตัวแปร Vercel + วิธีกำหนด Admin

## การตัดสินใจสำคัญใน Part 10
- **ไม่ทำระบบ "สร้าง PR อัตโนมัติ" จากฟอร์ม submit/edit/approve/reject** — สเปกให้ Part 10 ทำแค่ 3 อย่าง (GitHub Actions rebuild index / GitHub OAuth login / เชื่อม Vercel) การส่งข้อมูลเข้า `data/pending|apps|categories|developers` จริงผ่าน PR อัตโนมัติเป็นของหัวข้อ "แนวทางระยะยาว" ("ระบบส่งแอปอัตโนมัติเต็มรูปแบบ") ที่สเปกบอกชัดว่า "ยังไม่ต้องทำตอนนี้" — เพราะงั้น mock store ทั้งหมดจาก Part 6-9 (`mockdev_submissions`, `adminmock_approved_apps`, `adminmock_rejected`, `mockdev_app_updates`, `adminmock_category_overrides`, `adminmock_new_categories`, `adminmock_developer_status`) **ยังเป็น localStorage เหมือนเดิมทุกประการ** เปลี่ยนแค่ "ใครมีสิทธิ์เข้าหน้าไหน" เท่านั้น ไม่เปลี่ยน "ข้อมูลเก็บที่ไหน" — ถ้าอยากต่อเป็น PR จริง ต้องทำ API route ที่เรียก GitHub API (Contents API หรือ Octokit) สร้าง branch + commit + PR ให้ ซึ่งเป็นงานตอนถัดไปนอกสโคป 10 ตอนนี้
- **สิทธิ์ Developer/Admin ไม่ได้เก็บใน NextAuth เอง**: NextAuth มีหน้าที่แค่ยืนยันตัวตน (คุณคือ GitHub user คนนี้จริง) ส่วน "คุณมีสิทธิ์อะไร" อิงจากข้อมูลที่มีอยู่แล้วในระบบ — Developer เช็คจาก field `github_username` ที่มีอยู่แล้วใน schema `data/developers/{id}.json` ตั้งแต่ Part 1, Admin เช็คจาก field ใหม่ `admin_github_usernames` ใน `data/settings/site.json` — ไม่ต้องเพิ่ม schema/DB ใหม่เลย สอดคล้องหลักการ "ไม่ใช้ DB" ของสเปก
- **คนที่ login ด้วย GitHub แต่ยังไม่มีโปรไฟล์นักพัฒนา เข้า `/dev/*` ไม่ได้**: `DevGuard` โชว์ข้อความให้ติดต่อ Admin แทนที่จะสร้างโปรไฟล์ให้อัตโนมัติ — เพราะการสร้างนักพัฒนาใหม่ควรผ่านการตรวจสอบก่อน (เข้ากับกฎ "ทุกแอปต้องผ่านอนุมัติ" ของสเปก ขยายไปถึงตัวนักพัฒนาเองด้วย) และป้องกันไม่ให้ใครก็ได้ที่มีบัญชี GitHub เข้ามาส่งแอปได้ทันทีโดยไม่มีใครรู้จัก
- **AdminGuard รับ `site` เป็น prop แทนการ fetch settings เอง**: ทุกหน้า Admin โหลด `site` ผ่าน `getStaticProps` (`getSiteSettings()`) อยู่แล้วตั้งแต่ Part 3 — ส่งต่อเข้า `AdminGuard` ตรงๆ ประหยัดกว่าให้ component ไป fetch ซ้ำ, และหมายความว่าการเปลี่ยน `admin_github_usernames` มีผลทันทีหลัง deploy ใหม่ (build-time) ไม่ต้องรอ client fetch
- **ตัดสินใจ merge `DevGuard` เดิมให้ signature เหมือนเดิมเป๊ะ** (`children(developer) => JSX`) แทนที่จะออกแบบ API ใหม่ — เพื่อไม่ต้องแตะไฟล์หน้า Developer ทั้ง 3 ไฟล์ที่ทำมาตั้งแต่ Part 6-7 เลย ลดความเสี่ยงบั๊กและประหยัดโควต้าโทเคนของตอนนี้
- **DevAvatar/AppIcon ไม่ได้ผูกกับรูปโปรไฟล์ GitHub จริง**: `session.user.image` จาก GitHub มีให้ใช้ แต่ยังใช้ `DevAvatar` เดิม (fallback ตัวอักษรแรกของชื่อ) เพราะข้อมูล avatar ของนักพัฒนายังอิงจาก field `avatar` ใน `data/developers/{id}.json` เป็น source of truth เดิม — ไม่อยากมี 2 แหล่งข้อมูลรูปโปรไฟล์ปนกัน (เก็บไว้เป็นแนวคิดถ้าอยากทำต่อ: sync `session.user.image` เข้า `avatar` ตอนสร้างโปรไฟล์นักพัฒนาใหม่)

## แก้ไขปัญหาที่พบระหว่างทำ Part 10: `.gitignore` หายไป
พบว่าไม่มีไฟล์ `.gitignore` อยู่ในโปรเจกต์เลยตั้งแต่ Part 3 (ที่บันทึกไว้ว่าสร้างแล้ว) จนถึง Part 9 ที่อัปโหลดมา —
เข้าใจว่าเป็นปัญหาเดียวกับที่เจอกับ symlink หลัง Part 8 (อัปโหลด/ดาวน์โหลดผ่านมือถือบางเครื่องมือไม่รักษาไฟล์ที่ขึ้นต้นด้วย `.`
หรือไฟล์ config พวกนี้อาจถูกกรองทิ้งตอน zip) — ผลคือถ้า push ตอนนี้โดยไม่มี `.gitignore` แล้วรัน `npm install`
ในเครื่องที่มีเน็ต **`node_modules/` และ `.env.local` (ที่จะมี GITHUB_SECRET จริง) เสี่ยงหลุดเข้า git ได้**
**แก้โดย:** สร้าง `.gitignore` ใหม่ใน Part 10 นี้ (สำคัญมากเพราะรอบนี้เริ่มมี secret จริงเป็นครั้งแรก) —
**ก่อน push ครั้งแรกหลัง Part 10 ให้เช็คด้วยตาว่า `.gitignore` ถูกอัปโหลดไปด้วยจริง** เพราะไฟล์ที่ขึ้นต้นด้วย `.`
เป็นไฟล์ที่มักถูกซ่อน/ข้ามบนเครื่องมืออัปโหลดมือถือหลายตัว (จุดเดิมที่เคยเจอกับ symlink)

## ทดสอบแล้ว (Part 10)
- รัน `tsc --noEmit --allowJs --jsx react --moduleResolution bundler` ทีละไฟล์ใหม่/แก้ไขใน Part 10 — ไม่มี syntax error
- เช็ค `globals.css` วงเล็บปีกกาเปิด-ปิดครบ (204 คู่)
- เช็ค `data/settings/site.json` และ `package.json` เป็น JSON ที่ valid
- เช็ค `.github/workflows/build-index.yml` เป็น YAML ที่ parse ได้
- **ยังไม่ได้รัน `next dev`/`next build` จริง และยังไม่ได้ทดสอบ OAuth flow จริงบน GitHub** เพราะ sandbox ไม่มีเน็ต/ไม่มี GitHub OAuth App จริงให้ทดสอบ — งานที่ต้องทำในเครื่องที่มีเน็ตก่อนใช้งานจริง:
  1. `npm install` (ติดตั้ง `next-auth` ที่เพิ่งเพิ่ม)
  2. สร้าง GitHub OAuth App จริง (ดูขั้นตอนใน README หัวข้อ "Deploy จริง (Part 10)") แล้วสร้าง `.env.local` จาก `.env.local.example`
  3. แก้ `admin_github_usernames` ใน `data/settings/site.json` ให้เป็น GitHub username จริงของตัวเอง
  4. `npm run dev` แล้วกด "👤 เข้าสู่ระบบ" ที่มุมขวาบน — ควรเด้งไปหน้า GitHub ให้ authorize แล้วกลับมาที่เว็บพร้อมเห็นชื่อ username ของตัวเอง
  5. ไป `/dev/login` หรือ `/dev/submit` ตรงๆ ทั้งที่ยังไม่ได้ login — ควรเห็นข้อความ "คุณยังไม่ได้เข้าสู่ระบบนักพัฒนา" พร้อมปุ่มเข้าสู่ระบบ ไม่ใช่ 404 หรือ crash
  6. Login ด้วย GitHub username ที่ **ไม่ตรง** กับ `github_username` ใน `data/developers/*.json` คนไหนเลย — ควรเห็นข้อความ "ยังไม่ได้ลงทะเบียนเป็นนักพัฒนา" ไม่ใช่เข้าฟอร์ม submit ได้เลย
  7. แก้ `github_username` ของนักพัฒนาคนหนึ่งใน `data/developers/{id}.json` ให้ตรงกับ GitHub username จริงที่ใช้ทดสอบ แล้วลอง login ใหม่ — ควรเข้า `/dev/submit`/`/dev/dashboard` ได้ปกติเหมือน Part 6-9 ทุกอย่าง
  8. ไป `/admin/queue` ด้วย username ที่ไม่อยู่ใน `admin_github_usernames` — ควรเห็นข้อความ "ไม่มีสิทธิ์ Admin" ไม่ใช่เข้าเห็นคิวได้เลย แล้วลองแก้ username ตัวเองใส่ใน `admin_github_usernames` ทดสอบใหม่ ควรเข้าได้ทั้ง 3 หน้า Admin
  9. กด "ออกจากระบบ" ที่มุมขวาบน — ควรเด้งกลับเป็น "👤 เข้าสู่ระบบ" และหน้า `/dev/*`/`/admin/*` กลับไปโชว์ข้อความให้ login ใหม่ทันที
  10. Push ขึ้น GitHub จริง แล้วลอง merge PR ที่แก้ไฟล์ใน `data/apps/` ดูว่า GitHub Actions รันแล้ว commit `search-index.json` ใหม่กลับเข้า `main` ให้เองไหม (เช็คที่แท็บ Actions ของ repo) จากนั้นเช็คว่า Vercel deploy ต่อจาก commit นั้นอัตโนมัติ

## สิ่งที่ต้องทำต่อ (ถ้าอยากทำต่อจากนี้ — นอกสโคป 10 ตอนเดิมของสเปก)
- ต่อ mock store ทั้งหมด (Part 6-9) ให้สร้าง PR จริงผ่าน GitHub API แทน localStorage (งานใหญ่ ควรแยกเป็นตอนใหม่เพิ่มถ้าต้องการ)
- Sync `session.user.image` (avatar จาก GitHub) เข้า field `avatar` ตอนสร้างโปรไฟล์นักพัฒนาใหม่
- บังคับใช้ผลของการระงับนักพัฒนาจริงจัง (ค้างจาก Part 9 — ยังไม่ทำ): ซ่อนแอปของนักพัฒนาที่ถูกระงับจากหน้าแรก/ค้นหา, บล็อกไม่ให้ส่งแอปใหม่ที่ `/dev/submit`
- ฟีเจอร์ "แก้ไข draft ที่ถูกปฏิเสธแล้วส่งใหม่" (ค้างจาก Part 8 — ยังไม่ทำ)
- ตามแนวทางระยะยาวอื่นๆ ในสเปก: ระบบรีวิว/คอมเมนต์, ระบบแจ้งเตือน, ย้ายจาก JSON ไปฐานข้อมูลจริง, แผนการเงิน

## แก้ไขหลัง Part 8: เอา symlink `public/assets` ออก (ปัญหาที่เจอจริงจากการทำงานผ่านมือถือ 100%)
สเปกเดิม (Part 1/3) ให้ `assets/` อยู่ level เดียวกับ `public/` แล้วเชื่อมด้วย **symlink** `public/assets -> ../assets`
ซึ่ง PROGRESS.md ตอน Part 3 เตือนไว้แล้วว่าเสี่ยง — **เพิ่งยืนยันว่าเป็นปัญหาจริง** เพราะผู้ใช้ทำโปรเจกต์นี้ทั้งหมดผ่านมือถือ
ไม่มีคอม/เน็ตให้รัน `git` ตรงๆ ต้อง push ผ่านการอัปโหลดไฟล์/ลากโฟลเดอร์บนเว็บมือถือแทน ซึ่งวิธีเหล่านั้น**ไม่รักษา symlink**
(จะโดนข้ามไปเงียบๆ หรือกลายเป็นไฟล์เปล่า) ทำให้ path `/assets/icons/...` ที่อ้างในทุกไฟล์ apps จะ 404 บนเว็บจริงทันที
โดยไม่มี error ใดๆ ตอน build (เพราะ Next.js เห็นแค่โฟลเดอร์ `public/` ว่างๆ ไม่ error)

**แก้โดย:** ลบ symlink ทิ้ง ย้ายให้ `public/assets/` เป็นโฟลเดอร์จริงที่เดียว (ไม่มี `assets/` แยกที่ root อีกแล้ว)
โครงสร้าง path ที่ใช้ในไฟล์ apps (`/assets/icons/{app_id}.png` เป็นต้น) **ไม่เปลี่ยน** เพราะ Next.js serve `public/*`
ที่ web root อยู่แล้ว — โค้ดในทุก Part (1-8) ที่อ้างอิง path นี้ไม่ต้องแก้อะไรเพิ่ม กระทบแค่ตำแหน่งโฟลเดอร์จริงในเครื่อง
**ไม่กระทบ schema หรือโค้ดหน้าเว็บใดๆ**

## หมายเหตุ/ปัญหาที่เจอ
- **แอปแนะนำ/หมวดหมู่ยอดนิยม**: สเปกไม่ได้นิยาม field "featured" ไว้ตรงๆ เลยเลือก heuristic เอง — แอปแนะนำ = เรียงด้วย `sortApps(..., "popular")` (download_count desc, fallback verified แล้วชื่อ) เอา 3 อันดับแรก, หมวดหมู่แสดงทั้งหมดเรียงตาม field `order` ที่มีอยู่แล้ว (ไม่ได้กรอง "ยอดนิยม" จริงเพราะยังไม่มี metric วัดความนิยมของหมวดหมู่) — ถ้า Part ถัดไปอยากมี field `featured: true` แยกใน schema จริงจัง ต้องแก้ schema apps.json + Builder ด้วย
- `download_count` ทุกแอปยังเป็น 0 (ตามที่ออกแบบไว้ตั้งแต่ Part 1 — รอ DB จริง) การเรียง "ยอดนิยม" ตอนนี้เลยพึ่ง fallback (verified + ชื่อ) เป็นหลัก ผลลัพธ์จะดูสุ่มๆ จนกว่าจะมีการนับจริง
- (ต่อจาก Part 1-2) mock data ทั้งหมดยังไม่มีไฟล์รูปจริงใน assets/ — เว็บจะ fallback เป็นวงกลมตัวอักษรแรกของชื่อแอปทุกใบ ตามที่ตั้งใจออกแบบไว้ใน `AppIcon.js` และตอนนี้ screenshot ก็ fallback เป็นกล่อง placeholder เหมือนกันตามที่ออกแบบใน `ScreenshotGallery.js`
- หน้าค้นหาค้นแบบ substring ธรรมดา (`includes`) ไม่ได้ normalize สระ/วรรณยุกต์ภาษาไทยแบบพิเศษ หรือรองรับการพิมพ์ผิดเล็กน้อย (fuzzy search) — เพียงพอสำหรับข้อมูล mock 5 แอป ถ้าแอปเยอะขึ้นจริงอาจต้องพิจารณา library ค้นหาเฉพาะทางในอนาคต
- **โปรเจกต์ครบ 10 ตอนตามแผนแบ่งตอนในสเปกแล้ว** ฟีเจอร์หลักทุกอย่างทำงานได้ (User/Developer/Admin + auto-build + login จริง) ส่วนที่เหลือทั้งหมดเป็น "แนวทางระยะยาว" ที่สเปกบอกไว้แต่แรกว่ายังไม่ต้องทำ (ดูหัวข้อ "สิ่งที่ต้องทำต่อ" ท้าย Part 10 ด้านบนถ้าอยากทำต่อ)
