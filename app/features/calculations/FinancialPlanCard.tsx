// components/FinancialPlanCard.tsx
import { FinancialPlan } from "@/app/types/FinancialPlan";

interface CardProps {
  plan: FinancialPlan;
  isSelected: boolean;
  onSelect: (id: number) => void;
}

const FinancialPlanCard = ({ plan, isSelected, onSelect }: CardProps) => {
  return (
    <div
      onClick={() => onSelect(plan.id)}
      className={`cursor-pointer p-6 rounded-xl border-2 transition-all duration-200 shadow-sm
        ${isSelected 
          ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200" 
          : "border-gray-200 bg-white hover:border-gray-300"
        }`}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
        {isSelected && (
          <span className="bg-blue-500 text-white p-1 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </span>
        )}
      </div>
      
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{plan.description}</p>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-400 uppercase text-xs font-semibold">Rate</p>
          <p className="font-medium text-green-600">{plan.rate}% APR</p>
        </div>
        <div>
          <p className="text-gray-400 uppercase text-xs font-semibold">Duration</p>
          <p className="font-medium">{plan.duration} Months</p>
        </div>
      </div>
    </div>
  );
};

export default FinancialPlanCard;