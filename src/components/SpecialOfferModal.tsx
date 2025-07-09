
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Gift, Clock, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface SpecialOfferModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const SpecialOfferModal = ({ isOpen, onOpenChange }: SpecialOfferModalProps) => {
  const { user } = useAuth();
  const [timeLeft, setTimeLeft] = useState('');
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (!user) return;

    const checkSpecialOffer = async () => {
      try {
        // Check if user has special offer available
        const { data: offer, error } = await supabase
          .from('special_offers')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_claimed', false)
          .single();

        if (error || !offer) return;

        // Check if offer is still valid
        const now = new Date();
        const expiresAt = new Date(offer.expires_at);
        
        if (now < expiresAt) {
          setShouldShow(true);
          
          // Update timer
          const updateTimer = () => {
            const diff = expiresAt.getTime() - new Date().getTime();
            if (diff <= 0) {
              setTimeLeft('Expired');
              setShouldShow(false);
              return;
            }
            
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            setTimeLeft(`${hours}h ${minutes}m`);
          };

          updateTimer();
          const timer = setInterval(updateTimer, 60000); // Update every minute
          
          return () => clearInterval(timer);
        }
      } catch (error) {
        console.error('Error checking special offer:', error);
      }
    };

    checkSpecialOffer();
  }, [user]);

  const handleClaimOffer = async () => {
    if (!user) return;

    try {
      // Create Stripe checkout for special offer
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: { planType: 'special' }
      });

      if (error) throw error;

      // Mark offer as claimed
      await supabase
        .from('special_offers')
        .update({ is_claimed: true, claimed_at: new Date().toISOString() })
        .eq('user_id', user.id);

      // Redirect to Stripe checkout
      if (data.url) {
        window.open(data.url, '_blank');
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error claiming special offer:', error);
    }
  };

  if (!shouldShow) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-3xl p-0 overflow-hidden">
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-8 text-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/20 rounded-2xl">
              <Gift className="w-8 h-8" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold">🎉 Special Beta Offer!</DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Expires in {timeLeft}</span>
              </div>
            </div>
          </div>
          
          <div className="text-center mb-6">
            <div className="text-5xl font-bold mb-2">$59.97/month</div>
            <div className="text-xl opacity-90">Save 40% on our Premium Features</div>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-2 gap-4 mb-6">
            {[
              '25 Active Automations',
              '25,000 Total Runs/month',
              '12,500 Step Runs/month',
              '25 AI Agents',
              '200+ Platform Integrations',
              'Priority Support',
              'Advanced Analytics',
              'Team Collaboration'
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-700">{feature}</span>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 p-4 rounded-2xl mb-6">
            <p className="text-sm text-blue-800 text-center">
              🚀 Perfect for growing businesses! More than Professional, less than Business.
            </p>
          </div>

          <div className="flex gap-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Maybe Later
            </Button>
            <Button 
              onClick={handleClaimOffer}
              className="flex-1 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white"
            >
              Claim Special Offer 🎁
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SpecialOfferModal;
