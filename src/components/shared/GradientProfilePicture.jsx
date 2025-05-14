import React, { useMemo } from 'react';

const GradientProfilePicture = ({ seed = "", className = "" }) => {
  const values = useMemo(() => {
    const hashString = (str, shift = 0) => {
      return str.split('').reduce((acc, char) => {
        return ((acc << 5) - acc + (char.charCodeAt(0) << shift)) | 0;
      }, 0);
    };

    // Generate multiple hashes for different aspects
    const hash1 = hashString(seed);
    const hash2 = hashString(seed, 1);
    const hash3 = hashString(seed, 2);
    const hash4 = hashString(seed, 3);

    // Generate a color using hash
    const generateColor = (hash) => {
      const hue = Math.abs(hash % 360);
      const sat = 65 + Math.abs((hash >> 8) % 20);
      const light = 60 + Math.abs((hash >> 16) % 15);
      return `hsl(${hue}deg ${sat}% ${light}%)`;
    };

    // Determine number of colors (2-3)
    const numColors = 2 + Math.abs(hash1 % 2);

    // Generate color stops
    const generateStops = () => {
      const colors = [
        generateColor(hash1),
        generateColor(hash2),
        generateColor(hash3),
        generateColor(hash4),
      ].slice(0, numColors);

      // For 2 colors: 0% and 100%
      // For 3 colors: 0%, 50%, 100%
      // For 4 colors: 0%, 33%, 66%, 100%
      return colors.map((color, index) => ({
        offset: index === 0 ? "0%" : 
                index === colors.length - 1 ? "100%" : 
                `${Math.round(100 * index / (colors.length - 1))}%`,
        color
      }));
    };

    return {
      stops: generateStops(),
      rotation: Math.abs(hash1 % 360),
    };
  }, [seed]);

  return (
    <div className={`relative overflow-hidden rounded-full ${className}`}>
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient
            id={`gradient-${seed}`}
            gradientUnits="userSpaceOnUse"
            gradientTransform={`rotate(${values.rotation}, 50, 50)`}
          >
            {values.stops.map((stop) => (
              <stop
                key={stop.offset}
                offset={stop.offset}
                stopColor={stop.color}
              />
            ))}
          </linearGradient>
        </defs>

        <circle
          cx="50"
          cy="50"
          r="50"
          fill={`url(#gradient-${seed})`}
        />
      </svg>
    </div>
  );
};

export default GradientProfilePicture;