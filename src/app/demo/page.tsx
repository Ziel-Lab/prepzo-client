"use client";

import React, { useState } from 'react';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';
import WhiteLabelTools from '@/components/white-label/WhiteLabelTools';
import WhiteLabelMockInterview from '@/components/white-label/WhiteLabelMockInterview';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { partnerConfigs } from '@/config/white-label';

const DemoPage = () => {
  const { config, updateConfig, isWhiteLabel } = useWhiteLabel();
  const [selectedPartner, setSelectedPartner] = useState('prepzo');

  const handlePartnerChange = (partnerId: string) => {
    setSelectedPartner(partnerId);
    if (partnerId === 'prepzo') {
      // Reset to default config
      window.location.reload();
    } else if (partnerConfigs[partnerId]) {
      updateConfig(partnerConfigs[partnerId]);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-6xl">
        {/* Demo Controls */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>White-Label Demo Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <label className="text-sm font-medium">Select Partner:</label>
              <Select value={selectedPartner} onValueChange={handlePartnerChange}>
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prepzo">Prepzo AI (Default)</SelectItem>
                  <SelectItem value="partner-university">CareerHub Pro (University)</SelectItem>
                  <SelectItem value="corporate-partner">TalentBoost (Corporate)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isWhiteLabel ? "default" : "secondary"}>
                {isWhiteLabel ? "White-Label Mode" : "Default Mode"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Current Brand: {config.brandName}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Brand Information */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Current Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Brand Name</div>
                <div className="font-semibold">{config.brandName}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Primary Color</div>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: config.primaryColor }}
                  />
                  <span className="font-mono text-sm">{config.primaryColor}</span>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Partner ID</div>
                <div className="font-semibold">{config.partnerId}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Support Email</div>
                <div className="font-semibold">{config.supportEmail}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enabled Features */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Enabled Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(config.enabledFeatures).map(([feature, enabled]) => (
                <div key={feature} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-sm capitalize">
                    {feature.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tools Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Career Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <WhiteLabelTools showHeader={false} />
          </CardContent>
        </Card>

        {/* Mock Interview Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Mock Interview Feature</CardTitle>
          </CardHeader>
          <CardContent>
            <WhiteLabelMockInterview showHeader={false} />
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Use This Demo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">1. Partner Selection</h4>
                <p className="text-sm text-muted-foreground">
                  Use the dropdown above to switch between different partner configurations. 
                  Notice how the branding, colors, and available features change.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">2. Feature Toggles</h4>
                <p className="text-sm text-muted-foreground">
                  Each partner can have different features enabled. For example, 
                  the university partner has job search disabled.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">3. Real Implementation</h4>
                <p className="text-sm text-muted-foreground">
                  In production, this would be controlled by environment variables 
                  or subdomain detection. See the setup guide for more details.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DemoPage;
