// ไอคอน SVG กลาง — เส้นบาง เรียบ สีเดียว (currentColor) ให้คุมโทนได้จากที่เรียกใช้
// น้ำหนักเส้นเท่ากันทั้งชุด (strokeWidth 1.8) เพื่อความสอดคล้องกันทั้งเว็บ
function Svg({ children, size = 20, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconMenu = (p) => (
  <Svg {...p}><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="14" y2="17" /></Svg>
);

export const IconClose = (p) => (
  <Svg {...p}><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></Svg>
);

export const IconSearch = (p) => (
  <Svg {...p}><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.2" y2="16.2" /></Svg>
);

export const IconHome = (p) => (
  <Svg {...p}><path d="M4 11.5 12 4l8 7.5" /><path d="M6 10v9h12v-9" /></Svg>
);

export const IconGrid = (p) => (
  <Svg {...p}><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></Svg>
);

export const IconUpload = (p) => (
  <Svg {...p}><path d="M12 16V4" /><path d="M7 9l5-5 5 5" /><path d="M5 16v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" /></Svg>
);

export const IconDashboard = (p) => (
  <Svg {...p}><rect x="4" y="4" width="7" height="10" rx="1.5" /><rect x="13" y="4" width="7" height="6" rx="1.5" /><rect x="13" y="12" width="7" height="8" rx="1.5" /><rect x="4" y="16" width="7" height="4" rx="1.5" /></Svg>
);

export const IconSettings = (p) => (
  <Svg {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 13.5a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.04 1.56V19.5a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.04-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.04H4.5a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.56-1.04 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H10.6A1.7 1.7 0 0 0 11.64 4.6V4.5a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1.04 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.03a1.7 1.7 0 0 0 1.56 1.04h.1a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.56 1.04z" /></Svg>
);

export const IconInfo = (p) => (
  <Svg {...p}><circle cx="12" cy="12" r="9" /><line x1="12" y1="11" x2="12" y2="16" /><circle cx="12" cy="7.6" r="0.9" fill="currentColor" stroke="none" /></Svg>
);

export const IconShield = (p) => (
  <Svg {...p}><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" /></Svg>
);

export const IconUser = (p) => (
  <Svg {...p}><circle cx="12" cy="8.5" r="3.5" /><path d="M4.5 20c1.4-3.6 4.3-5.5 7.5-5.5s6.1 1.9 7.5 5.5" /></Svg>
);

export const IconChevronDown = (p) => (
  <Svg {...p}><path d="M6 9l6 6 6-6" /></Svg>
);

export const IconCheck = (p) => (
  <Svg {...p}><path d="M4 12.5l5 5L20 6.5" /></Svg>
);

export const IconDownload = (p) => (
  <Svg {...p}><path d="M12 4v11" /><path d="M7 11l5 5 5-5" /><path d="M5 19.5h14" /></Svg>
);

export const IconExternal = (p) => (
  <Svg {...p}><path d="M9 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" /><path d="M14 4h6v6" /><path d="M20 4 10.5 13.5" /></Svg>
);

export const IconCode = (p) => (
  <Svg {...p}><path d="M8.5 8 4 12.5 8.5 17" /><path d="M15.5 8 20 12.5 15.5 17" /><line x1="13.5" y1="5.5" x2="10.5" y2="19.5" /></Svg>
);

export const IconImage = (p) => (
  <Svg {...p}><rect x="3.5" y="4.5" width="17" height="15" rx="2" /><circle cx="9" cy="10" r="1.6" fill="currentColor" stroke="none" /><path d="M4.5 17.5 9.5 12.5 13 16l3-3 3.5 3.5" /></Svg>
);

export const IconLogout = (p) => (
  <Svg {...p}><path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" /><path d="M15 16l4-4-4-4" /><line x1="19" y1="12" x2="9" y2="12" /></Svg>
);
