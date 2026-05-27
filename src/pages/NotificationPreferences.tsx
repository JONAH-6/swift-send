import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Mail, MessageSquare, Smartphone, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BottomNav } from '@/components/BottomNav';
import { toast } from 'sonner';

interface NotificationPrefs {
  email: {
    transactionAlerts: boolean;
    transferUpdates: boolean;
    securityAlerts: boolean;
    promotions: boolean;
  };
  sms: {
    transactionAlerts: boolean;
    transferUpdates: boolean;
    securityAlerts: boolean;
  };
  push: {
    transactionAlerts: boolean;
    transferUpdates: boolean;
    securityAlerts: boolean;
    priceAlerts: boolean;
  };
}

const STORAGE_KEY = 'swift_send_notification_prefs';

const DEFAULT_PREFS: NotificationPrefs = {
  email: {
    transactionAlerts: true,
    transferUpdates: true,
    securityAlerts: true,
    promotions: false,
  },
  sms: {
    transactionAlerts: true,
    transferUpdates: false,
    securityAlerts: true,
  },
  push: {
    transactionAlerts: true,
    transferUpdates: true,
    securityAlerts: true,
    priceAlerts: false,
  },
};

function loadPrefs(): NotificationPrefs {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as NotificationPrefs;
  } catch {
    // ignore
  }
  return DEFAULT_PREFS;
}

function savePrefs(prefs: NotificationPrefs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

function ToggleRow({ label, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export default function NotificationPreferences() {
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState<NotificationPrefs>(loadPrefs);
  const [dirty, setDirty] = useState(false);

  const update = <C extends keyof NotificationPrefs, K extends keyof NotificationPrefs[C]>(
    channel: C,
    key: K,
    value: boolean,
  ) => {
    setPrefs((prev) => ({
      ...prev,
      [channel]: { ...prev[channel], [key]: value },
    }));
    setDirty(true);
  };

  const handleSave = () => {
    savePrefs(prefs);
    setDirty(false);
    toast.success('Notification preferences saved');
  };

  useEffect(() => {
    return () => {
      // auto-save on unmount if dirty
      if (dirty) savePrefs(prefs);
    };
  }, [dirty, prefs]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border/50 z-10 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="p-2 h-auto">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Notification Preferences</h1>
        </div>
      </header>

      <main className="px-4 pt-4 max-w-lg mx-auto space-y-4">
        {/* Email Notifications */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-500" />
              Email Notifications
            </CardTitle>
            <CardDescription>Alerts sent to your registered email address</CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border/50">
            <ToggleRow
              label="Transaction Alerts"
              description="Get notified when a transaction is sent or received"
              checked={prefs.email.transactionAlerts}
              onChange={(v) => update('email', 'transactionAlerts', v)}
            />
            <ToggleRow
              label="Transfer Updates"
              description="Status changes for in-progress transfers"
              checked={prefs.email.transferUpdates}
              onChange={(v) => update('email', 'transferUpdates', v)}
            />
            <ToggleRow
              label="Security Alerts"
              description="Login attempts, password changes, and suspicious activity"
              checked={prefs.email.securityAlerts}
              onChange={(v) => update('email', 'securityAlerts', v)}
            />
            <ToggleRow
              label="Promotions & News"
              description="Product updates, offers, and announcements"
              checked={prefs.email.promotions}
              onChange={(v) => update('email', 'promotions', v)}
            />
          </CardContent>
        </Card>

        {/* SMS Notifications */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-green-500" />
              SMS Notifications
            </CardTitle>
            <CardDescription>Text messages to your registered phone number</CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border/50">
            <ToggleRow
              label="Transaction Alerts"
              description="SMS when money is sent or received"
              checked={prefs.sms.transactionAlerts}
              onChange={(v) => update('sms', 'transactionAlerts', v)}
            />
            <ToggleRow
              label="Transfer Updates"
              description="SMS for key transfer milestones"
              checked={prefs.sms.transferUpdates}
              onChange={(v) => update('sms', 'transferUpdates', v)}
            />
            <ToggleRow
              label="Security Alerts"
              description="OTP codes and security notifications via SMS"
              checked={prefs.sms.securityAlerts}
              onChange={(v) => update('sms', 'securityAlerts', v)}
            />
          </CardContent>
        </Card>

        {/* Push Notifications */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-purple-500" />
              Push Notifications
            </CardTitle>
            <CardDescription>In-app and browser push alerts</CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border/50">
            <ToggleRow
              label="Transaction Alerts"
              description="Instant push when a transaction completes"
              checked={prefs.push.transactionAlerts}
              onChange={(v) => update('push', 'transactionAlerts', v)}
            />
            <ToggleRow
              label="Transfer Updates"
              description="Push notifications for transfer status changes"
              checked={prefs.push.transferUpdates}
              onChange={(v) => update('push', 'transferUpdates', v)}
            />
            <ToggleRow
              label="Security Alerts"
              description="Push alerts for account security events"
              checked={prefs.push.securityAlerts}
              onChange={(v) => update('push', 'securityAlerts', v)}
            />
            <ToggleRow
              label="Exchange Rate Alerts"
              description="Notify when favourable rates are available"
              checked={prefs.push.priceAlerts}
              onChange={(v) => update('push', 'priceAlerts', v)}
            />
          </CardContent>
        </Card>

        <div className="flex items-center gap-3 pb-4">
          <Button className="flex-1" onClick={handleSave} disabled={!dirty}>
            <Save className="w-4 h-4 mr-2" />
            Save Preferences
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setPrefs(DEFAULT_PREFS);
              setDirty(true);
            }}
          >
            Reset
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground pb-2">
          Security alerts cannot be fully disabled for account safety.
        </p>
      </main>

      <BottomNav />
    </div>
  );
}
