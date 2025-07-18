import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useChannelManagement } from "@/hooks/useChannelManagement";
import { DollarSign, TrendingUp, TrendingDown, Percent } from "lucide-react";

interface PriceManagementProps {
  channels: any[];
}

const PriceManagement = ({ channels }: PriceManagementProps) => {
  const { bulkUpdatePrices } = useChannelManagement();
  const [basePrice, setBasePrice] = useState<number>(5000);
  const [adjustmentType, setAdjustmentType] = useState<'percentage' | 'fixed'>('percentage');
  const [adjustmentValue, setAdjustmentValue] = useState<number>(10);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);

  const calculateChannelPrice = (channel: any, basePrice: number) => {
    const commissionRate = channel.commission_rate || 0;
    let adjustedPrice = basePrice;

    if (adjustmentType === 'percentage') {
      adjustedPrice = basePrice * (1 + adjustmentValue / 100);
    } else {
      adjustedPrice = basePrice + adjustmentValue;
    }

    // Account for channel commission
    const finalPrice = adjustedPrice * (1 + commissionRate / 100);
    return Math.round(finalPrice);
  };

  const handlePriceUpdate = async () => {
    const channelsToUpdate = selectedChannels.length > 0 ? selectedChannels : channels.map(c => c.id);
    const finalPrice = calculateChannelPrice({ commission_rate: 0 }, basePrice);
    
    await bulkUpdatePrices.mutateAsync({
      priceAdjustment: finalPrice,
      channels: channelsToUpdate
    });
  };

  const toggleChannelSelection = (channelId: string) => {
    setSelectedChannels(prev => 
      prev.includes(channelId) 
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId]
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Price Management Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Base Price Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="base-price">Base Room Rate (₹)</Label>
              <Input
                id="base-price"
                type="number"
                value={basePrice}
                onChange={(e) => setBasePrice(Number(e.target.value))}
                placeholder="5000"
              />
            </div>
            <div>
              <Label htmlFor="adjustment-type">Adjustment Type</Label>
              <Select value={adjustmentType} onValueChange={(value: 'percentage' | 'fixed') => setAdjustmentType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="adjustment-value">
                Adjustment Value {adjustmentType === 'percentage' ? '(%)' : '(₹)'}
              </Label>
              <Input
                id="adjustment-value"
                type="number"
                value={adjustmentValue}
                onChange={(e) => setAdjustmentValue(Number(e.target.value))}
                placeholder={adjustmentType === 'percentage' ? '10' : '500'}
              />
            </div>
          </div>

          {/* Channel Selection */}
          <div>
            <Label className="text-base font-semibold">Select Channels to Update</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
              {channels.map((channel) => (
                <Card 
                  key={channel.id} 
                  className={`cursor-pointer transition-all border-2 ${
                    selectedChannels.includes(channel.id) || selectedChannels.length === 0
                      ? 'border-primary bg-primary/5' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleChannelSelection(channel.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{channel.channel_name}</h4>
                      <Badge variant={channel.is_active ? 'default' : 'secondary'} className="text-xs">
                        {channel.channel_type.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Commission:</span>
                        <span>{channel.commission_rate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Final Price:</span>
                        <span className="font-mono font-semibold">
                          ₹{calculateChannelPrice(channel, basePrice).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {selectedChannels.length === 0 
                ? 'All channels will be updated' 
                : `${selectedChannels.length} channel(s) selected`}
            </p>
          </div>

          {/* Price Preview */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Price Summary
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Base Rate</div>
                  <div className="font-mono font-semibold">₹{basePrice.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Adjustment</div>
                  <div className="font-mono font-semibold flex items-center gap-1">
                    {adjustmentType === 'percentage' ? (
                      <><Percent className="w-3 h-3" />{adjustmentValue}</>
                    ) : (
                      <>₹{adjustmentValue}</>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Avg Commission</div>
                  <div className="font-mono font-semibold">
                    {channels.length > 0 
                      ? (channels.reduce((sum, c) => sum + c.commission_rate, 0) / channels.length).toFixed(1)
                      : 0}%
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Avg Final Price</div>
                  <div className="font-mono font-semibold text-lg">
                    ₹{channels.length > 0 
                      ? Math.round(channels.reduce((sum, c) => sum + calculateChannelPrice(c, basePrice), 0) / channels.length).toLocaleString()
                      : 0}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Update Button */}
          <Button 
            onClick={handlePriceUpdate}
            className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
            disabled={bulkUpdatePrices.isPending}
          >
            {bulkUpdatePrices.isPending ? (
              "Updating Prices..."
            ) : (
              `Update Prices Across ${selectedChannels.length === 0 ? 'All' : selectedChannels.length} Channel(s)`
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PriceManagement;