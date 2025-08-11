import { useEffect, useRef } from 'react';

interface HighPerformanceBannerProps {
  position: 'left' | 'right';
  bannerId: string;
}

export function HighPerformanceBanner({ position, bannerId }: HighPerformanceBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;

    try {
      // Set atOptions in the global window object
      (window as any).atOptions = {
        'key': 'a12a61dfdb60134814b041c214df9587',
        'format': 'iframe',
        'height': 600,
        'width': 160,
        'params': {}
      };

      // Create the invoke script
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = '//www.highperformanceformat.com/a12a61dfdb60134814b041c214df9587/invoke.js';
      script.async = true;
      
      script.onload = () => {
        console.log(`High Performance Banner ${position} loaded and should be visible`);
      };
      
      script.onerror = () => {
        console.warn(`High Performance Banner ${position} failed to load`);
      };

      // Append the script to the container
      containerRef.current.appendChild(script);

      return () => {
        try {
          if (containerRef.current && containerRef.current.contains(script)) {
            containerRef.current.removeChild(script);
          }
        } catch (e) {
          // Ignore cleanup errors
        }
      };
    } catch (e) {
      console.warn(`High Performance Banner ${position} initialization failed`);
    }
  }, [position]);

  return (
    <div 
      className={`hidden xl:block fixed top-20 ${
        position === 'left' ? 'left-48' : 'right-48'
      } w-40 min-h-[600px] z-10`}
    >
      <div 
        ref={containerRef}
        id={bannerId}
        className="w-full h-full"
      >
        {/* Ad content will be injected here */}
      </div>
    </div>
  );
}