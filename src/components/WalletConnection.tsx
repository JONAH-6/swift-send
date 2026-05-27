import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Wallet, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Shield, 
  Zap,
  Globe,
  ArrowRight,
  Star
} from 'lucide-react';
import { WalletProvider } from '@/types';
import { cn } from '@/lib/utils';

interface WalletConnectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect?: () => void;
}

export default function WalletConnectionDialog({ isOpen, onClose, onConnect }: WalletConnectionDialogProps) {
  const { availableWallets, isConnecting, connectWallet } = useWallet();
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  const handleWalletConnect = async (provider: WalletProvider) => {
    setSelectedWallet(provider);
    try {
      await connectWallet(provider);
      onConnect?.();
      onClose();
    } catch (error) {
      // Error is handled in the context
    } finally {
      setSelectedWallet(null);
    }
  };

  const getProviderFromName = (name: string): WalletProvider => {
    return name.toLowerCase() as WalletProvider;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Connect Your Stellar Wallet
          </DialogTitle>
          <DialogDescription>
            Connect your own wallet for full control over your funds and transactions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Benefits */}
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Why connect your own wallet?
            </h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                Full control of your private keys
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                View transactions on blockchain explorer
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                Enhanced security and transparency
              </li>
            </ul>
          </div>

          {/* Freighter Detection Status */}
          {availableWallets.some(w => w.name === 'Freighter') && (
            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm">
                {typeof window !== 'undefined' && window.freighter ? (
                  <span className="text-green-700">
                    ✅ <strong>Freighter API Ready!</strong> Click "Unlock Wallet" to connect.
                  </span>
                ) : (
                  <div className="space-y-2">
                    <span className="text-orange-700">
                      🔍 <strong>Looking for Freighter...</strong> 
                      {localStorage.getItem('freighter-installed') === 'true' && (
                        <span className="block mt-1">Extension detected, waiting for API to load...</span>
                      )}
                    </span>
                    <div className="text-xs text-gray-600">
                      <p><strong>If Freighter is installed but not detected:</strong></p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>
                          <button 
                            onClick={() => window.location.reload()}
                            className="text-blue-600 underline hover:text-blue-800"
                          >
                            Refresh this page (Ctrl+F5)
                          </button>
                        </li>
                        <li>Check if Freighter is enabled in chrome://extensions</li>
                        <li>Try disabling and re-enabling Freighter</li>
                        <li>Make sure you're using the latest version from{' '}
                          <button 
                            onClick={() => window.open('https://freighter.app/', '_blank')}
                            className="text-blue-600 underline hover:text-blue-800"
                          >
                            freighter.app
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Available Wallets */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Available Wallets</h4>
            
            {availableWallets.map((wallet) => {
              const provider = getProviderFromName(wallet.name);
              const isLoading = isConnecting && selectedWallet === provider;
              const isDemoWallet = wallet.name === 'Demo Wallet';
              const isFreighter = wallet.name === 'Freighter';
              
              return (
                <div
                  key={wallet.name}
                  className={cn(
                    "p-3 border rounded-lg transition-colors cursor-pointer hover:border-primary/50",
                    !wallet.isInstalled && "opacity-60 cursor-not-allowed",
                    isDemoWallet && "border-yellow-300 bg-yellow-50",
                    isFreighter && wallet.isInstalled && "border-green-300 bg-green-50"
                  )}
                  onClick={() => wallet.isInstalled && handleWalletConnect(provider)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 flex items-center justify-center text-xl">
                        {wallet.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{wallet.name}</p>
                          {isDemoWallet ? (
                            <Badge variant="outline" className="text-xs border-yellow-400 text-yellow-700">
                              🧪 Demo Only
                            </Badge>
                          ) : wallet.isInstalled ? (
                            <Badge variant="default" className="text-xs bg-green-600">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Real Wallet
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              <Download className="w-3 h-3 mr-1" />
                              Not Installed
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {wallet.description}
                        </p>
                      </div>
                    </div>
                    
                    {wallet.isInstalled ? (
                      <Button
                        size="sm"
                        variant={isDemoWallet ? "outline" : "default"}
                        disabled={isLoading}
                        className={cn(
                          "ml-2",
                          isDemoWallet && "border-yellow-400 text-yellow-700",
                          isFreighter && "bg-green-600 hover:bg-green-700"
                        )}
                      >
                        {isLoading ? (
                          <span className="animate-pulse">
                            {isFreighter ? 'Unlocking...' : 'Connecting...'}
                          </span>
                        ) : (
                          <>
                            {isFreighter ? 'Unlock Wallet' : isDemoWallet ? 'Try Demo' : 'Connect'}
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (wallet.name === 'Freighter') {
                            window.open('https://freighter.app/', '_blank');
                          } else if (wallet.name === 'Rabet') {
                            window.open('https://rabet.io/', '_blank');
                          }
                        }}
                      >
                        <Download className="w-4 h-4" />
                        Install
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Alternative Option */}
          <div className="pt-4 border-t">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>New to Stellar wallets?</strong> You can continue using SwiftSend's managed wallet 
                and upgrade to your own wallet later from Settings.
              </AlertDescription>
            </Alert>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Maybe Later
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => window.open('https://stellar.org/ecosystem/projects?tab=wallets', '_blank')}
            >
              <ExternalLink className="w-4 h-4" />
              Learn More
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Wallet status indicator component
export function WalletStatusIndicator() {
  const { connectionState } = useWallet();

  if (!connectionState.isConnected) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-full text-xs">
      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
      <span className="font-medium text-green-700 dark:text-green-300">
        {connectionState.provider} Connected
      </span>
    </div>
  );
}

// Quick wallet balance component
export function WalletBalanceCard() {
  const { connectionState, refreshBalance, disconnectWallet, getActiveWallet } = useWallet();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const activeWallet = getActiveWallet();

  if (!connectionState.isConnected || !activeWallet) {
    return null;
  }

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshBalance(activeWallet.id);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className={cn(
      "p-4 border rounded-lg bg-gradient-to-br",
      activeWallet?.isReal 
        ? "from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200"
        : "from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200"
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={cn(
            "flex items-center gap-2",
            activeWallet?.isReal ? "text-green-600" : "text-yellow-600"
          )}>
            <Wallet className="w-4 h-4" />
            <span className="text-sm font-medium">
              {activeWallet.label}
            </span>
            {activeWallet?.isReal ? (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-yellow-500" />
            )}
          </div>
          {activeWallet.isPrimary && (
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <Zap className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
        </Button>
      </div>
      
      {!activeWallet?.isReal && (
        <div className="mb-3 p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded border border-yellow-300">
          <p className="text-xs text-yellow-800 dark:text-yellow-200">
            🧪 This is a demonstration wallet. No real transactions will be made.
          </p>
        </div>
      )}
      
      <div className="space-y-1">
        <p className="text-2xl font-bold text-foreground">
          ${activeWallet.balance.toFixed(2)}
          {!activeWallet?.isReal && (
            <span className="text-sm font-normal text-yellow-600 ml-2">(Demo)</span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          {activeWallet.publicKey.slice(0, 8)}...
          {activeWallet.publicKey.slice(-8)}
        </p>
      </div>
      
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            <span>{activeWallet?.isReal ? 'Real Self-custody' : 'Demo Mode'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Globe className="w-3 h-3" />
            <span>Stellar Network</span>
          </div>
        </div>
        
        {/* Disconnect Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const walletType = activeWallet?.isReal ? 'real wallet' : 'demo wallet';
            if (window.confirm(`Are you sure you want to disconnect your ${walletType}?`)) {
              disconnectWallet();
            }
          }}
          className="text-xs px-3 py-1 h-auto"
        >
          Disconnect All
        </Button>
      </div>
    </div>
  );
}