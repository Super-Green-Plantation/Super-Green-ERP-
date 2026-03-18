import { Loader2 } from 'lucide-react'
import React from 'react'

const Loading = () => {
  return (
    <div className='flex flex-col items-center justify-center w-full h-screen'>
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      <p className='mt-5 text-lg text-slate-700 font-bold'>Loading ...</p>
    </div>
  )
}

export default Loading