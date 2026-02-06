/* ──────────────────────────────────────────────────────────
 * @subfy/ui — Design System
 *
 * All components, utilities, and types are re-exported
 * from this barrel file.
 * ──────────────────────────────────────────────────────── */

/* ── Utilities ────────────────────────────────────────── */
export { cn } from "./lib/utils";

/* ── Primitives ───────────────────────────────────────── */
export { Button, buttonVariants, type ButtonProps } from "./components/button";
export {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "./components/card";
export { Badge, badgeVariants, type BadgeProps } from "./components/badge";
export { Input, SearchInput } from "./components/input";
export { Separator } from "./components/separator";
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "./components/table";

/* ── Composite ────────────────────────────────────────── */
export { StatCard, type StatCardProps } from "./components/stat-card";
export { PageHeader, type PageHeaderProps } from "./components/page-header";
export {
  RevenueChart,
  type RevenueChartProps,
  type RevenueChartDataPoint,
} from "./components/revenue-chart";

/* ── Feedback / Overlays ─────────────────────────────── */
export {
  Modal,
  ModalTrigger,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from "./components/modal";
export { Pagination, type PaginationProps } from "./components/pagination";

/* ── Layout ───────────────────────────────────────────── */
export {
  Sidebar,
  defaultSidebarItems,
  type SidebarItem,
  type SidebarProps,
} from "./components/sidebar";
export {
  Navbar,
  defaultNavbarLinks,
  type NavbarLink,
  type NavbarProps,
} from "./components/navbar";
export {
  DashboardLayout,
  type DashboardLayoutProps,
} from "./components/dashboard-layout";
