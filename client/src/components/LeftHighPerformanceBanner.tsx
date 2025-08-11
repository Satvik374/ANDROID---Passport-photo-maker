import { useEffect, useRef } from 'react';

export function LeftHighPerformanceBanner() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;

    try {
      const bannerId = `hp-banner-left-${Date.now()}`;
      
      // Add placeholder content immediately
      if (containerRef.current) {
        containerRef.current.innerHTML = `
          <div style="width: 160px; height: 600px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; text-align: center; padding: 10px;">
            <div>
              <div style="margin-bottom: 10px;">📱</div>
              <div>Left<br/>Banner<br/>Loading...</div>
            </div>
          </div>
        `;
      }

      // Create a delay to avoid conflicts with other ads
      setTimeout(() => {
        if (containerRef.current) {
          const bannerHtml = `
            <div id="${bannerId}">
              <script type="text/javascript">
                (function() {
                  var atOptions = {
                    'key' : 'a12a61dfdb60134814b041c214df9587',
                    'format' : 'iframe',
                    'height' : 600,
                    'width' : 160,
                    'params' : {}
                  };
                  window.atOptions = atOptions;
                })();
              </script>
              <script type="text/javascript" src="//www.highperformanceformat.com/a12a61dfdb60134814b041c214df9587/invoke.js"></script>
            </div>
          `;

          containerRef.current.innerHTML = bannerHtml;
          console.log('Left High Performance Banner loaded');
        }
      }, 500);

      return () => {
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }
      };
    } catch (e) {
      console.warn('Left High Performance Banner initialization failed');
    }
  }, []);

  return (
    <div className="hidden 3xl:block fixed top-32 left-1 w-40 min-h-[600px] z-20" style={{ left: '0px' }}>
      <div 
        ref={containerRef}
        className="w-full h-full bg-white dark:bg-slate-800 border-2 border-blue-300 dark:border-blue-600 rounded-lg p-1 shadow-lg"
        style={{ minHeight: '600px' }}
      />
    </div>
  );
}