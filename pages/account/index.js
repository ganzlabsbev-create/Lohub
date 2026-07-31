import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
import Layout from "../../components/Layout";
import DevAvatar from "../../components/DevAvatar";
import StateMessage from "../../components/StateMessage";
import { getSiteSettings } from "../../lib/site";
import { apiGet, apiPost } from "../../lib/apiClient";
import { formatDate } from "../../lib/format";
import { useSearchIndex } from "../../lib/useSearchIndex";

export async function getStaticProps() {
  return { props: { site: getSiteSettings() } };
}

const ROLE_LABEL = { member: "สมาชิก", developer: "นักพัฒนา", admin: "แอดมิน" };

// หน้าโปรไฟล์ผู้ใช้ที่ login แล้ว ใช้ร่วมกันทุก role (member/developer/admin)
// role/ข้อมูลจริงเชื่อจาก GET /api/profile เป็นหลัก ไม่คำนวณ role เองซ้ำฝั่ง client
// รายละเอียดเพิ่มเติมของ role "developer" (avatar/เว็บไซต์/จำนวนแอป) ดึงจาก search-index.json
// (แหล่งข้อมูลเดิมที่ทุกหน้าสาธารณะใช้อยู่แล้ว) — ไม่ได้เพิ่มการเรียก backend ใหม่
export default function AccountPage({ site }) {
  const { data: session, status } = useSession();

  return (
    <Layout site={site}>
      <section className="section dev-narrow">
        <div className="section__head">
          <h1>บัญชีของฉัน</h1>
        </div>

        {status === "loading" && (
          <StateMessage kind="loading">กำลังตรวจสอบสถานะเข้าสู่ระบบ...</StateMessage>
        )}

        {status !== "loading" && !session && (
          <StateMessage kind="empty">
            เข้าสู่ระบบเพื่อดูโปรไฟล์ของคุณ —{" "}
            <button type="button" className="link-button" onClick={() => signIn("github")}>
              เข้าสู่ระบบด้วย GitHub
            </button>
          </StateMessage>
        )}

        {session && <ProfilePanel />}
      </section>
    </Layout>
  );
}

function ProfilePanel() {
  const [state, setState] = useState({ loading: true, error: null, profile: null });
  const { data: searchIndex } = useSearchIndex();

  function load() {
    setState((s) => ({ ...s, loading: true, error: null }));
    apiGet("/api/profile")
      .then((data) => setState({ loading: false, error: null, profile: data }))
      .catch((err) => setState({ loading: false, error: err.message, profile: null }));
  }

  useEffect(() => {
    load();
  }, []);

  const { loading, error, profile } = state;

  if (loading) return <StateMessage kind="loading">กำลังโหลดโปรไฟล์...</StateMessage>;
  if (error) return <StateMessage kind="error">โหลดโปรไฟล์ไม่สำเร็จ: {error}</StateMessage>;
  if (!profile) return null;

  const { username, role, profile: memberRow } = profile;
  const displayName = memberRow?.display_name || username;
  const avatar = memberRow?.avatar_url;
  const verified = !!memberRow?.verified;
  const joinedAt = memberRow?.created_at || memberRow?.joined_at;

  // /api/profile คืน "role" เดียว ตามลำดับความสำคัญ admin > developer > member (ของเดิม, ห้ามแก้)
  // แต่บัญชีจริงอาจมีสถานะซ้อนกันได้ (เช่น เป็นทั้งแอดมินและมีโปรไฟล์นักพัฒนาอยู่แล้ว) —
  // เช็คสถานะ developer แยกต่างหากจาก search-index.json (ข้อมูลสาธารณะเดียวกับที่หน้า /developer ใช้)
  // เพื่อโชว์ทุกแผงที่เกี่ยวข้อง ไม่ผูกกับ role เดียวที่ backend ส่งมา (ไม่แตะ resolveRole/isAdminUsername)
  const isAdmin = role === "admin";
  const developerRecord = searchIndex?.developers.find(
    (d) => (d.github_username || "").toLowerCase() === username.toLowerCase()
  );
  const isDeveloper = role === "developer" || !!developerRecord;

  const statusLabels = [];
  if (isAdmin) statusLabels.push(ROLE_LABEL.admin);
  if (isDeveloper) statusLabels.push(ROLE_LABEL.developer);
  if (!statusLabels.length) statusLabels.push(ROLE_LABEL.member);

  return (
    <>
      <div className="account-head">
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt="" className="dev-avatar" width={72} height={72} />
        ) : (
          <div className="dev-avatar dev-avatar--fallback" style={{ width: 72, height: 72 }} aria-hidden="true">
            {displayName?.trim()?.[0]?.toUpperCase() || "?"}
          </div>
        )}
        <div>
          <p className="account-name">
            {displayName}
            {verified && (
              <span className="stamp stamp--inline" title="ยืนยันตัวตนแล้ว">
                ✓ verified
              </span>
            )}
          </p>
          <p className="account-role mono">
            @{username} · {statusLabels.join(" · ")}
            {joinedAt ? ` · เข้าร่วมเมื่อ ${formatDate(joinedAt)}` : ""}
          </p>
        </div>
        <Link
          href="/account/settings"
          className="icon-btn"
          aria-label="ตั้งค่า"
          title="ตั้งค่า"
          style={{ marginLeft: "auto" }}
        >
          ⚙️
        </Link>
      </div>

      {isDeveloper ? (
        <DeveloperProfileSummary username={username} />
      ) : (
        role === "member" && <DeveloperRequestPanel />
      )}
      {isAdmin && <AdminQuickLinks />}
    </>
  );
}

