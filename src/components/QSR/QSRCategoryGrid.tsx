
import { cn } from "@/lib/utils";

interface Category {
    id: string;
    name: string;
}

interface QSRCategoryGridProps {
    categories: Category[];
    selectedCategory: string;
    onSelectCategory: (id: string) => void;
}

// Predefined pleasant colors for categories to mimic the reference image
const CATEGORY_COLORS = [
    "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200",
    "bg-red-100 text-red-800 hover:bg-red-200 border-red-200",
    "bg-pink-100 text-pink-800 hover:bg-pink-200 border-pink-200",
    "bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-200",
    "bg-indigo-100 text-indigo-800 hover:bg-indigo-200 border-indigo-200",
    "bg-cyan-100 text-cyan-800 hover:bg-cyan-200 border-cyan-200",
    "bg-teal-100 text-teal-800 hover:bg-teal-200 border-teal-200",
    "bg-lime-100 text-lime-800 hover:bg-lime-200 border-lime-200",
    "bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200",
    "bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200",
];

export const QSRCategoryGrid = ({ categories, selectedCategory, onSelectCategory }: QSRCategoryGridProps) => {
    return (
        <div className="p-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {categories.map((category, index) => {
                const colorClass = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
                const isSelected = selectedCategory === category.id;

                return (
                    <button
                        key={category.id}
                        onClick={() => onSelectCategory(category.id)}
                        className={cn(
                            "h-16 px-2 py-1 rounded-lg text-sm font-bold uppercase transition-all shadow-sm border-b-4 active:border-b-0 active:translate-y-1 truncate leading-tight flex items-center justify-center text-center break-words whitespace-normal",
                            colorClass,
                            isSelected && "ring-2 ring-primary ring-offset-2 brightness-90 border-b-0 translate-y-1"
                        )}
                    >
                        {category.name}
                    </button>
                );
            })}
        </div>
    );
};
