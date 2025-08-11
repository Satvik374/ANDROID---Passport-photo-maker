interface DirectLinkAdProps {
  className?: string;
  text?: string;
  style?: 'button' | 'text' | 'banner';
}

export function DirectLinkAd({ className = '', text = 'Sponsored Link', style = 'text' }: DirectLinkAdProps) {
  const handleClick = () => {
    window.open('https://www.profitableratecpm.com/xk5edpyj?key=77b2377b748b143464b5d31237ad4da0', '_blank');
  };

  if (style === 'button') {
    return (
      <a 
        href="https://www.profitableratecpm.com/xk5edpyj?key=77b2377b748b143464b5d31237ad4da0"
        target="_blank" 
        rel="noopener noreferrer"
        className={`inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl ${className}`}
      >
        {text}
      </a>
    );
  }

  if (style === 'banner') {
    return (
      <div className={`bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 p-4 rounded-lg border ${className}`}>
        <a 
          href="https://www.profitableratecpm.com/xk5edpyj?key=77b2377b748b143464b5d31237ad4da0"
          target="_blank" 
          rel="noopener noreferrer"
          className="block text-center text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          {text}
        </a>
      </div>
    );
  }

  // Default text style
  return (
    <a 
      href="https://www.profitableratecpm.com/xk5edpyj?key=77b2377b748b143464b5d31237ad4da0"
      target="_blank" 
      rel="noopener noreferrer"
      className={`text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 underline transition-colors ${className}`}
    >
      {text}
    </a>
  );
}