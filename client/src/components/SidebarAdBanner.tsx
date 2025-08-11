import { useEffect, useState } from 'react';

interface SidebarAdBannerProps {
  position: 'left' | 'right';
  containerId: string;
  scriptSrc: string;
}

export function SidebarAdBanner({ position, containerId, scriptSrc }: SidebarAdBannerProps) {
  const [isProduction, setIsProduction] = useState(false);

  useEffect(() => {
    // Enable ads in all environments for testing
    setIsProduction(true);
    
    // Always load ads now
    let script: HTMLScriptElement | null = null;
    
    try {
      // Create and append the script tag for the sidebar ad
      script = document.createElement('script');
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.src = scriptSrc;
      script.setAttribute('data-cfasync', 'false');
      
      // Add error handling
      script.onerror = (e) => {
        console.warn(`Sidebar ad script failed to load (${position}), continuing normally`);
      };
      
      script.onload = () => {
        console.log(`Sidebar ad script loaded successfully (${position})`);
      };
      
      // Add global error handler for this script
      const errorHandler = (e: ErrorEvent) => {
        if (e.filename && e.filename.includes('profitableratecpm.com')) {
          e.preventDefault();
          e.stopPropagation();
          return true;
        }
        if (e.message && (e.message.includes('Z3 is not a function') || e.message === 'Script error.')) {
          e.preventDefault();
          e.stopPropagation();
          return true;
        }
      };
      
      window.addEventListener('error', errorHandler);
      document.head.appendChild(script);
      
      // Cleanup function
      return () => {
        window.removeEventListener('error', errorHandler);
        if (script && document.head.contains(script)) {
          document.head.removeChild(script);
        }
      };
    } catch (e) {
      console.warn(`Sidebar ad initialization failed silently (${position})`);
    }
  }, [scriptSrc, position]);

  return (
    <div className={`hidden xl:block fixed top-1/2 transform -translate-y-1/2 ${position === 'left' ? 'left-4' : 'right-4'} w-40 z-10`}>
      {isProduction ? (
        <div id={containerId} className="min-h-[600px]"></div>
      ) : (
        <div className="bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 min-h-[600px] flex items-center justify-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center transform -rotate-90">
            {position.charAt(0).toUpperCase() + position.slice(1)} Sidebar Ad
            <br />
            (Production only)
          </p>
        </div>
      )}
    </div>
  );
}