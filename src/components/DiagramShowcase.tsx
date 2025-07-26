/**
 * DIAGRAM SHOWCASE - Display automation diagrams when available
 * Connected to headquarters diagram data
 */

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Download, Share2 } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";

interface DiagramShowcaseProps {
  automationId: string;
  userId: string;
  className?: string;
}

const DiagramShowcase: React.FC<DiagramShowcaseProps> = ({
  automationId,
  userId,
  className = ""
}) => {
  const [diagramData, setDiagramData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDiagramData();
  }, [automationId]);

  const loadDiagramData = async () => {
    try {
      const { data, error } = await supabase
        .from('automation_diagrams')
        .select('*')
        .eq('automation_id', automationId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.log('No diagram found:', error);
        setDiagramData(null);
      } else {
        setDiagramData(data);
        console.log('📊 Diagram loaded:', { diagramId: data.id, hasData: !!data.diagram_data });
      }
    } catch (error) {
      console.error('Error loading diagram:', error);
      setDiagramData(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-32 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (!diagramData) {
    return (
      <div className={`p-4 border border-dashed border-gray-300 rounded-lg text-center ${className}`}>
        <p className="text-sm text-gray-500">Diagram will appear here once automation is processed</p>
      </div>
    );
  }

  const metadata = diagramData.diagram_data?.metadata || {};

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Eye className="w-4 h-4 text-blue-600" />
          Automation Diagram
          <span className="text-xs text-gray-500 ml-auto">
            {metadata.totalSteps || 0} steps
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-xs text-gray-600 space-y-1">
          <div>Generated: {new Date(diagramData.created_at).toLocaleDateString()}</div>
          {metadata.platforms && (
            <div>Platforms: {metadata.platforms.join(', ')}</div>
          )}
          {metadata.routePathsTerminated && (
            <div>Routes: {metadata.routePathsTerminated}</div>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="text-xs h-7">
            <Eye className="w-3 h-3 mr-1" />
            View
          </Button>
          <Button size="sm" variant="outline" className="text-xs h-7">
            <Download className="w-3 h-3 mr-1" />
            Export
          </Button>
          <Button size="sm" variant="outline" className="text-xs h-7">
            <Share2 className="w-3 h-3 mr-1" />
            Share
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DiagramShowcase;