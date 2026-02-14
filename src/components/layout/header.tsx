"use client";

import { usePathname } from "next/navigation";

const titleMap: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/campaigns": "Campaigns",
  "/dashboard/employees": "Employees",
  "/dashboard/analytics": "Analytics",
};

export function Header() {
  const pathname = usePathname();

  const title =
    titleMap[pathname] ||
    (pathname.includes("/campaigns/new")
      ? "New Campaign"
      : pathname.includes("/campaigns/")
        ? "Campaign Details"
        : "Dashboard");

  return (
    <header className="flex h-16 items-center border-b border-border px-6">
      <h1 className="text-xl font-semibold">{title}</h1>
    </header>
  );
}
