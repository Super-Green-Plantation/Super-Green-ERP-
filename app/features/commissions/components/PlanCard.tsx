import React from "react";

const PlanCard = ({ plans }: { plans: any[] }) => {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold uppercase text-blue-600 px-1">
        Active Plan
      </h2>
      {!plans || plans.length === 0 ? (
        <div className="h-32 flex items-center justify-center border-2 border-dashed rounded-xl text-gray-400 text-sm italic bg-gray-50">
          No plan details found
        </div>
      ) : (
        plans.map((p:any) => (
          // <PlanCard p={p} />
          <div
            key={p.id}
            className="rounded-xl border bg-linear-to-br from-blue-50 to-white p-5 shadow-md border-t-4 border-t-blue-600"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-black text-blue-900 tracking-tight">
                {p.name}
              </h3>
              <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded">
                {p.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-y-4">
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold">
                  Investment
                </p>
                <p className="text-lg font-bold text-gray-900">
                  Rs. {p.investment?.toLocaleString() ?? "0"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold">
                  Interest Rate
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {p.rate}%
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold">
                  Duration
                </p>
                <p className="font-semibold text-gray-700">
                  {p.duration} Months
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold">
                  Type
                </p>
                <p className="font-semibold text-gray-700 uppercase">
                  {p.description}
                </p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default PlanCard;
