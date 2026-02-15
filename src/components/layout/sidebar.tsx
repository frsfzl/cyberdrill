"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  Users,
  Target,
  BarChart3,
  Shield,
  AlertTriangle,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/drills", label: "Drills", icon: Target },
  { href: "/dashboard/employees", label: "Employees", icon: Users },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/alerts", label: "Alerts", icon: AlertTriangle },
];

export function Sidebar() {
  const pathname = usePathname();
  const [activeIndex, setActiveIndex] = useState(0);
  const [blobStyle, setBlobStyle] = useState({
    top: 0,
    height: 0,
    opacity: 0,
  });
  const navRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  // Update active index based on pathname
  useEffect(() => {
    const index = navItems.findIndex(
      (item) =>
        pathname === item.href ||
        (item.href !== "/dashboard" && pathname.startsWith(item.href))
    );
    if (index !== -1) {
      setActiveIndex(index);
    }
  }, [pathname]);

  // Update blob position when active index changes
  useEffect(() => {
    const activeItem = itemRefs.current[activeIndex];
    if (activeItem && navRef.current) {
      const navRect = navRef.current.getBoundingClientRect();
      const itemRect = activeItem.getBoundingClientRect();
      setBlobStyle({
        top: itemRect.top - navRect.top,
        height: itemRect.height,
        opacity: 1,
      });
    }
  }, [activeIndex]);

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-white/[0.06] bg-[#0a0a0f]">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 px-6 border-b border-white/[0.06]">
        <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 flex items-center justify-center overflow-hidden">
          <Shield className="h-4 w-4 text-blue-400" />
        </div>
        <span 
          className="text-lg text-white/90 tracking-tight"
          style={{
            fontFamily: 'var(--font-playfair)',
            fontStyle: 'italic',
            fontWeight: 400,
          }}
        >
          CyberDrill
        </span>
      </div>

      {/* Navigation */}
      <nav ref={navRef} className="flex-1 space-y-1 p-4 relative">
        {/* Liquid Blob Background */}
        <div
          className="absolute left-4 right-4 bg-white/[0.08] rounded-xl pointer-events-none transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          style={{
            top: blobStyle.top,
            height: blobStyle.height,
            opacity: blobStyle.opacity,
            transform: 'scale(1)',
          }}
        >
          {/* Liquid effect layers */}
          <div 
            className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-blue-500/10 rounded-xl opacity-50"
            style={{
              animation: 'liquid-pulse 2s ease-in-out infinite',
            }}
          />
          <div 
            className="absolute -inset-px bg-blue-500/20 rounded-xl blur-sm"
            style={{
              animation: 'liquid-glow 3s ease-in-out infinite',
            }}
          />
        </div>

        {/* Navigation Items */}
        {navItems.map((item, index) => {
          const isActive = index === activeIndex;
          return (
            <Link
              key={item.href}
              href={item.href}
              ref={(el) => { itemRefs.current[index] = el; }}
              className="relative flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-300 rounded-xl group"
              onMouseEnter={() => {
                // Subtle preview effect could go here
              }}
            >
              {/* Icon with animation */}
              <div 
                className={`relative w-5 h-5 flex items-center justify-center transition-all duration-300 ${
                  isActive ? 'scale-110' : 'scale-100'
                }`}
              >
                <item.icon 
                  className={`h-4 w-4 transition-all duration-300 ${
                    isActive 
                      ? 'text-white' 
                      : 'text-neutral-500 group-hover:text-neutral-300'
                  }`} 
                />
                {/* Glow effect for active icon */}
                {isActive && (
                  <div className="absolute inset-0 bg-blue-400/30 blur-lg rounded-full animate-pulse" />
                )}
              </div>

              {/* Label */}
              <span 
                className={`transition-all duration-300 ${
                  isActive 
                    ? 'text-white translate-x-0.5' 
                    : 'text-neutral-400 group-hover:text-neutral-200'
                }`}
              >
                {item.label}
              </span>

              {/* Active indicator dot */}
              {isActive && (
                <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              )}

              {/* Hover glow effect */}
              {!isActive && (
                <div className="absolute inset-0 bg-white/[0.02] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-4 border-t border-white/[0.06]">
        <div className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <p className="text-xs text-neutral-500 mb-1">Current Plan</p>
          <p className="text-sm font-medium text-white">Professional</p>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes liquid-pulse {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.02);
          }
        }
        
        @keyframes liquid-glow {
          0%, 100% {
            opacity: 0.4;
            filter: blur(4px);
          }
          33% {
            opacity: 0.7;
            filter: blur(6px);
          }
          66% {
            opacity: 0.5;
            filter: blur(5px);
          }
        }
      `}</style>
    </aside>
  );
}
