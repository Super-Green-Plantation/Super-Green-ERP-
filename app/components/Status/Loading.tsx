import { Loader2 } from 'lucide-react'

const Loading = () => {
  return (
    <div className='flex flex-col items-center justify-center w-full h-screen'>
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
      <p className='mt-5 text-lg text-foreground font-bold'>Loading ...</p>
    </div>
  )
}

export default Loading
