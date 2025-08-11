import { useEffect, useState } from 'react';

export function NativeBanner() {
  const [isProduction, setIsProduction] = useState(false);

  useEffect(() => {
    // Enable ads in all environments for testing
    setIsProduction(true);
    
    // Always load ads now
    let script: HTMLScriptElement | null = null;
    
    try {
      // Create and append the script tag for the native banner
      script = document.createElement('script');
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.src = 'https://pl27394978.profitableratecpm.com/e1ff802a0bf99100990e2f442ac0d82e/invoke.js';
      script.setAttribute('data-cfasync', 'false');
      
      // Add error handling
      script.onerror = (e) => {
        console.warn('Native banner script failed to load, continuing normally');
      };
      
      script.onload = () => {
        console.log('Native banner script loaded successfully');
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
      console.warn('Native banner initialization failed silently');
    }
  }, []);

  return (
    <div className="w-full flex justify-center py-4">
      {isProduction ? (
        <div id="container-e1ff802a0bf99100990e2f442ac0d82e"></div>
      ) : (
        <div className="bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg px-6 py-3">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Native Banner Ad (Will show on production domain)
          </p>
        </div>
      )}
    </div>
  );
}