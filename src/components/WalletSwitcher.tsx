import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Wallet, 
  CheckCircle2, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Star, 
  RefreshCw,
  X
} from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { cn } from '@/lib/utils';
import { LinkedWallet } from '@/types';

interface WalletSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletSwitcher({ isOpen, onClose }: WalletSwitcherProps) {
  const { 
    connectionState, 
    switchWallet, 
    setPrimaryWallet, 
    renameWallet, 
    disconnectSpecificWallet,
    refreshBalance,
    refreshAllBalances,
    isSyncing
  } = useWallet();
  
  const [editingWalletId, setEditingWalletId] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [showMenuFor, setShowMenuFor] = useState<string | null>(null);

  const handleRename = (wallet: LinkedWallet) => {
    setEditingWalletId(wallet.id);
    setNewLabel(wallet.label);
    setShowMenuFor(null);
  };

  const saveRename = () => {
    if (editingWalletId && newLabel.trim()) {
      renameWallet(editingWalletId, newLabel.trim());
      setEditingWalletId(null);
      setNewLabel('');
    }
  };

  const handleSetPrimary = (walletId: string) => {
    setPrimaryWallet(walletId);
    setShowMenuFor(null);
  };

  const handleDisconnect = (walletId: string) => {
    if (window.confirm('Are you sure you want to disconnect this wallet?')) {
      disconnectSpecificWallet(walletId);
      setShowMenuFor(null);
    }
  };

  const handleRefresh = async (walletId: string) => {
    await refreshBalance(walletId);
    setShowMenuFor(null);
  };

  const handleRefreshAll = async () => {
    await refreshAllBalances();
  };

  if (connectionState.linkedWallets.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Manage Wallets
          </DialogTitle>
          <DialogDescription>
            Switch between your linked wallets or manage their settings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Refresh All Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            disabled={isSyncing}
            className="w-full"
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isSyncing && "animate-spin")} />
            Refresh All Balances
          </Button>

          {/* Wallet List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {connectionState.linkedWallets.map((wallet) => {
              const isActive = wallet.id === connectionState.activeWalletId;
              const isEditing = editingWalletId === wallet.id;
              const isDemo = !wallet.isReal;

              return (
                <div
                  key={wallet.id}
                  className={cn(
                    "p-4 border rounded-lg transition-colors relative",
                    isActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                  )}
                >
                  {/* Active Indicator */}
                  {isActive && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="default" className="text-xs">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                  )}

                  {/* Primary Indicator */}
                  {wallet.isPrimary && (
                    <div className="absolute top-2 left-2">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    </div>
                  )}

                  <div className="pt-6 pb-2">
                    {isEditing ? (
                      <div className="flex gap-2">
                        <Input
                          value={newLabel}
                          onChange={(e) => setNewLabel(e.target.value)}
                          onBlur={saveRename}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveRename();
                            if (e.key === 'Escape') {
                              setEditingWalletId(null);
                              setNewLabel('');
                            }
                          }}
                          className="flex-1"
                          autoFocus
                        />
                        <Button size="sm" onClick={saveRename}>
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingWalletId(null);
                            setNewLabel('');
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{wallet.label}</p>
                            {isDemo && (
                              <Badge variant="outline" className="text-xs border-yellow-400 text-yellow-700">
                                Demo
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            {wallet.publicKey.slice(0, 8)}...{wallet.publicKey.slice(-8)}
                          </p>
                          <p className="text-lg font-bold">
                            ${wallet.balance.toFixed(2)}
                          </p>
                          {wallet.lastSyncedAt && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Last synced: {wallet.lastSyncedAt.toLocaleTimeString()}
                            </p>
                          )}
                        </div>

                        {/* Menu Button */}
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowMenuFor(showMenuFor === wallet.id ? null : wallet.id)}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>

                          {/* Dropdown Menu */}
                          {showMenuFor === wallet.id && (
                            <div className="absolute right-0 top-full mt-1 bg-background border rounded-lg shadow-lg z-10 min-w-48">
                              <div className="p-1">
                                {!isActive && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start"
                                    onClick={() => {
                                      switchWallet(wallet.id);
                                      setShowMenuFor(null);
                                    }}
                                  >
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Switch to This Wallet
                                  </Button>
                                )}
                                
                                {!wallet.isPrimary && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start"
                                    onClick={() => handleSetPrimary(wallet.id)}
                                  >
                                    <Star className="w-4 h-4 mr-2" />
                                    Set as Primary
                                  </Button>
                                )}

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-start"
                                  onClick={() => handleRename(wallet)}
                                >
                                  <Edit2 className="w-4 h-4 mr-2" />
                                  Rename
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-start"
                                  onClick={() => handleRefresh(wallet.id)}
                                >
                                  <RefreshCw className="w-4 h-4 mr-2" />
                                  Refresh Balance
                                </Button>

                                <div className="border-t my-1" />

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-start text-destructive hover:text-destructive"
                                  onClick={() => handleDisconnect(wallet.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Disconnect
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add New Wallet Button */}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              onClose();
              // Trigger wallet connection dialog
              window.dispatchEvent(new CustomEvent('open-wallet-connection'));
            }}
          >
            <Wallet className="w-4 h-4 mr-2" />
            Add New Wallet
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Quick wallet switcher button for header/navbar
export function WalletSwitcherButton() {
  const { connectionState } = useWallet();
  const [isOpen, setIsOpen] = useState(false);

  if (connectionState.linkedWallets.length <= 1) {
    return null;
  }

  const activeWallet = connectionState.linkedWallets.find(w => w.id === connectionState.activeWalletId);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2"
      >
        <Wallet className="w-4 h-4" />
        <span className="hidden sm:inline">
          {activeWallet?.label || 'Switch Wallet'}
        </span>
        <span className="text-xs text-muted-foreground">
          ({connectionState.linkedWallets.length})
        </span>
      </Button>
      <WalletSwitcher isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
