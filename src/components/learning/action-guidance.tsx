import { CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const actions = [
  "Report suspicious emails to your IT/security team immediately.",
  "Never enter your credentials on pages you reached through email links.",
  "When in doubt, navigate directly to the service by typing the URL yourself.",
  "Enable multi-factor authentication (MFA) on all your accounts.",
  "If you think you entered credentials on a phishing page, change your password immediately.",
];

export function ActionGuidance() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          What You Should Do
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-3">
          {actions.map((action, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500/10 text-green-500 text-xs font-bold">
                {i + 1}
              </span>
              {action}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
