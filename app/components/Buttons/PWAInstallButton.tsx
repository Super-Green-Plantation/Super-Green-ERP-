"use client";

import { usePWAInstall } from "@/app/hooks/usePWAInstall";
import { Download, Smartphone } from "lucide-react";
import { useState, useEffect } from "react";

export function PWAInstallButton() {
  const { canInstall, isInstalled, install } = usePWAInstall();
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showManualGuide, setShowManualGuide] = useState(false);

  useEffect(() => {
    setIsIOS(/iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase()));
  }, []);

  if (isInstalled) return null;

  // Android/Desktop Chrome — native prompt available
  if (canInstall) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-2 rounded-md bg-green-700 px-4 py-2 text-sm text-white hover:bg-green-800"
      >
        <Download size={16} />
        Install App
      </button>
    );
  }

  // iOS Safari — manual share sheet guide
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-2 rounded-md bg-green-700 px-4 py-2 text-sm text-white hover:bg-green-800"
        >
          <Smartphone size={16} />
          Install App
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
            <div className="w-full rounded-t-2xl bg-white p-6 shadow-xl">
              <h3 className="mb-3 text-base font-semibold text-gray-800">
                Install SGP ERP on iPhone
              </h3>
              <ol className="space-y-2 text-sm text-gray-600">
                <li>1. Tap the <strong>Share</strong> button at the bottom of Safari</li>
                <li>2. Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                <li>3. Tap <strong>Add</strong> in the top right</li>
              </ol>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-md bg-gray-100 py-2 text-sm font-medium text-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Brave, Firefox, Samsung Internet, or any browser that blocks the prompt
  return (
    <>
      <button
        onClick={() => setShowManualGuide(true)}
        className="flex items-center gap-2 rounded-md bg-green-700 px-4 py-2 text-sm text-white hover:bg-green-800"
      >
        <Download size={16} />
        Install App
      </button>

      {showManualGuide && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
          <div className="w-full rounded-t-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-3 text-base font-semibold text-gray-800">
              Install SGP ERP
            </h3>
            <p className="mb-3 text-sm text-gray-500">
              Your browser doesn't support automatic install. Follow these steps:
            </p>
            <ol className="space-y-2 text-sm text-gray-600">
              <li>1. Tap the <strong>⋮ menu</strong> (top right)</li>
              <li>2. Tap <strong>"Add to Home Screen"</strong> or <strong>"Install App"</strong></li>
              <li>3. Confirm by tapping <strong>Add</strong></li>
            </ol>
            <p className="mt-3 text-xs text-gray-400">
              On Brave: you may need to use Chrome for one-tap install.
            </p>
            <button
              onClick={() => setShowManualGuide(false)}
              className="mt-5 w-full rounded-md bg-gray-100 py-2 text-sm font-medium text-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}