// สรุปโปรไฟล์นักพัฒนาให้ดูเองในหน้าบัญชี — จับคู่ด้วย github_username กับ search-index.json
// (ไฟล์เดียวกับที่หน้า /developer/{id} ใช้อยู่แล้ว จึงข้อมูลตรงกันเป๊ะ ไม่ต้องมี backend ใหม่)
function DeveloperProfileSummary({ username }) {
  const { loading, error, data } = useSearchIndex();

  if (loading) return <StateMessage kind="loading">กำลังโหลดโปรไฟล์นักพัฒนา...</StateMessage>;
  if (error) return <StateMessage kind="error">โหลดข้อมูลนักพัฒนาไม่สำเร็จ: {error}</StateMessage>;

  const developer = data?.developers.find(
    (d) => (d.github_username || "").toLowerCase() === username.toLowerCase()
  );

  if (!developer) {
    return (
      <p className="banner-note">
        บัญชีนี้เป็นนักพัฒนาแล้ว แต่ยังไม่พบโปรไฟล์นักพัฒนาในระบบ (อาจกำลังรอ build รอบถัดไปหลังอนุมัติ) —
        ลองรีเฟรชอีกครั้งภายหลัง หรือไปที่ <Link href="/dev/dashboard">Dashboard นักพัฒนา</Link>{" "}
        เพื่อจัดการแอปของคุณ
      </p>
    );
  }

  const apps = data.apps.filter((a) => a.developer_id === developer.id);

  return (
    <section className="section">
      <div className="section__head">
        <h2>โปรไฟล์นักพัฒนาของคุณ</h2>
      </div>

      <div className="dev-head" style={{ marginBottom: 16 }}>
        <DevAvatar developer={developer} size={56} />
        <div className="dev-head__info">
          <p className="account-name" style={{ margin: 0 }}>
            {developer.name}
            {developer.verified && (
              <span className="stamp stamp--inline" title="ยืนยันตัวตนแล้ว">
                ✓ verified
              </span>
            )}
          </p>
          <div className="dev-head__links">
            <Link href={`/developer/${developer.id}`}>👤 ดูหน้าโปรไฟล์สาธารณะ</Link>
            {developer.website && (
              <a href={developer.website} target="_blank" rel="noopener noreferrer">
                🔗 เว็บไซต์
              </a>
            )}
            <a
              href={`https://github.com/${developer.github_username}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              ◈ @{developer.github_username}
            </a>
          </div>
        </div>
      </div>

      <div className="meta-grid">
        <div>
          <span>สถานะบัญชี</span>
          <strong>{developer.status === "suspended" ? "ถูกระงับ" : "ใช้งานได้ปกติ"}</strong>
        </div>
        <div>
          <span>เข้าร่วมเมื่อ</span>
          <strong>{formatDate(developer.joined_at)}</strong>
        </div>
        <div>
          <span>จำนวนแอป</span>
          <strong>{apps.length} แอป</strong>
        </div>
        <div>
          <span>ช่องทางติดต่อ</span>
          <strong>{developer.contact || "-"}</strong>
        </div>
      </div>

      <p className="banner-note" style={{ marginTop: 16 }}>
        ไปที่ <Link href="/dev/dashboard">Dashboard นักพัฒนา</Link> เพื่ออัปเดตแอปที่มีอยู่ หรือ{" "}
        <Link href="/dev/submit">ส่งแอปใหม่</Link> เข้าคิวตรวจได้เลย
      </p>
    </section>
  );
}

// ย่อจากลิงก์แอดมินยาวๆ ทุกหน้าย่อย เหลือปุ่มเดียวไปหน้า /admin — เมนูย่อยแอดมิน
// (คิว/นักพัฒนา/หมวดหมู่/รายงาน/รีวิว/สมาชิก) ให้ไปอยู่ในหน้า /admin เอง ไม่ต้องแปะซ้ำไว้ที่ Account
function AdminQuickLinks() {
  return (
    <section className="section">
      <div className="section__head">
        <h2>แอดมิน</h2>
      </div>
      <div className="form-actions">
        <Link href="/admin" className="btn-primary">
          🛠 ไปที่ Admin Panel
        </Link>
      </div>
    </section>
  );
}

// สมัครเป็น Developer (เฉพาะ role === "member") — โชว์ฟอร์มถ้ายังไม่มีคำขอ/ถูกปฏิเสธ,
// ถ้ามีคำขอ pending อยู่แล้ว ให้ซ่อนฟอร์มแล้วโชว์สถานะรอตรวจ + รายละเอียดที่กรอกไว้แทนตามที่ระบุไว้
function DeveloperRequestPanel() {
  const [state, setState] = useState({ loading: true, error: null, request: null });
  const [form, setForm] = useState({
    reason: "",
    portfolio_url: "",
    display_name: "",
    website: "",
    contact: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  function loadRequest() {
    setState((s) => ({ ...s, loading: true, error: null }));
    apiGet("/api/developer-requests")
      .then((data) => setState({ loading: false, error: null, request: data.request }))
      .catch((err) => setState({ loading: false, error: err.message, request: null }));
  }

  useEffect(() => {
    loadRequest();
  }, []);

  const { loading, error, request } = state;

  function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    apiPost("/api/developer-requests", form)
      .then(() => loadRequest())
      .catch((err) => setSubmitError(err.message))
      .finally(() => setSubmitting(false));
  }

  if (loading) return <StateMessage kind="loading">กำลังโหลดสถานะคำขอ...</StateMessage>;
  if (error) return <StateMessage kind="error">โหลดสถานะไม่สำเร็จ: {error}</StateMessage>;

  if (request && request.status === "pending") {
    return (
      <section className="section">
        <div className="section__head">
          <h2>คำขอเป็น Developer ของคุณ</h2>
        </div>
        <p className="banner-note">
          อยู่ระหว่างรอตรวจ — ส่งเมื่อ {formatDate(request.created_at)}
        </p>
        {request.reason && (
          <p className="dev-row__text">
            <strong>เหตุผล:</strong> {request.reason}
          </p>
        )}
        {request.portfolio_url && (
          <p className="dev-row__text">
            <strong>ผลงาน:</strong>{" "}
            <a href={request.portfolio_url} target="_blank" rel="noreferrer">
              {request.portfolio_url}
            </a>
          </p>
        )}
        {request.website && (
          <p className="dev-row__text">
            <strong>เว็บไซต์:</strong> {request.website}
          </p>
        )}
        {request.contact && (
          <p className="dev-row__text">
            <strong>ช่องทางติดต่อ:</strong> {request.contact}
          </p>
        )}
      </section>
    );
  }

  return (
    <section className="section">
      <div className="section__head">
        <h2>สมัครเป็น Developer</h2>
      </div>
      <p className="dev-row__text">
        อยากลงแอปของคุณเองในเว็บนี้? สมัครอัพเกรดเป็น Developer — คำขอจะไปรอแอดมินตรวจและอนุมัติ
      </p>
      <p className="dev-row__text" style={{ fontSize: "0.85rem" }}>
        มีโปรไฟล์นักพัฒนาอยู่แล้วในระบบ (บัญชี GitHub อื่น)?{" "}
        <button type="button" className="link-button" onClick={() => signIn("github")}>
          เข้าสู่ระบบนักพัฒนา
        </button>
      </p>

      {request?.status === "rejected" && (
        <p className="banner-note">
          คำขอก่อนหน้าถูกปฏิเสธ{request.admin_note ? ` — เหตุผล: ${request.admin_note}` : ""} —
          แก้ไขแล้วส่งคำขอใหม่ได้ด้านล่าง
        </p>
      )}

      <form onSubmit={submit}>
        <label className="form-field">
          <span className="form-field__label">เหตุผลที่อยากเป็น Developer</span>
          <textarea
            rows={3}
            value={form.reason}
            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            required
          />
        </label>
        <label className="form-field">
          <span className="form-field__label">ลิงก์ผลงาน (portfolio)</span>
          <input
            type="url"
            value={form.portfolio_url}
            onChange={(e) => setForm((f) => ({ ...f, portfolio_url: e.target.value }))}
            placeholder="https://..."
          />
        </label>
        <label className="form-field">
          <span className="form-field__label">ชื่อที่อยากให้แสดงบนโปรไฟล์นักพัฒนา (ไม่บังคับ)</span>
          <input
            type="text"
            value={form.display_name}
            onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
            placeholder="เว้นว่างไว้ = ใช้ชื่อจาก GitHub"
          />
        </label>
        <label className="form-field">
          <span className="form-field__label">เว็บไซต์ (ไม่บังคับ)</span>
          <input
            type="url"
            value={form.website}
            onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
            placeholder="https://..."
          />
        </label>
        <label className="form-field">
          <span className="form-field__label">ช่องทางติดต่อ เช่นอีเมล (ไม่บังคับ)</span>
          <input
            type="text"
            value={form.contact}
            onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))}
          />
        </label>
        <p className="dev-row__text" style={{ fontSize: "0.8rem" }}>
          ถ้าอนุมัติ ระบบจะเอาข้อมูลเหล่านี้ (หรือดึงจากโปรไฟล์ GitHub ถ้าเว้นว่าง) ไปสร้างโปรไฟล์นักพัฒนาให้อัตโนมัติ
        </p>
        {submitError && <span className="field-error">{submitError}</span>}
        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "กำลังส่ง..." : "ส่งคำขอ"}
          </button>
        </div>
      </form>
    </section>
  );
}
