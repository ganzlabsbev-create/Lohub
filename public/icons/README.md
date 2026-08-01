# วางไฟล์โลโก้ที่นี่

ระบบอ้างอิงชื่อไฟล์เหล่านี้แล้ว (ยังไม่มีไฟล์จริง — ใส่เพิ่มเองได้เลย ไม่ต้องแก้โค้ด):

| ไฟล์ | ใช้ที่ไหน | ขนาดแนะนำ |
|---|---|---|
| `public/icons/lohub-192.png` | PWA manifest + favicon | 192x192 |
| `public/icons/lohub-512.png` | PWA manifest | 512x512 |
| `public/icons/lohub-maskable-192.png` | PWA manifest (maskable, ถ้ามี) | 192x192 |
| `public/icons/lohub-maskable-512.png` | PWA manifest (maskable, ถ้ามี) | 512x512 |
| `public/brand/lohub-logo.svg` | โลโก้ในแถบเมนูบน (masthead) และ side drawer | SVG (แนะนำ ~64x64 viewBox) |

ถ้ายังไม่มีไฟล์ `public/brand/lohub-logo.svg` ระบบจะ fallback แสดงเป็นตัวอักษร ▣ แทนโดยอัตโนมัติ (ดู `components/BrandMark.js`)
ไม่ต้องแก้โค้ดใดๆ เพิ่ม แค่วางไฟล์ตามชื่อ/ตำแหน่งด้านบนแล้วรูปจะขึ้นเอง
