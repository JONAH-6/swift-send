import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertTriangle, CheckCircle2, X, ExternalLink } from 'lucide-react';
import { useSecurity } from '@/contexts/SecurityContext';

interface PhishingEducationPromptProps {
  onDismiss?: () => void;
  showOnMount?: boolean;
}

const EDUCATION_TIPS = [
  {
    icon: <Shield className="w-5 h-5 text-blue-600" />,
    title: 'Verify the URL',
    description: 'Always check that you\'re on swift-send.com or the official app. Phishing sites often use similar-looking domains.',
  },
  {
    icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
    title: 'Never share your PIN',
    description: 'SwiftSend will never ask for your PIN, password, or verification codes via email, SMS, or phone.',
  },
  {
    icon: <CheckCircle2 className="w-5 h-5 text-green-600" />,
    title: 'Check for trusted devices',
    description: 'Review your trusted devices regularly. Remove any devices you don\'t recognize.',
  },
];

export function PhishingEducationPrompt({ onDismiss, showOnMount = true }: PhishingEducationPromptProps) {
  const [dismissed, setDismissed] = useState(!showOnMount);
  const [currentTip, setCurrentTip] = useState(0);
  const { acknowledgeWarning, addPhishingWarning } = useSecurity();

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
    // Add education prompt as an acknowledged warning
    addPhishingWarning({
      type: 'suspicious_redirect',
      severity: 'low',
      message: 'Phishing education prompt viewed',
      details: 'User reviewed phishing education tips',
    });
  };

  const handleNextTip = () => {
    setCurrentTip((prev) => (prev + 1) % EDUCATION_TIPS.length);
  };

  const handlePreviousTip = () => {
    setCurrentTip((prev) => (prev - 1 + EDUCATION_TIPS.length) % EDUCATION_TIPS.length);
  };

  if (dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <Card className="shadow-lg border-blue-200 dark:border-blue-800">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Security Tips</CardTitle>
                <CardDescription className="text-xs">
                  Protect yourself from phishing
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleDismiss}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
            <AlertTriangle className="w-4 h-4 text-blue-600" />
            <AlertTitle className="text-sm">Stay Safe</AlertTitle>
            <AlertDescription className="text-xs">
              Learn how to identify and avoid phishing attempts to keep your account secure.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            {EDUCATION_TIPS.map((tip, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border transition-all ${
                  index === currentTip
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                    : 'bg-muted/30 border-transparent'
                }`}
              >
                <div className="flex items-start gap-3">
                  {tip.icon}
                  <div className="flex-1">
                    <h4 className="font-medium text-sm mb-1">{tip.title}</h4>
                    <p className="text-xs text-muted-foreground">{tip.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousTip}
              disabled={EDUCATION_TIPS.length <= 1}
            >
              Previous
            </Button>
            <div className="flex gap-1">
              {EDUCATION_TIPS.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentTip ? 'bg-blue-600' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextTip}
              disabled={EDUCATION_TIPS.length <= 1}
            >
              Next
            </Button>
          </div>

          <Button
            variant="default"
            size="sm"
            className="w-full"
            onClick={handleDismiss}
          >
            I Understand
          </Button>

          <div className="pt-2 border-t">
            <a
              href="https://support.swiftsend.com/security/phishing"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Learn more about phishing protection
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
