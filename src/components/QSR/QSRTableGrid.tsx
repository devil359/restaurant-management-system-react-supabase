import { useQuery } from '@tanstack/react-query';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Users } from 'lucide-react';
import { useRestaurantId } from '@/hooks/useRestaurantId';

interface TableData {
    id: string;
    name: string;
    capacity: number;
    status: string;
}

interface QSRTableGridProps {
    onSelectTable: (table: TableData) => void;
    selectedTableId?: string | null;
}

export const QSRTableGrid = ({ onSelectTable, selectedTableId }: QSRTableGridProps) => {
    const { restaurantId } = useRestaurantId();
    const { data: tables = [], isLoading } = useQuery({
        queryKey: ['qsr-tables'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user found');

            const { data: userProfile } = await supabase
                .from('profiles')
                .select('restaurant_id')
                .eq('id', user.id)
                .single();

            if (!userProfile?.restaurant_id) {
                throw new Error('No restaurant found');
            }

            const { data } = await supabase
                .from('restaurant_tables')
                .select('*')
                .eq('restaurant_id', userProfile.restaurant_id)
                .order('name');

            return data as TableData[] || [];
        },
    });

    // Real-time subscription for table updates
    useRealtimeSubscription({
        table: 'restaurant_tables',
        queryKey: ['qsr-tables'],
    });

    // Fetch active kitchen orders to infer table occupancy
    const { data: activeOrders = [] } = useQuery({
        queryKey: ['active-table-orders', restaurantId],
        queryFn: async () => {
            if (!restaurantId) return [];
            const { data, error } = await supabase
                .from('kitchen_orders')
                .select('source')
                .eq('restaurant_id', restaurantId)
                .in('status', ['new', 'preparing', 'ready', 'held']);

            if (error) {
                console.error("Error fetching active orders:", error);
                return [];
            }
            return data.map(o => o.source);
        },
        // Refetch often or rely on realtime (kitchen_orders is subscribed to in QSRPosMain? No, creating new subscription here if needed)
        refetchInterval: 5000
    });

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading tables...</div>;
    }

    return (
        <div className="p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 auto-rows-[100px]">
            {tables.map((table) => {
                const isSelected = selectedTableId === table.id;

                // Check direct status (case insensitive)
                let isOccupied = table.status?.toLowerCase() === 'occupied';

                // Also check if any active order exists for this table
                // Matches "Table X", "POS-Table X", etc.
                if (!isOccupied && activeOrders.length > 0) {
                    isOccupied = activeOrders.some(source =>
                        source.toLowerCase().includes(table.name.toLowerCase())
                    );
                }

                return (
                    <button
                        key={table.id}
                        onClick={() => onSelectTable(table)}
                        className={cn(
                            "flex flex-col items-center justify-center p-4 rounded-xl transition-all active:scale-95 shadow-md border-2",
                            isSelected
                                ? "border-primary ring-2 ring-primary ring-offset-2"
                                : "border-transparent",
                            // Status colors per user requirement
                            !isOccupied // Available
                                ? "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200"
                                : "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200" // Occupied
                        )}
                    >
                        <span className="text-xl font-bold mb-1">{table.name}</span>
                        <div className="flex items-center gap-1 text-xs opacity-80">
                            <Users className="w-3 h-3" />
                            <span>{table.capacity}</span>
                        </div>
                        <span className="text-[10px] uppercase font-semibold mt-1 opacity-70">
                            {isOccupied ? 'OCCUPIED' : table.status}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};
