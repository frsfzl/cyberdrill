"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LightRays } from "@/components/ui/light-rays";
import { 
  ArrowUpRight,
  Shield,
  Mail,
  Phone,
  BarChart3,
  Users,
  Lock,
  Zap,
  Check,
  ArrowRight,
  Target,
  AlertTriangle,
  GraduationCap,
  LineChart,
  Twitter,
  Linkedin,
  Github
} from "lucide-react";

export default function CyberdrillPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      {/* Background gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d0d12] via-[#0a0a0f] to-[#0a0a0f]" />
        <div className="absolute bottom-0 left-0 right-0 h-[500px] bg-gradient-to-t from-blue-950/5 to-transparent" />
      </div>

      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 py-4">
        <nav className="max-w-6xl mx-auto bg-[#111118]/60 backdrop-blur-xl rounded-full border border-white/[0.06] px-2 py-1.5 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1.5 px-4 py-2">
            <img src="/cyberdrill_logo.png" alt="Cyberdrill" className="w-8 h-8 object-contain" />
            <span className="text-lg font-semibold text-white tracking-tight">
              Cyberdrill
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {["Features", "How It Works", "Pricing", "About", "Contact"].map((link) => (
              <Link
                key={link}
                href={`#${link.toLowerCase().replace(/\s+/g, '-')}`}
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
                className="rounded-full bg-white hover:bg-neutral-200 text-black px-5 py-2 text-sm font-medium transition-all duration-200 hover:scale-105"
              >
                <span>Get Started</span>
                <ArrowUpRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        {/* Light Rays Effect */}
        <div className="absolute inset-0 z-0">
          <LightRays 
            raysOrigin="top-center"
            raysColor="#3b82f6"
            raysSpeed={0.8}
            lightSpread={1.2}
            rayLength={2.5}
            fadeDistance={1.2}
            saturation={0.8}
            followMouse={true}
            mouseInfluence={0.15}
          />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          {/* Main Headline - One Liner */}
          <h1 className="text-4xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-6xl font-normal tracking-tighter leading-[0.95] mb-16 text-white">
            <span
              className="block"
              style={{
                fontFamily: 'var(--font-playfair)',
                fontStyle: 'italic',
                fontWeight: 400,
              }}
            >
              Make Security Second Nature.
            </span>
          </h1>

          {/* Demo Video Placeholder */}
          <div className="relative max-w-4xl mx-auto">
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/[0.08] bg-[#0d0d12] group cursor-pointer">
              {/* Video thumbnail placeholder */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-violet-500/10" />
              
              {/* Center play button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/20 transition-all duration-300">
                  <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center">
                    <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-black border-b-[8px] border-b-transparent ml-1" />
                  </div>
                </div>
              </div>

              {/* Video label */}
              <div className="absolute bottom-6 left-6">
                <p className="text-sm text-neutral-400">Watch Demo</p>
                <p className="text-lg font-medium text-white">See Cyberdrill in action</p>
              </div>

              {/* Corner decoration */}
              <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-xs text-neutral-300">
                2:34
              </div>
            </div>
            
            {/* Glow effect */}
            <div className="absolute -inset-4 bg-blue-500/10 rounded-3xl blur-3xl -z-10 opacity-60" />
          </div>

          {/* Stats Row */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
            {[
              { value: "95%", label: "Phishing Detection" },
              { value: "10K+", label: "Employees Trained" },
              { value: "50%", label: "Risk Reduction" },
              { value: "24/7", label: "AI Monitoring" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl md:text-4xl font-semibold text-white mb-1">{stat.value}</p>
                <p className="text-sm text-neutral-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <p className="text-sm font-medium tracking-wider text-blue-400 uppercase mb-4">Features</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-white mb-4">
              Everything you need to{" "}
              <span 
                className="text-white/90"
                style={{
                  fontFamily: 'var(--font-playfair)',
                  fontStyle: 'italic',
                  fontWeight: 400,
                }}
              >
                build a human firewall
              </span>
            </h2>
            <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
              Comprehensive security awareness training through realistic simulations 
              and immediate education.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Mail className="h-5 w-5" />,
                title: "Email Phishing",
                description: "Deploy hyper-realistic phishing emails with cloned login pages. Track clicks, credential submissions, and reporting behavior."
              },
              {
                icon: <Phone className="h-5 w-5" />,
                title: "AI Voice Calls",
                description: "Launch sophisticated vishing attacks using AI-generated voices. Test employee responses to urgent phone-based social engineering."
              },
              {
                icon: <Target className="h-5 w-5" />,
                title: "Smart Targeting",
                description: "Customize attacks by department, role, or seniority. Create personalized pretexts that resonate with each employee."
              },
              {
                icon: <GraduationCap className="h-5 w-5" />,
                title: "Instant Training",
                description: "Deliver immediate micro-learning moments when employees fall for simulations. Turn mistakes into teachable moments."
              },
              {
                icon: <BarChart3 className="h-5 w-5" />,
                title: "Risk Analytics",
                description: "Track susceptibility rates, identify high-risk individuals, and measure improvement over time with detailed dashboards."
              },
              {
                icon: <Lock className="h-5 w-5" />,
                title: "Compliance Ready",
                description: "Meet SOC 2, ISO 27001, and GDPR requirements with comprehensive audit logs and reporting."
              }
            ].map((feature, i) => (
              <div
                key={i}
                className="group p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all duration-500"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <p className="text-sm font-medium tracking-wider text-blue-400 uppercase mb-4">How It Works</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-white mb-4">
              Launch a campaign in{" "}
              <span 
                className="text-white/90"
                style={{
                  fontFamily: 'var(--font-playfair)',
                  fontStyle: 'italic',
                  fontWeight: 400,
                }}
              >
                minutes, not months
              </span>
            </h2>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Import Employees",
                description: "Upload your team via CSV or integrate with your HRIS. We'll automatically sync departments and roles."
              },
              {
                step: "02",
                title: "Choose Attack Type",
                description: "Select email phishing, AI voice calls, or both. Pick from pre-built templates or create custom scenarios."
              },
              {
                step: "03",
                title: "Launch Campaign",
                description: "Our AI generates convincing content. Schedule delivery or launch immediately to test real-time awareness."
              },
              {
                step: "04",
                title: "Train & Improve",
                description: "Employees who fall for simulations get instant training. You get detailed risk reports and improvement tracking."
              }
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="text-5xl font-bold text-white/5 mb-4">{item.step}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">{item.description}</p>
                {i < 3 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-white/10 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Attack Types Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <p className="text-sm font-medium tracking-wider text-blue-400 uppercase mb-4">Attack Vectors</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-white mb-6">
                Test every{" "}
                <span 
                  className="text-white/90"
                  style={{
                    fontFamily: 'var(--font-playfair)',
                    fontStyle: 'italic',
                    fontWeight: 400,
                  }}
                >
                  angle of attack
                </span>
              </h2>
              <p className="text-lg text-neutral-400 mb-8">
                Modern threats come through multiple channels. Cyberdrill simulates them all 
                so your team is prepared for anything.
              </p>

              <div className="space-y-6">
                {[
                  {
                    icon: <Mail className="h-5 w-5" />,
                    title: "Email-Based Attacks",
                    features: ["Credential harvesting", "Malicious attachments", "Business email compromise", "CEO fraud"]
                  },
                  {
                    icon: <Phone className="h-5 w-5" />,
                    title: "Voice-Based Attacks",
                    features: ["AI-generated vishing calls", "IT support impersonation", "Urgent payment requests", "Account verification scams"]
                  }
                ].map((type, i) => (
                  <div key={i} className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                        {type.icon}
                      </div>
                      <h3 className="font-semibold text-white">{type.title}</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {type.features.map((feature, j) => (
                        <span key={j} className="px-2.5 py-1 rounded-full bg-white/[0.05] text-xs text-neutral-400">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Visual */}
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] bg-[#0d0d12]">
                {/* Mock Dashboard */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      <span className="font-semibold text-white">Active Campaigns</span>
                    </div>
                    <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs">3 Running</span>
                  </div>

                  {/* Campaign Cards */}
                  <div className="space-y-3">
                    {[
                      { name: "Q1 Security Awareness", type: "Email + Voice", targets: 156, rate: "12%" },
                      { name: "Executive Phishing Test", type: "Email Only", targets: 24, rate: "4%" },
                      { name: "New Hire Vishing", type: "Voice Only", targets: 18, rate: "22%" }
                    ].map((campaign, i) => (
                      <div key={i} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-white">{campaign.name}</p>
                          <p className="text-xs text-neutral-500">{campaign.type} • {campaign.targets} targets</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-white">{campaign.rate}</p>
                          <p className="text-xs text-neutral-500">click rate</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Mini Chart */}
                  <div className="mt-6 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <p className="text-xs text-neutral-500 mb-3">Susceptibility Trend (6 months)</p>
                    <div className="flex items-end gap-1 h-16">
                      {[45, 38, 32, 28, 22, 18].map((h, i) => (
                        <div key={i} className="flex-1 bg-blue-500/30 rounded-sm" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Glow */}
              <div className="absolute -inset-4 bg-blue-500/10 rounded-3xl blur-3xl -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* Security & Compliance Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-medium tracking-wider text-blue-400 uppercase mb-4">Security First</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-white mb-4">
              Enterprise-grade{" "}
              <span 
                className="text-white/90"
                style={{
                  fontFamily: 'var(--font-playfair)',
                  fontStyle: 'italic',
                  fontWeight: 400,
                }}
              >
                security & compliance
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Lock className="h-6 w-6" />,
                title: "Data Encryption",
                description: "AES-256 encryption at rest and TLS 1.3 in transit. Your employee data is always protected."
              },
              {
                icon: <Users className="h-6 w-6" />,
                title: "Privacy Controls",
                description: "Granular privacy settings. Employees can opt-out, and all data handling follows GDPR guidelines."
              },
              {
                icon: <LineChart className="h-6 w-6" />,
                title: "Audit Logging",
                description: "Complete audit trails of every campaign, interaction, and admin action for compliance reporting."
              }
            ].map((item, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mx-auto mb-4">
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-neutral-400">{item.description}</p>
              </div>
            ))}
          </div>

          {/* Compliance Badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 opacity-50">
            {["SOC 2 Type II", "ISO 27001", "GDPR Compliant", "HIPAA Ready"].map((badge, i) => (
              <div key={i} className="flex items-center gap-2 text-neutral-400">
                <Check className="h-4 w-4 text-green-400" />
                <span className="text-sm">{badge}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-normal tracking-tight text-white mb-6">
            Ready to test your{" "}
            <span 
              className="text-white/90"
              style={{
                fontFamily: 'var(--font-playfair)',
                fontStyle: 'italic',
                fontWeight: 400,
              }}
            >
              human firewall
            </span>
            ?
          </h2>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto mb-10">
            Join thousands of security teams using Cyberdrill to build a culture of security awareness. 
            Start your free trial today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard">
              <Button 
                size="lg"
                className="group rounded-xl bg-white hover:bg-neutral-200 text-black px-8 py-6 text-base font-semibold transition-all duration-300 hover:scale-105"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="#">
              <Button 
                size="lg"
                variant="outline"
                className="rounded-xl bg-transparent border-white/20 text-white hover:bg-white/5 px-8 py-6 text-base font-medium transition-all duration-300"
              >
                <span>Schedule Demo</span>
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-neutral-500">No credit card required. 14-day free trial.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-16 px-4 sm:px-6 lg:px-8 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-1.5 mb-4">
                <img src="/cyberdrill_logo.png" alt="Cyberdrill" className="w-8 h-8 object-contain" />
                <span className="text-lg font-semibold text-white tracking-tight">
                  Cyberdrill
                </span>
              </Link>
              <p className="text-sm text-neutral-500 mb-4">
                AI-powered phishing and vishing simulation for modern security teams.
              </p>
              <div className="flex items-center gap-3">
                <a href="#" className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/[0.1] transition-colors">
                  <Twitter className="h-4 w-4" />
                </a>
                <a href="#" className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/[0.1] transition-colors">
                  <Linkedin className="h-4 w-4" />
                </a>
                <a href="#" className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/[0.1] transition-colors">
                  <Github className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-3">
                {["Features", "Pricing", "Integrations", "Changelog", "API"].map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-sm text-neutral-500 hover:text-white transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Resources</h4>
              <ul className="space-y-3">
                {["Documentation", "Blog", "Case Studies", "Security", "Status"].map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-sm text-neutral-500 hover:text-white transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-3">
                {["About", "Careers", "Contact", "Privacy", "Terms"].map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-sm text-neutral-500 hover:text-white transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="pt-8 border-t border-white/[0.06] flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-neutral-600">
              © 2026 Cyberdrill. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link href="#" className="text-sm text-neutral-600 hover:text-neutral-400 transition-colors">
                Privacy Policy
              </Link>
              <Link href="#" className="text-sm text-neutral-600 hover:text-neutral-400 transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
