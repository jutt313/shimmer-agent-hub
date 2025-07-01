
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  CreditCard, 
  DollarSign, 
  Plus, 
  Zap,
  Calendar,
  TrendingUp,
  Settings,
  Receipt
} from 'lucide-react';

interface BillingAccount {
  id: string;
  company_name: string | null;
  billing_email: string;
  credits_balance: number;
  auto_recharge_enabled: boolean;
  auto_recharge_threshold: number;
  auto_recharge_amount: number;
  billing_status: 'active' | 'suspended' | 'cancelled';
}

interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  credits_amount: number | null;
  description: string | null;
  status: string;
  created_at: string;
}

const BillingTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [billingAccount, setBillingAccount] = useState<BillingAccount | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddCreditsDialog, setShowAddCreditsDialog] = useState(false);
  const [creditsAmount, setCreditsAmount] = useState(50);

  useEffect(() => {
    if (user) {
      fetchBillingData();
    }
  }, [user]);

  const fetchBillingData = async () => {
    try {
      // Fetch billing account
      const { data: accountData, error: accountError } = await supabase
        .from('billing_accounts')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (accountError && accountError.code !== 'PGRST116') {
        throw accountError;
      }

      setBillingAccount(accountData);

      // Fetch recent transactions
      if (accountData) {
        const { data: transactionData, error: transactionError } = await supabase
          .from('billing_transactions')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (transactionError) throw transactionError;
        setTransactions(transactionData || []);
      }
    } catch (error) {
      console.error('Error fetching billing data:', error);
      toast({
        title: "Error",
        description: "Failed to load billing information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addCredits = async () => {
    try {
      if (!billingAccount) return;

      // In a real implementation, this would integrate with Stripe
      // For now, we'll simulate adding credits
      const { error: transactionError } = await supabase
        .from('billing_transactions')
        .insert({
          user_id: user?.id,
          billing_account_id: billingAccount.id,
          transaction_type: 'credit_purchase',
          amount: creditsAmount,
          credits_amount: creditsAmount,
          description: `Added $${creditsAmount} in credits`,
          status: 'completed'
        });

      if (transactionError) throw transactionError;

      // Update billing account balance
      const { error: updateError } = await supabase
        .from('billing_accounts')
        .update({
          credits_balance: billingAccount.credits_balance + creditsAmount
        })
        .eq('id', billingAccount.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: `$${creditsAmount} in credits added successfully`,
      });

      setShowAddCreditsDialog(false);
      setCreditsAmount(50);
      fetchBillingData();
    } catch (error) {
      console.error('Error adding credits:', error);
      toast({
        title: "Error",
        description: "Failed to add credits",
        variant: "destructive",
      });
    }
  };

  const updateAutoRecharge = async (enabled: boolean) => {
    try {
      if (!billingAccount) return;

      const { error } = await supabase
        .from('billing_accounts')
        .update({ auto_recharge_enabled: enabled })
        .eq('id', billingAccount.id);

      if (error) throw error;

      setBillingAccount({ ...billingAccount, auto_recharge_enabled: enabled });

      toast({
        title: "Success",
        description: `Auto-recharge ${enabled ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('Error updating auto-recharge:', error);
      toast({
        title: "Error",
        description: "Failed to update auto-recharge settings",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading billing information...</div>;
  }

  if (!billingAccount) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-gray-200 rounded-3xl shadow-lg">
        <CardContent className="p-8 text-center">
          <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Billing Account</h3>
          <p className="text-gray-600 mb-4">A billing account will be created automatically when you sign up</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Billing & Credits</h2>
          <p className="text-gray-600">Manage your account balance and billing settings</p>
        </div>
        
        <Dialog open={showAddCreditsDialog} onOpenChange={setShowAddCreditsDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl">
              <Plus className="h-4 w-4 mr-2" />
              Add Credits
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle>Add Credits</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Amount (USD)</label>
                <Input
                  type="number"
                  min="10"
                  max="1000"
                  step="10"
                  value={creditsAmount}
                  onChange={(e) => setCreditsAmount(parseInt(e.target.value) || 50)}
                  className="mt-1 rounded-xl"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                {[25, 50, 100].map((amount) => (
                  <Button
                    key={amount}
                    variant={creditsAmount === amount ? "default" : "outline"}
                    onClick={() => setCreditsAmount(amount)}
                    className="rounded-xl"
                  >
                    ${amount}
                  </Button>
                ))}
              </div>

              <div className="bg-blue-50 p-4 rounded-xl">
                <p className="text-sm text-blue-800">
                  You'll receive <strong>${creditsAmount}</strong> in API credits
                </p>
              </div>

              <Button 
                onClick={addCredits}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl"
              >
                Add ${creditsAmount} Credits
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Account Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white/80 backdrop-blur-sm border-gray-200 rounded-3xl shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Current Balance</p>
                <p className="text-3xl font-bold text-gray-900">${billingAccount.credits_balance.toFixed(2)}</p>
              </div>
            </div>
            <Badge variant={billingAccount.billing_status === 'active' ? 'default' : 'destructive'}>
              {billingAccount.billing_status}
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-gray-200 rounded-3xl shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Auto-Recharge</p>
                <p className="text-lg font-semibold text-gray-900">
                  {billingAccount.auto_recharge_enabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </div>
            {billingAccount.auto_recharge_enabled && (
              <p className="text-xs text-gray-600">
                Recharge ${billingAccount.auto_recharge_amount} when balance drops below ${billingAccount.auto_recharge_threshold}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-gray-200 rounded-3xl shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Receipt className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-lg font-semibold text-gray-900">$12.45</p>
              </div>
            </div>
            <p className="text-xs text-gray-600">Usage charges</p>
          </CardContent>
        </Card>
      </div>

      {/* Auto-Recharge Settings */}
      <Card className="bg-white/80 backdrop-blur-sm border-gray-200 rounded-3xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-600" />
            Auto-Recharge Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Enable Auto-Recharge</p>
              <p className="text-sm text-gray-600">
                Automatically add credits when your balance runs low
              </p>
            </div>
            <Switch
              checked={billingAccount.auto_recharge_enabled}
              onCheckedChange={updateAutoRecharge}
            />
          </div>
          
          {billingAccount.auto_recharge_enabled && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="text-sm font-medium text-gray-700">Threshold</label>
                <p className="text-sm text-gray-600 mb-2">Recharge when balance drops below</p>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold">${billingAccount.auto_recharge_threshold}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Amount</label>
                <p className="text-sm text-gray-600 mb-2">Credits to add each time</p>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold">${billingAccount.auto_recharge_amount}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card className="bg-white/80 backdrop-blur-sm border-gray-200 rounded-3xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Transactions</h3>
              <p className="text-gray-600">Your transaction history will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${
                      transaction.transaction_type === 'credit_purchase' 
                        ? 'bg-green-100' 
                        : transaction.transaction_type === 'usage_charge'
                        ? 'bg-red-100'
                        : 'bg-blue-100'
                    }`}>
                      {transaction.transaction_type === 'credit_purchase' ? (
                        <Plus className="h-4 w-4 text-green-600" />
                      ) : transaction.transaction_type === 'usage_charge' ? (
                        <Zap className="h-4 w-4 text-red-600" />
                      ) : (
                        <Receipt className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {transaction.description || 
                          (transaction.transaction_type === 'credit_purchase' ? 'Credits Added' :
                           transaction.transaction_type === 'usage_charge' ? 'API Usage' : 'Transaction')
                        }
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {new Date(transaction.created_at).toLocaleDateString()}
                        <Badge variant="outline" className="text-xs ml-2">
                          {transaction.status}
                        </Badge>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.transaction_type === 'credit_purchase' 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {transaction.transaction_type === 'credit_purchase' ? '+' : '-'}
                      ${Math.abs(transaction.amount).toFixed(2)}
                    </p>
                    {transaction.credits_amount && (
                      <p className="text-xs text-gray-600">
                        {transaction.credits_amount > 0 ? '+' : ''}
                        {transaction.credits_amount} credits
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingTab;
