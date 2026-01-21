import React from 'react'

const Model = () => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    
    >
      <div
        className="w-full max-w-md bg-white rounded-lg p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
        >
          ✕
        </button>


        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Branch Name
            </label>
            <input
              type="text"
            //   value={name}
            //   onChange={(e) => setName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <input
              type="text"
            //   value={location}
            //   onChange={(e) => setLocation(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <button
            type="submit"
           
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  )
}

export default Model