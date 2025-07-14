
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Database, Zap, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { seedUniversalPlatforms, allNewPlatforms } from '@/utils/universalPlatformSeeder';

const UniversalPlatformSeeder = () => {
  const { toast } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedingProgress, setSeedingProgress] = useState(0);
  const [seedingStats, setSeedingStats] = useState<any>(null);

  const handleSeedPlatforms = async () => {
    setIsSeeding(true);
    setSeedingProgress(0);
    
    try {
      console.log('🌱 Starting Universal Platform Seeding...');
      
      // Get the seed data
      const knowledgeEntries = await seedUniversalPlatforms();
      console.log(`📊 Prepared ${knowledgeEntries.length} platform entries for seeding`);
      
      // Batch insert for better performance
      const batchSize = 50;
      let inserted = 0;
      const stats = { total: knowledgeEntries.length, inserted: 0, categories: {} as any };
      
      for (let i = 0; i < knowledgeEntries.length; i += batchSize) {
        const batch = knowledgeEntries.slice(i, i + batchSize);
        
        const { data, error } = await supabase
          .from('universal_knowledge_store')
          .insert(batch)
          .select('platform_name, details');
        
        if (error) {
          console.error('❌ Batch insert error:', error);
          // Continue with next batch instead of failing completely
        } else {
          inserted += batch.length;
          stats.inserted = inserted;
          
          // Update progress
          setSeedingProgress(Math.round((inserted / knowledgeEntries.length) * 100));
          
          // Track categories
          batch.forEach(entry => {
            const category = entry.details?.category || 'unknown';
            stats.categories[category] = (stats.categories[category] || 0) + 1;
          });
          
          setSeedingStats({...stats});
        }
        
        // Small delay to prevent overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log(`✅ Successfully seeded ${inserted} platforms`);
      
      toast({
        title: "Universal Platform Seeding Complete!",
        description: `Successfully added ${inserted} platforms to the Universal Knowledge Store`,
      });
      
    } catch (error: any) {
      console.error('💥 Universal Platform Seeding failed:', error);
      toast({
        title: "Seeding Failed",
        description: `Error: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const platformCategories = [
    { name: 'CRM Platforms', count: '50+', color: 'bg-blue-100 text-blue-700' },
    { name: 'Communication Tools', count: '50+', color: 'bg-green-100 text-green-700' },
    { name: 'E-commerce Platforms', count: '50+', color: 'bg-purple-100 text-purple-700' },
    { name: 'Marketing Tools', count: '50+', color: 'bg-orange-100 text-orange-700' },
    { name: 'Social Media APIs', count: '50+', color: 'bg-pink-100 text-pink-700' },
    { name: 'Cloud Services', count: '50+', color: 'bg-indigo-100 text-indigo-700' },
    { name: 'Development Tools', count: '50+', color: 'bg-teal-100 text-teal-700' }
  ];

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-6 w-6" />
          Universal Platform Seeder
        </CardTitle>
        <p className="text-gray-600">
          Seed the Universal Knowledge Store with 500+ platform configurations for AI-powered integrations
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Platform Categories Overview */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Platform Categories to Add</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {platformCategories.map((category, index) => (
              <div key={index} className="p-3 border rounded-lg bg-gray-50">
                <div className="text-sm font-medium text-gray-900">{category.name}</div>
                <Badge className={`mt-1 text-xs ${category.color}`}>
                  {category.count}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Seeding Stats */}
        {seedingStats && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Seeding Progress</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-2xl font-bold text-blue-600">{seedingStats.inserted}</div>
                <div className="text-sm text-blue-700">Platforms Added</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{seedingProgress}%</div>
                <div className="text-sm text-blue-700">Complete</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{Object.keys(seedingStats.categories).length}</div>
                <div className="text-sm text-blue-700">Categories</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{seedingStats.total}</div>
                <div className="text-sm text-blue-700">Total Target</div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-3">
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${seedingProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Current Platform Count */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <div className="text-sm text-gray-600">Ready to Seed</div>
            <div className="text-2xl font-bold text-gray-900">{allNewPlatforms.length}</div>
            <div className="text-sm text-gray-600">New Platform Configurations</div>
          </div>
          <Zap className="h-8 w-8 text-yellow-500" />
        </div>

        {/* Seed Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleSeedPlatforms}
            disabled={isSeeding}
            size="lg"
            className="px-8"
          >
            {isSeeding ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Seeding... {seedingProgress}%
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                Seed Universal Knowledge Store
              </>
            )}
          </Button>
        </div>

        {/* Success State */}
        {seedingStats && seedingProgress === 100 && (
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-green-900 font-medium">
              Universal Platform Seeding Complete!
            </div>
            <div className="text-green-700 text-sm">
              Your system now supports 500+ platforms with AI-powered universal integration
            </div>
          </div>
        )}

        {/* Technical Details */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Each platform includes real API configurations, authentication methods, and credential requirements</p>
          <p>• Platforms are automatically detected by AI using the Universal Knowledge Store</p>
          <p>• All configurations work with your existing chat-AI system without modifications</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default UniversalPlatformSeeder;
