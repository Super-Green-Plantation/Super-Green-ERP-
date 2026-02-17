import React from 'react';
import { Briefcase, Calendar } from 'lucide-react';

const ClientInvestmentTable = ({ investments }: { investments: any }) => {

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Investment Details
            </th>
            <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Status
            </th>
            <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">
              Ref Number
            </th>
            <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">
              Amount
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 bg-white">
          {/* {investments.map((item: any) => (
            <tr key={item.id} className="hover:bg-blue-50/20 transition-all">
              <td className="px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      Client ID: {item.clientId}
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.investmentDate).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-5">
                <span className={`px-2.5 py-1 text-[9px] font-black rounded-md tracking-tighter uppercase ${
                  item.commissionsProcessed 
                    ? "bg-green-100 text-green-700" 
                    : "bg-amber-100 text-amber-700"
                }`}>
                  {item.commissionsProcessed ? "Processed" : "Pending"}
                </span>
              </td>
              <td className="px-6 py-5 text-right font-medium text-gray-400 text-xs">
                {item.refNumber || "N/A"}
              </td>
              <td className="px-6 py-5 text-right">
                <p className="text-base font-black text-gray-900">
                  <span className="text-[10px] mr-1 text-gray-400 font-normal">Rs.</span>
                  {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </td>
            </tr>
          ))} */}
        </tbody>
        <tfoot>
          <tr className="bg-gray-900 text-white">
            <td
              colSpan={3}
              className="px-6 py-6 text-right text-[10px] font-black uppercase tracking-widest"
            >
              Total Portfolio Value
            </td>
            <td className="px-6 py-6 text-right">
              <p className="text-2xl font-black">
                <span className="text-xs mr-1 font-medium text-gray-400">
                  Rs.
                </span>
              </p>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default ClientInvestmentTable;