import { NAV_ITEMS } from "@/lib/constants";

export function getPageTitle(pathname: string) {
  const matched = NAV_ITEMS.find((item) => pathname === item.href || item.match?.includes(pathname));
  return matched?.label ?? "Painel";
}
