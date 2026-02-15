import { DisclosureBanner } from "@/components/learning/disclosure-banner";
import { RedFlagChecklist } from "@/components/learning/red-flag-checklist";
import { ActionGuidance } from "@/components/learning/action-guidance";
import { Shield } from "lucide-react";
import { updateInteractionState } from "@/lib/models/interaction";

export default async function LearnPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Track that the employee viewed the learning page
  try {
    await updateInteractionState(token, "LEARNING_VIEWED", {
      learning_viewed_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to track learning page view:", error);
  }

  return (
    <div className="min-h-screen bg-[#07070b]">
      <header className="flex h-16 items-center gap-2.5 border-b border-white/[0.06] px-6">
        <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center">
          <Shield className="h-4 w-4 text-blue-400" />
        </div>
        <span className="text-lg font-semibold text-white tracking-tight">Cyberdrill</span>
        <span className="text-sm text-neutral-500 ml-1">
          Security Awareness
        </span>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 p-6 pt-8">
        <DisclosureBanner />
        <RedFlagChecklist />
        <ActionGuidance />

        <div className="text-center text-sm text-neutral-500 pt-4 pb-8">
          <p>
            This simulation was conducted as part of your organization&apos;s
            security awareness program. If you have questions, please contact
            your IT security team.
          </p>
        </div>
      </main>
    </div>
  );
}
