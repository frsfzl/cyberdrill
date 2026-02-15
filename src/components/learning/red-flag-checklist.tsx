import { AlertTriangle } from "lucide-react";

const redFlags = [
  {
    title: "Unexpected urgency",
    desc: "Phishing emails often create a false sense of urgency to pressure you into acting quickly.",
  },
  {
    title: "Suspicious sender address",
    desc: "Always verify the sender's email address. Look for misspellings or unusual domains.",
  },
  {
    title: "Generic greetings",
    desc: "Legitimate emails from your organization typically address you by name.",
  },
  {
    title: "Mismatched URLs",
    desc: "Hover over links before clicking. The displayed text may differ from the actual URL.",
  },
  {
    title: "Requests for credentials",
    desc: "Legitimate services rarely ask you to enter credentials through an email link.",
  },
  {
    title: "Too good to be true",
    desc: "Offers of prizes, refunds, or rewards you didn't expect are common phishing tactics.",
  },
];

export function RedFlagChecklist() {
  return (
    <div className="rounded-xl bg-[#111118]/60 border border-white/[0.06] overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-white/[0.06]">
        <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
        </div>
        <h3 className="text-sm font-semibold text-white">Red Flags to Watch For</h3>
      </div>
      <div className="p-5">
        <div className="grid gap-3 md:grid-cols-2">
          {redFlags.map((flag) => (
            <div
              key={flag.title}
              className="flex gap-3 rounded-lg bg-white/[0.02] border border-white/[0.05] p-3 hover:bg-white/[0.04] transition-colors"
            >
              <div className="mt-1.5 h-2 w-2 rounded-full bg-red-400/80 shrink-0 ring-2 ring-red-400/20" />
              <div>
                <p className="font-medium text-sm text-neutral-200">{flag.title}</p>
                <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{flag.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
