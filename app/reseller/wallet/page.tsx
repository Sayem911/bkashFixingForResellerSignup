'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { Loader2, Wallet, AlertCircle } from 'lucide-react';

export default function WalletPage() {
  const [loading, setLoading] = useState(true);
  const [topupLoading, setTopupLoading] = useState(false);
  const [walletData, setWalletData] = useState<any>(null);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    fetchWalletData();
    
    // Show status notifications
    const status = searchParams.get('status');
    if (status) {
      switch (status) {
        case 'success':
          toast({
            title: "Top Up Successful",
            description: "Your wallet has been topped up successfully.",
            duration: 5000,
          });
          break;
        case 'cancelled':
          toast({
            title: "Top Up Cancelled",
            description: "You cancelled the top up process.",
            duration: 5000,
            variant: "destructive",
          });
          break;
        case 'failed':
          toast({
            title: "Top Up Failed",
            description: "Failed to process your top up. Please try again.",
            duration: 5000,
            variant: "destructive",
          });
          break;
      }
    }
  }, [searchParams]);

  const fetchWalletData = async () => {
    try {
      const response = await fetch('/api/reseller/wallet');
      if (!response.ok) throw new Error('Failed to fetch wallet data');
      const data = await response.json();
      setWalletData(data);
    } catch (error) {
      console.error('Failed to fetch wallet data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load wallet data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setTopupLoading(true);
    setError('');

    try {
      const response = await fetch('/api/reseller/wallet/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to process top-up');
      }

      const { bkashURL } = await response.json();
      
      // Redirect to bKash payment page
      window.location.href = bkashURL;
    } catch (error) {
      console.error('Top-up error:', error);
      setError(error instanceof Error ? error.message : 'Failed to process top-up');
    } finally {
      setTopupLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!walletData) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Wallet</h1>
        <p className="text-muted-foreground">
          Manage your wallet balance and view transactions
        </p>
      </div>

      {/* Balance Card */}
      <Card className="bg-primary/10">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-primary">Available Balance</p>
              <div className="text-3xl font-bold">
                {formatCurrency(walletData.balance, walletData.currency)}
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Wallet className="mr-2 h-4 w-4" />
                  Top Up
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Top Up Wallet</DialogTitle>
                  <DialogDescription>
                    Enter the amount you want to add to your wallet
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    <Label>Amount ({walletData.currency})</Label>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={topUpAmount}
                      onChange={(e) => setTopUpAmount(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={handleTopUp} 
                    className="w-full"
                    disabled={topupLoading}
                  >
                    {topupLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Pay with bKash
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {walletData.transactions.map((transaction: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{transaction.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${
                    transaction.type === 'credit' 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {transaction.type === 'credit' ? '+' : '-'}
                    {formatCurrency(transaction.amount, walletData.currency)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {transaction.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}