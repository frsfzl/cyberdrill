import { ShieldAlert } from "lucide-react";

export function DisclosureBanner() {
  return (
    <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-6 text-center">
      <ShieldAlert className="mx-auto h-12 w-12 text-amber-500 mb-4" />
      <h2 className="text-2xl font-bold text-amber-500 mb-2">
        This Was a Security Awareness Test
      </h2>
      <p className="text-muted-foreground max-w-xl mx-auto">
        The page you just interacted with was part of a phishing simulation
        conducted by your organization&apos;s security team. No credentials were
        captured or stored. This exercise helps identify areas where security
        training can be improved.
      </p>
    </div>
  );
}
