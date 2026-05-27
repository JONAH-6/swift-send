import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, Shield, ExternalLink, X, CheckCircle2 } from 'lucide-react';
import { useSecurity } from '@/contexts/SecurityContext';

interface SuspiciousRedirectWarningProps {
  url: string;
  onProceed?: () => void;
  onCancel?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SuspiciousRedirectWarning({
  url,
  onProceed,
  onCancel,
  open,
  onOpenChange,
}: SuspiciousRedirectWarningProps) {
  const { checkRedirectSafety, addPhishingWarning } = useSecurity();
  const [internalOpen, setInternalOpen] = useState(true);
  const [acknowledged, setAcknowledged] = useState(false);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange! : setInternalOpen;

  const checkResult = checkRedirectSafety(url);

  const handleProceed = () => {
    if (!acknowledged) {
      return;
    }
    
    // Log the warning
    addPhishingWarning({
      type: 'suspicious_redirect',
      severity: checkResult.confidence > 0.7 ? 'high' : 'medium',
      message: `User proceeded to potentially suspicious URL: ${url}`,
      details: checkResult.reason,
    });

    onProceed?.();
    setIsOpen(false);
  };

  const handleCancel = () => {
    addPhishingWarning({
      type: 'suspicious_redirect',
      severity: 'low',
      message: `User cancelled redirect to: ${url}`,
      details: checkResult.reason,
    });
    
    onCancel?.();
    setIsOpen(false);
  };

  const handleClose = () => {
    handleCancel();
  };

  // If not suspicious, don't show the warning
  if (!checkResult.isSuspicious) {
    return null;
  }

  const getSeverityColor = () => {
    if (checkResult.confidence > 0.8) return 'destructive';
    if (checkResult.confidence > 0.6) return 'default';
    return 'secondary';
  };

  const getSeverityIcon = () => {
    if (checkResult.confidence > 0.8) {
      return <AlertTriangle className="w-5 h-5 text-destructive" />;
    }
    return <Shield className="w-5 h-5 text-yellow-600" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${
              checkResult.confidence > 0.8 
                ? 'bg-destructive/10' 
                : 'bg-yellow-100 dark:bg-yellow-900/20'
            }`}>
              {getSeverityIcon()}
            </div>
            <div>
              <DialogTitle className="text-lg">
                {checkResult.confidence > 0.8 ? 'Suspicious Link Detected' : 'Caution: Unusual Link'}
              </DialogTitle>
              <DialogDescription className="text-xs">
                This redirect may be unsafe
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert variant={getSeverityColor() as any}>
            <AlertTriangle className="w-4 h-4" />
            <AlertTitle className="text-sm font-semibold">
              Security Warning
            </AlertTitle>
            <AlertDescription className="text-xs">
              {checkResult.reason || 'This link has been flagged as potentially suspicious.'}
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <p className="text-sm font-medium">Destination URL:</p>
            <div className="p-3 bg-muted rounded-lg">
              <code className="text-xs break-all">{url}</code>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Risk Level:</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    checkResult.confidence > 0.8
                      ? 'bg-destructive'
                      : checkResult.confidence > 0.6
                      ? 'bg-yellow-500'
                      : 'bg-blue-500'
                  }`}
                  style={{ width: `${checkResult.confidence * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium">
                {Math.round(checkResult.confidence * 100)}%
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-gray-300"
              />
              <span className="text-xs text-muted-foreground">
                I understand the risks and want to proceed to this link. I verify that this is a trusted destination.
              </span>
            </label>
          </div>

          {checkResult.confidence > 0.7 && (
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription className="text-xs">
                <strong>Recommendation:</strong> We strongly recommend you do not proceed. This link exhibits characteristics of phishing attempts.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="w-full sm:w-auto"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            variant={checkResult.confidence > 0.8 ? 'destructive' : 'default'}
            onClick={handleProceed}
            disabled={!acknowledged}
            className="w-full sm:w-auto"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Proceed Anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Hook to wrap window.open with security checks
export function useSecureRedirect() {
  const { checkRedirectSafety, addPhishingWarning } = useSecurity();

  const openSecure = (url: string, target?: string) => {
    const result = checkRedirectSafety(url);

    if (result.isSuspicious && result.suggestedAction === 'block') {
      addPhishingWarning({
        type: 'suspicious_redirect',
        severity: 'high',
        message: `Blocked redirect to suspicious URL: ${url}`,
        details: result.reason,
      });
      return false;
    }

    if (result.isSuspicious && result.suggestedAction === 'warn') {
      // In a real implementation, you would show the warning dialog here
      // For now, we'll log it and proceed
      addPhishingWarning({
        type: 'suspicious_redirect',
        severity: 'medium',
        message: `User warned about suspicious URL: ${url}`,
        details: result.reason,
      });
    }

    window.open(url, target || '_blank', 'noopener,noreferrer');
    return true;
  };

  return { openSecure };
}
