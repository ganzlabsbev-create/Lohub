// ไอคอนกลางของทั้งเว็บ — มาตรฐานเดียวคือ Lucide (lucide-react) ทั้งหมด
// เดิมไฟล์นี้เป็น custom SVG แต่ละไอคอน ตอนนี้เปลี่ยนมา re-export จาก Lucide แทน
// คง "ชื่อ export" และ "หน้าตา props" (size, className, ฯลฯ) เดิมทุกตัว
// เพื่อไม่ต้องแก้ import/usage ในไฟล์อื่นทั้งเว็บ (Layout, SideDrawer, BottomNav, AppCard, ...)
// น้ำหนักเส้นเท่ากันทั้งชุด (strokeWidth 1.8) เพื่อความสอดคล้องกันทั้งเว็บ — เหมือนสเปกเดิม
import {
  Menu,
  X,
  Search,
  Home,
  LayoutGrid,
  Upload,
  LayoutDashboard,
  Settings,
  Info,
  Shield,
  User,
  ChevronDown,
  Check,
  Download,
  ExternalLink,
  Code2,
  Image as ImageIcon,
  LogOut,
} from "lucide-react";

const DEFAULT_PROPS = { size: 20, strokeWidth: 1.8 };

function withDefaults(LucideIcon) {
  return function Icon(props) {
    return <LucideIcon {...DEFAULT_PROPS} {...props} />;
  };
}

export const IconMenu = withDefaults(Menu);
export const IconClose = withDefaults(X);
export const IconSearch = withDefaults(Search);
export const IconHome = withDefaults(Home);
export const IconGrid = withDefaults(LayoutGrid);
export const IconUpload = withDefaults(Upload);
export const IconDashboard = withDefaults(LayoutDashboard);
export const IconSettings = withDefaults(Settings);
export const IconInfo = withDefaults(Info);
export const IconShield = withDefaults(Shield);
export const IconUser = withDefaults(User);
export const IconChevronDown = withDefaults(ChevronDown);
export const IconCheck = withDefaults(Check);
export const IconDownload = withDefaults(Download);
export const IconExternal = withDefaults(ExternalLink);
export const IconCode = withDefaults(Code2);
export const IconImage = withDefaults(ImageIcon);
export const IconLogout = withDefaults(LogOut);
