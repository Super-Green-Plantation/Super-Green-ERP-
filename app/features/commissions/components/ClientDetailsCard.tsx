import PlanSelector from "./PlanSelector";

interface ClientDetailsCardProps {
  client: any;
  selectedInvestmentId: number | null;
  onInvestmentChange: (id: number | null) => void;
}

const ClientDetailsCard = ({
  client,
  selectedInvestmentId,
  onInvestmentChange,
}: ClientDetailsCardProps) => {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-md transition-shadow hover:shadow-lg">
      <div className="border-l-4 border-green-500 bg-gray-50/50 p-4">
        <h2 className="text-xl font-bold tracking-tight text-gray-900">
          {client.fullName}
        </h2>
      </div>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              NIC
            </span>
            <span className="font-medium text-gray-700">{client.nic}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Mobile
            </span>
            <span className="font-medium text-gray-700">
              {client.phoneMobile}
            </span>
          </div>
          <div className="flex flex-col col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Branch
            </span>
            <span className="font-medium text-gray-700">
              {client.branch?.name}
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-50">
          <PlanSelector
            investments={client.investments}
            selectedInvestmentId={selectedInvestmentId}
            onChange={onInvestmentChange}
          />
        </div>
      </div>
    </div>
  );
};

export default ClientDetailsCard;
