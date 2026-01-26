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
    <div className="rounded-xl border bg-white p-5 shadow-sm space-y-3 border-l-4 border-green-500">
      <h2 className="text-lg font-bold text-gray-800">
        {client.fullName}
      </h2>

      <div className="grid grid-cols-1 gap-2 text-sm text-gray-600">
        <p>
          <span className="font-medium text-gray-400">NIC:</span>{" "}
          {client.nic}
        </p>

        <p>
          <span className="font-medium text-gray-400">Mobile:</span>{" "}
          {client.phoneMobile}
        </p>

        <p>
          <span className="font-medium text-gray-400">Branch:</span>{" "}
          {client.branch?.name}
        </p>

        <PlanSelector
          investments={client.investments}
          selectedInvestmentId={selectedInvestmentId}
          onChange={onInvestmentChange}
        />
      </div>
    </div>
  );
};

export default ClientDetailsCard;
