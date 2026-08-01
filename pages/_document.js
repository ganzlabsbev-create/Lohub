import { Html, Head, Main, NextScript } from "next/document";

// _document.js ใหม่ (เดิมไม่มีไฟล์นี้) — ใส่ค่าที่ต้องอยู่ระดับ <html>/<head> ของทุกหน้า
// เพื่อรองรับ PWA: manifest.json, ไอคอนสำหรับ home screen, และ theme-color
// ไม่แตะ business logic ใดๆ — เป็นแค่ static markup ของ document shell
export default function Document() {
  return (
    <Html lang="th">
      <Head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icons/lohub-192.png" sizes="192x192" type="image/png" />
        <link rel="apple-touch-icon" href="/icons/lohub-192.png" />
        <meta name="theme-color" content="#16171C" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
