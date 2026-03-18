"use client"

import { useState } from "react"

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)

    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="px-3 py-2 bg-slate-900 text-white rounded-lg"
    >
      {copied ? "Copied ✅" : "Copy Link"}
    </button>
  )
}