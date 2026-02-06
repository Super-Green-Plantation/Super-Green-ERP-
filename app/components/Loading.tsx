import { Loader2 } from 'lucide-react'
import React from 'react'

const Loading = () => {
  return (
     <div className="flex flex-col items-center justify-center py-20">
        <div className="relative">
          {/* Outer Ring Animation */}
          <div className="absolute inset-0 rounded-full border-2 border-blue-100 animate-ping opacity-25" />
          <div className="relative  p-4 rounded-full border border-slate-100 shadow-sm">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        </div>
        <h3 className="mt-6 text-sm font-black text-slate-900 uppercase tracking-[0.3em]">
          Syncing
        </h3>
        <p className="mt-1 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          Accessing Secure Database...
        </p>
      </div>
  )
}

export default Loading