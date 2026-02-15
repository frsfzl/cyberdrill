"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Phone,
  Clock,
  MessageSquare,
  Target,
  Brain,
  Shield
} from "lucide-react";
import type { CallAnalytics } from "@/types";

interface CallAnalyticsCardProps {
  analytics: CallAnalytics;
  callDuration?: number;
  recordingUrl?: string;
}

export function CallAnalyticsCard({ analytics, callDuration, recordingUrl }: CallAnalyticsCardProps) {
  const susceptibility = analytics["Phishing Susceptibility Analysis"];
  const redFlags = analytics["Red Flags Recognition"];
  const response = analytics["Employee Response Analysis"];
  const quality = analytics["Call Quality Metrics"];
  const training = analytics["Training Recommendations"];

  if (!susceptibility && !redFlags && !response && !quality && !training) {
    return null;
  }

  const getRiskColor = (level?: string) => {
    switch (level) {
      case "critical": return "text-red-600 bg-red-50 border-red-200";
      case "high": return "text-orange-600 bg-orange-50 border-orange-200";
      case "medium": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "low": return "text-green-600 bg-green-50 border-green-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="space-y-4">
      {/* Overall Summary */}
      {susceptibility && (
        <Card className={`border-2 ${getRiskColor(susceptibility.riskLevel)}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {susceptibility.fellForPhish ? (
                  <XCircle className="h-8 w-8 text-red-500" />
                ) : (
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                )}
                <div>
                  <CardTitle>
                    {susceptibility.fellForPhish ? "Failed Phishing Test" : "Passed Phishing Test"}
                  </CardTitle>
                  <CardDescription>
                    Risk Level: <strong className="uppercase">{susceptibility.riskLevel}</strong>
                  </CardDescription>
                </div>
              </div>
              {training && (
                <div className="text-right">
                  <div className="text-3xl font-bold">{training.riskScore}</div>
                  <div className="text-sm text-muted-foreground">Risk Score</div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Suspicion Level</div>
                <Badge variant={susceptibility.suspicionLevel === "none" ? "destructive" : "secondary"}>
                  {susceptibility.suspicionLevel}
                </Badge>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Agreed to Action</div>
                <Badge variant={susceptibility.agreedToAction ? "destructive" : "secondary"}>
                  {susceptibility.agreedToAction ? "Yes" : "No"}
                </Badge>
              </div>
              {susceptibility.timeToSuspicion !== undefined && susceptibility.timeToSuspicion > 0 && (
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Time to Suspicion</div>
                  <div className="font-medium">{susceptibility.timeToSuspicion}s</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Red Flags */}
        {redFlags && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Red Flags Analysis</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Identified</span>
                  <Badge variant="secondary">{redFlags.redFlagsIdentified.length}</Badge>
                </div>
                {redFlags.redFlagsIdentified.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {redFlags.redFlagsIdentified.map((flag, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        ✓ {flag.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Missed</span>
                  <Badge variant="destructive">{redFlags.redFlagsMissed.length}</Badge>
                </div>
                {redFlags.redFlagsMissed.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {redFlags.redFlagsMissed.map((flag, i) => (
                      <Badge key={i} variant="outline" className="text-xs border-red-200">
                        ✗ {flag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Verification Attempted:</span>
                  {redFlags.verificationAttempted ? (
                    <Badge variant="secondary" className="bg-green-50 text-green-700">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Yes
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-red-50 text-red-700">
                      <XCircle className="h-3 w-3 mr-1" />
                      No
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Employee Response */}
        {response && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Employee Response</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Response Type</div>
                <Badge variant="outline" className="text-sm">
                  {response.responseType.replace(/_/g, " ")}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Emotional State</div>
                <Badge variant="secondary">{response.emotionalState}</Badge>
              </div>

              {response.questionsAsked && response.questionsAsked.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Questions Asked</div>
                  <ul className="space-y-1">
                    {response.questionsAsked.map((q, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-muted-foreground">•</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-2 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Shared Information:</span>
                  <Badge variant={response.informationShared ? "destructive" : "secondary"}>
                    {response.informationShared ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Call Quality */}
        {quality && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Call Quality</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Duration</div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">{quality.callDuration}s</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Engagement</div>
                  <Badge variant={quality.engagementLevel === "high" ? "default" : "secondary"}>
                    {quality.engagementLevel}
                  </Badge>
                </div>
              </div>

              {quality.conversationNaturalness && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Naturalness</span>
                    <span className="font-medium">{quality.conversationNaturalness}/10</span>
                  </div>
                  <Progress value={quality.conversationNaturalness * 10} />
                </div>
              )}

              {quality.employeeSpeakingPercentage !== undefined && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Speaking Time</span>
                    <span className="font-medium">{quality.employeeSpeakingPercentage}%</span>
                  </div>
                  <Progress value={quality.employeeSpeakingPercentage} />
                </div>
              )}

              <div className="pt-2 border-t">
                <div className="text-sm text-muted-foreground">Outcome</div>
                <div className="font-medium text-sm mt-1">
                  {quality.callOutcome.replace(/_/g, " ")}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Training Recommendations */}
        {training && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Training Insights</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {training.strongPoints.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    Strong Points
                  </div>
                  <ul className="space-y-1">
                    {training.strongPoints.map((point, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-green-500">✓</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {training.weaknesses.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-red-600">
                    <TrendingDown className="h-4 w-4" />
                    Areas for Improvement
                  </div>
                  <ul className="space-y-1">
                    {training.weaknesses.map((weakness, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-red-500">✗</span>
                        <span>{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {training.trainingModules && training.trainingModules.length > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  <div className="text-sm font-medium">Recommended Training</div>
                  <div className="flex flex-wrap gap-1">
                    {training.trainingModules.map((module, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {module.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {training.followUpRequired && (
                <div className="pt-2 border-t">
                  <Badge variant="destructive" className="w-full justify-center">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Immediate Follow-up Required
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recording */}
      {recordingUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Call Recording</CardTitle>
          </CardHeader>
          <CardContent>
            <audio controls className="w-full">
              <source src={recordingUrl} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
