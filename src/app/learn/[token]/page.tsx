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
    <div className="min-h-screen bg-background">
      <header className="flex h-16 items-center gap-2 border-b px-6">
        <Shield className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold">CyberDrill</span>
        <span className="text-sm text-muted-foreground ml-2">
          Security Awareness
        </span>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 p-6">
        <DisclosureBanner />
        <RedFlagChecklist />
        <ActionGuidance />

        <div className="text-center text-sm text-muted-foreground pt-4">
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
