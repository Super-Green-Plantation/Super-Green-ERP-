import PlanSelector from "./PlanSelector";

export const ClientDetailsCard = ({ client, selectedInvestmentId, onInvestmentChange }: any) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider mb-1 block">Account Holder</span>
            <h2 className="text-2xl font-bold text-slate-900">{client.fullName}</h2>
          </div>
          <div className="flex flex-col items-end">
             <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase">
               Active Client
             </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">
          <DetailItem label="NIC Number" value={client.nic} />
          <DetailItem label="Primary Mobile" value={client.phoneMobile} />
          <DetailItem label="Home Branch" value={client.branch?.name} />
        </div>

        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
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

const DetailItem = ({ label, value }: { label: string; value: string }) => (
  <div className="space-y-1">
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
    <p className="text-sm font-semibold text-slate-700">{value || "—"}</p>
  </div>
);