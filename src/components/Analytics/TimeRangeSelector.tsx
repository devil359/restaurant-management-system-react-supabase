
import React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface TimeRangeSelectorProps {
  timeRange: string;
  setTimeRange: (value: string) => void;
}

const TimeRangeSelector = ({ timeRange, setTimeRange }: TimeRangeSelectorProps) => {
  return (
    <div className="flex flex-col space-y-2">
      <h3 className="text-sm font-medium">Time Range</h3>
      <RadioGroup 
        value={timeRange} 
        onValueChange={setTimeRange}
        className="flex space-x-4"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="7" id="r1" />
          <Label htmlFor="r1">7 Days</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="30" id="r2" />
          <Label htmlFor="r2">30 Days</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="90" id="r3" />
          <Label htmlFor="r3">90 Days</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="365" id="r4" />
          <Label htmlFor="r4">1 Year</Label>
        </div>
      </RadioGroup>
    </div>
  );
};

export default TimeRangeSelector;
