
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Zap, Shield, Wrench } from 'lucide-react';

const ComingSoonBanner = () => {
  return (
    <Card className="border-2 border-dashed border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50">
      <CardContent className="p-8 text-center">
        <div className="flex justify-center items-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-r from-orange-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg">
              <Wrench className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -top-2 -right-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center animate-pulse">
                <Zap className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          🚀 Webhooks Coming Soon!
        </h2>
        
        <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
          We're working hard to bring you the most advanced webhook system with real-time automation triggers, 
          secure payload delivery, and intelligent retry mechanisms.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="flex items-center justify-center gap-3 p-4 bg-white rounded-xl border border-orange-200">
            <Clock className="w-6 h-6 text-orange-500" />
            <span className="font-medium text-gray-700">Real-time Triggers</span>
          </div>
          
          <div className="flex items-center justify-center gap-3 p-4 bg-white rounded-xl border border-orange-200">
            <Shield className="w-6 h-6 text-orange-500" />
            <span className="font-medium text-gray-700">Secure Delivery</span>
          </div>
          
          <div className="flex items-center justify-center gap-3 p-4 bg-white rounded-xl border border-orange-200">
            <Zap className="w-6 h-6 text-orange-500" />
            <span className="font-medium text-gray-700">Smart Retries</span>
          </div>
        </div>
        
        <div className="mt-8 p-4 bg-white rounded-xl border border-orange-200">
          <p className="text-sm text-gray-500">
            💡 <strong>Good news:</strong> All other automation features are fully functional! 
            Create, test, and run your automations while we finish the webhook integration.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ComingSoonBanner;
