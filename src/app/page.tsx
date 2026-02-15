"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  ArrowUpRight,
  Twitter,
  Instagram,
  Facebook
} from "lucide-react";

export default function LandioPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      {/* Background gradient - grayish blue */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Top subtle glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-blue-900/10 rounded-full blur-[150px]" />
        {/* Bottom ambient */}
        <div className="absolute bottom-0 left-0 right-0 h-[500px] bg-gradient-to-t from-blue-950/10 to-transparent" />
        {/* Subtle noise texture */}
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 py-4">
        <nav className="max-w-5xl mx-auto bg-[#111118]/60 backdrop-blur-xl rounded-full border border-white/[0.06] px-2 py-1.5 flex items-center justify-between">
          {/* Logo with Playfair Display Italic */}
          <Link href="/" className="flex items-center gap-2.5 px-4 py-2">
            <div className="relative w-7 h-7 rounded-lg bg-gradient-to-br from-neutral-700 to-black border border-neutral-600/50 flex items-center justify-center overflow-hidden">
              <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-black flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-white" />
                </div>
              </div>
            </div>
            <span 
              className="text-lg text-white/90 tracking-tight"
              style={{
                fontFamily: 'var(--font-playfair)',
                fontStyle: 'italic',
                fontWeight: 400,
              }}
            >
              Landio
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {["Services", "Process", "Pricing", "Blog", "Contact"].map((link) => (
              <Link
                key={link}
                href="#"
                className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors duration-200"
              >
                {link}
              </Link>
            ))}
          </div>

          {/* CTA Button */}
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button 
                className="rounded-full bg-white/10 hover:bg-white/15 text-white border border-white/10 px-5 py-2 text-sm font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
                <span>Get Template</span>
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="max-w-5xl mx-auto text-center">
          {/* Main Headline - Exact Landio Style */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-normal tracking-tight leading-[1.1] mb-6 text-white">
            <span className="block">Automate Smarter. Grow</span>
            <span className="block">
              Faster.{" "}
              <span 
                className="text-white/90"
                style={{
                  fontFamily: 'var(--font-playfair)',
                  fontStyle: 'italic',
                  fontWeight: 400,
                }}
              >
                With AI.
              </span>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base md:text-lg text-neutral-400 max-w-xl mx-auto mb-10 leading-relaxed">
            AI Automation for Modern Businesses Made Simple
          </p>

          {/* CTA Button */}
          <Link href="/dashboard">
            <Button 
              size="lg"
              className="group rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white border border-white/10 px-8 py-6 text-base font-medium transition-all duration-300 hover:scale-105"
            >
              <span>Book A Free Call</span>
              <ArrowUpRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Button>
          </Link>

          {/* Social Icons */}
          <div className="mt-16 flex items-center justify-center gap-6">
            <a href="#" className="text-neutral-500 hover:text-white transition-colors duration-300">
              <Twitter className="h-5 w-5" />
            </a>
            <span className="text-neutral-700">|</span>
            <a href="#" className="text-neutral-500 hover:text-white transition-colors duration-300">
              <Instagram className="h-5 w-5" />
            </a>
            <span className="text-neutral-700">|</span>
            <a href="#" className="text-neutral-500 hover:text-white transition-colors duration-300">
              <Facebook className="h-5 w-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0f] to-transparent pointer-events-none" />
    </div>
  );
}
