import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onFinish();
      }, 500); // Add fade out animation time
    }, 3000); // Show for 3 seconds

    return () => clearTimeout(timer);
  }, [onFinish]);

  if (!isVisible) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-orange-400 to-red-600 opacity-0 transition-opacity duration-500">
        <div className="text-center">
          <img 
            src="/logo.jpeg" 
            alt="App Logo" 
            className="w-32 h-32 mx-auto rounded-full shadow-2xl mb-4 animate-pulse"
          />
          <h1 className="text-2xl font-bold text-white mb-2">Kirtan App</h1>
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-orange-400 to-red-600 transition-opacity duration-500">
      <div className="text-center">
        {/* Try to use video first, fallback to image */}
        <div className="w-32 h-32 mx-auto rounded-full shadow-2xl mb-4 overflow-hidden">
          <video
            autoPlay
            muted
            loop
            className="w-full h-full object-cover"
            onError={(e) => {
              // If video fails to load, hide it and show image instead
              e.currentTarget.style.display = 'none';
              const img = e.currentTarget.nextElementSibling as HTMLImageElement;
              if (img) img.style.display = 'block';
            }}
          >
            <source src="/logo.mp4" type="video/mp4" />
          </video>
          <img 
            src="/logo.jpeg" 
            alt="App Logo" 
            className="w-full h-full object-cover animate-pulse"
            style={{ display: 'none' }}
          />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Kirtan App</h1>
        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
} 