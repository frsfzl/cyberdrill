import { ShieldAlert } from "lucide-react";

export function DisclosureBanner() {
  return (
    <div className="rounded-xl bg-amber-500/[0.06] border border-amber-500/20 p-6 text-center">
      <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
        <ShieldAlert className="h-7 w-7 text-amber-400" />
      </div>
      <h2 className="text-2xl font-bold text-amber-400 mb-2">
        This Was a Security Awareness Test
      </h2>
      <p className="text-neutral-400 max-w-xl mx-auto text-sm leading-relaxed">
        The page you just interacted with was part of a phishing simulation
        conducted by your organization&apos;s security team. No credentials were
        captured or stored. This exercise helps identify areas where security
        training can be improved.
      </p>
    </div>
  );
}
