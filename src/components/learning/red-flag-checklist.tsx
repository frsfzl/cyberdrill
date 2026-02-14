import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Red Flags to Watch For
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2">
          {redFlags.map((flag) => (
            <div key={flag.title} className="flex gap-3 rounded-md border p-3">
              <div className="mt-0.5 h-2 w-2 rounded-full bg-destructive shrink-0" />
              <div>
                <p className="font-medium text-sm">{flag.title}</p>
                <p className="text-xs text-muted-foreground">{flag.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
