import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tag, X } from 'lucide-react';

interface PromoCodeSectionProps {
  promotionCode: string;
  onPromotionCodeChange: (code: string) => void;
  appliedPromotion: any;
  onApplyPromotion: () => void;
  onRemovePromotion: () => void;
  promotionDiscountAmount: number;
}

const PromoCodeSection: React.FC<PromoCodeSectionProps> = ({
  promotionCode,
  onPromotionCodeChange,
  appliedPromotion,
  onApplyPromotion,
  onRemovePromotion,
  promotionDiscountAmount
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl">
          <Tag className="h-5 w-5 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Promo Code</h3>
      </div>
      
      {!appliedPromotion ? (
        <div className="flex gap-2">
          <Input
            value={promotionCode}
            onChange={(e) => onPromotionCodeChange(e.target.value)}
            placeholder="Enter promo code"
            className="flex-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                onApplyPromotion();
              }
            }}
          />
          <Button 
            onClick={onApplyPromotion}
            variant="default"
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
          >
            Apply
          </Button>
        </div>
      ) : (
        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-700">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="default" className="bg-green-600">
                  {appliedPromotion.code}
                </Badge>
                <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                  {appliedPromotion.name}
                </span>
              </div>
              {appliedPromotion.description && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  {appliedPromotion.description}
                </p>
              )}
              <p className="text-sm font-bold text-green-700 dark:text-green-300">
                Discount: ₹{promotionDiscountAmount.toFixed(2)}
              </p>
            </div>
            <Button
              onClick={onRemovePromotion}
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromoCodeSection;
