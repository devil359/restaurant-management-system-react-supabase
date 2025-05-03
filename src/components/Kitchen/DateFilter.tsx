
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DateFilterProps {
  value: string;
  onChange: (value: string) => void;
}

const DateFilter = ({ value, onChange }: DateFilterProps) => {
  return (
    <div className="mb-4">
      <Tabs value={value} onValueChange={onChange} className="w-full">
        <TabsList className="grid grid-cols-4 w-full max-w-md bg-gray-100 dark:bg-gray-800">
          <TabsTrigger 
            value="today" 
            className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
          >
            Today
          </TabsTrigger>
          <TabsTrigger 
            value="yesterday"
            className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
          >
            Yesterday
          </TabsTrigger>
          <TabsTrigger 
            value="last7days"
            className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
          >
            Last 7 Days
          </TabsTrigger>
          <TabsTrigger 
            value="thisMonth"
            className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
          >
            This Month
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};

export default DateFilter;
