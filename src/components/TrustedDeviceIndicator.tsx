import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Shield, Smartphone, Monitor, Tablet, Trash2, CheckCircle2, Clock } from 'lucide-react';
import { useSecurity } from '@/contexts/SecurityContext';
import type { TrustedDevice } from '@/types';

interface TrustedDeviceIndicatorProps {
  showLabel?: boolean;
  variant?: 'badge' | 'card' | 'full';
}

function getDeviceIcon(deviceType: TrustedDevice['deviceType']) {
  switch (deviceType) {
    case 'mobile':
      return <Smartphone className="w-4 h-4" />;
    case 'tablet':
      return <Tablet className="w-4 h-4" />;
    case 'desktop':
    default:
      return <Monitor className="w-4 h-4" />;
  }
}

function formatLastUsed(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function TrustedDeviceIndicator({ showLabel = true, variant = 'badge' }: TrustedDeviceIndicatorProps) {
  const { trustedDevices, getCurrentDevice, removeTrustedDevice } = useSecurity();
  const [showDialog, setShowDialog] = useState(false);
  const currentDevice = getCurrentDevice();

  if (variant === 'badge') {
    return (
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <Shield className="w-4 h-4 text-green-600" />
            {showLabel && <span className="text-sm">Trusted Device</span>}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trusted Devices</DialogTitle>
            <DialogDescription>
              Manage devices that have access to your account
            </DialogDescription>
          </DialogHeader>
          <TrustedDevicesList
            devices={trustedDevices}
            currentDevice={currentDevice}
            onRemove={removeTrustedDevice}
          />
        </DialogContent>
      </Dialog>
    );
  }

  if (variant === 'card') {
    return (
      <Card className="border-green-200 dark:border-green-800">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Trusted Device</CardTitle>
              <CardDescription className="text-xs">
                This device is verified and secure
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                View All Devices
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Trusted Devices</DialogTitle>
                <DialogDescription>
                  Manage devices that have access to your account
                </DialogDescription>
              </DialogHeader>
              <TrustedDevicesList
                devices={trustedDevices}
                currentDevice={currentDevice}
                onRemove={removeTrustedDevice}
              />
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    );
  }

  // Full variant
  return (
    <Card>
      <CardHeader>
        <CardTitle>Trusted Devices</CardTitle>
        <CardDescription>
          Manage devices that have access to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TrustedDevicesList
          devices={trustedDevices}
          currentDevice={currentDevice}
          onRemove={removeTrustedDevice}
        />
      </CardContent>
    </Card>
  );
}

interface TrustedDevicesListProps {
  devices: TrustedDevice[];
  currentDevice: TrustedDevice | null;
  onRemove: (deviceId: string) => void;
}

function TrustedDevicesList({ devices, currentDevice, onRemove }: TrustedDevicesListProps) {
  if (devices.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No trusted devices yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {devices.map((device) => (
        <div
          key={device.id}
          className="flex items-center justify-between p-3 rounded-lg border bg-card"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg">
              {getDeviceIcon(device.deviceType)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm">{device.deviceName}</p>
                {device.isCurrentDevice && (
                  <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded">
                    Current
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>Last used: {formatLastUsed(device.lastUsedAt)}</span>
              </div>
            </div>
          </div>
          {!device.isCurrentDevice && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onRemove(device.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          {device.isCurrentDevice && (
            <div className="p-1">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
