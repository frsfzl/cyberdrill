import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Shield, Target, BarChart3, GraduationCap } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-16 items-center justify-between border-b px-6">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6" />
          <span className="text-lg font-bold">CyberDrill</span>
        </div>
        <Link href="/dashboard">
          <Button>Go to Dashboard</Button>
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
        <div className="max-w-2xl text-center space-y-4">
          <h1 className="text-5xl font-bold tracking-tight">
            Security Awareness
            <br />
            <span className="text-primary">Through Simulation</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Run realistic phishing simulations to train your employees and
            measure organizational security awareness.
          </p>
          <Link href="/dashboard">
            <Button size="lg" className="mt-4">
              Get Started
            </Button>
          </Link>
        </div>

        <div className="grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-3 mt-12">
          {[
            {
              icon: Target,
              title: "Phishing Campaigns",
              desc: "Create and launch realistic phishing simulations with AI-generated content.",
            },
            {
              icon: BarChart3,
              title: "Real-time Analytics",
              desc: "Track employee interactions and measure security awareness metrics.",
            },
            {
              icon: GraduationCap,
              title: "Learning Moments",
              desc: "Educate employees with immediate feedback when they fall for simulations.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-lg border p-6 space-y-2"
            >
              <feature.icon className="h-8 w-8 text-primary" />
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
