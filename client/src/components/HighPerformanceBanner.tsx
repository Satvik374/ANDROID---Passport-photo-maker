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
      // Create a unique variable name for this banner instance
      const optionsVar = `atOptions_${position}_${Date.now()}`;
      
      // Set options in window with unique name
      (window as any)[optionsVar] = {
        'key': 'a12a61dfdb60134814b041c214df9587',
        'format': 'iframe',
        'height': 600,
        'width': 160,
        'params': {}
      };

      // Create a wrapper div with inline scripts
      const bannerHtml = `
        <div>
          <script type="text/javascript">
            atOptions = {
              'key' : 'a12a61dfdb60134814b041c214df9587',
              'format' : 'iframe',
              'height' : 600,
              'width' : 160,
              'params' : {}
            };
          </script>
          <script type="text/javascript" src="//www.highperformanceformat.com/a12a61dfdb60134814b041c214df9587/invoke.js"></script>
        </div>
      `;

      // Inject the banner HTML directly
      containerRef.current.innerHTML = bannerHtml;
      
      console.log(`High Performance Banner ${position} loaded and should be visible`);

      return () => {
        try {
          if (containerRef.current) {
            containerRef.current.innerHTML = '';
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
        position === 'left' ? 'left-2' : 'right-2'
      } w-40 min-h-[600px] z-10`}
    >
      <div 
        ref={containerRef}
        id={bannerId}
        className="w-full h-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-600 rounded-lg p-2"
      >
        {/* Ad content will be injected here */}
      </div>
    </div>
  );
}