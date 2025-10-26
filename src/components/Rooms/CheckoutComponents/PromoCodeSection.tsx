import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tag, X } from 'lucide-react';
import { Separator } from "@/components/ui/separator";

interface PromoCodeSectionProps {
  promotionCode: string;
  onPromotionCodeChange: (code: string) => void;
  appliedPromotion: any;
  onApplyPromotion: () => void;
  onRemovePromotion: () => void;
  promotionDiscountAmount: number;
  activePromotions?: any[];
}

const PromoCodeSection: React.FC<PromoCodeSectionProps> = ({
  promotionCode,
  onPromotionCodeChange,
  appliedPromotion,
  onApplyPromotion,
  onRemovePromotion,
  promotionDiscountAmount,
  activePromotions = []
}) => {
  
  const handleSelectPromotion = (promo: any) => {
    onPromotionCodeChange(promo.promotion_code || '');
    // Trigger apply with a small delay to ensure state is updated
    setTimeout(() => {
      onApplyPromotion();
    }, 50);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl">
          <Tag className="h-5 w-5 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Promo Code</h3>
      </div>
      
      {!appliedPromotion ? (
        <>
          {/* Show active promotions list */}
          {activePromotions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Available Promotions:</p>
              <div className="grid gap-2 max-h-40 overflow-y-auto pr-1">
                {activePromotions.map((promo) => (
                  <div
                    key={promo.id}
                    onClick={() => handleSelectPromotion(promo)}
                    className="p-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 dark:hover:from-amber-900/20 dark:hover:to-orange-900/20 hover:border-amber-400 dark:hover:border-amber-600 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge variant="secondary" className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200">
                            {promo.promotion_code}
                          </Badge>
                          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                            {promo.name}
                          </span>
                        </div>
                        {promo.description && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                            {promo.description}
                          </p>
                        )}
                      </div>
                      <span className="text-sm font-bold text-green-600 dark:text-green-400 whitespace-nowrap">
                        {promo.discount_percentage ? `${promo.discount_percentage}% off` : `₹${promo.discount_amount} off`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <Separator className="my-3" />
              <p className="text-xs text-muted-foreground">Or enter a code manually:</p>
            </div>
          )}
          
          {/* Manual code entry */}
          <div className="flex gap-2">
            <Input
              value={promotionCode}
              onChange={(e) => onPromotionCodeChange(e.target.value)}
              placeholder="Enter promotion code"
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
        </>
      ) : (
        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border-2 border-green-300 dark:border-green-700">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
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
              className="text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20 ml-2"
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
