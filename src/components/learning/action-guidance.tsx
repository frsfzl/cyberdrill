import { CheckCircle2 } from "lucide-react";

const actions = [
  "Report suspicious emails to your IT/security team immediately.",
  "Never enter your credentials on pages you reached through email links.",
  "When in doubt, navigate directly to the service by typing the URL yourself.",
  "Enable multi-factor authentication (MFA) on all your accounts.",
  "If you think you entered credentials on a phishing page, change your password immediately.",
];

export function ActionGuidance() {
  return (
    <div className="rounded-xl bg-[#111118]/60 border border-white/[0.06] overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-white/[0.06]">
        <div className="w-7 h-7 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
        </div>
        <h3 className="text-sm font-semibold text-white">What You Should Do</h3>
      </div>
      <div className="p-5">
        <ol className="space-y-3">
          {actions.map((action, i) => (
            <li key={i} className="flex gap-3 text-sm text-neutral-300">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold">
                {i + 1}
              </span>
              <span className="pt-0.5 leading-relaxed">{action}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
