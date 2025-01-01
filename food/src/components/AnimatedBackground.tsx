import React from 'react';

const AnimatedBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <svg
        className="absolute w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        version="1.1"
      >
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
              result="goo"
            />
          </filter>
        </defs>
        <g filter="url(#goo)">
          {[...Array(10)].map((_, i) => (
            <circle
              key={i}
              className="animate-blob"
              cx={Math.random() * 100 + "%"}
              cy={Math.random() * 100 + "%"}
              r={Math.random() * 100 + 50}
              fill={`rgba(34, 197, 94, ${Math.random() * 0.3 + 0.1})`}
              style={{
                animation: `blob ${Math.random() * 10 + 20}s linear infinite`,
                transformOrigin: 'center',
              }}
            >
              <animate
                attributeName="r"
                values={`${Math.random() * 50 + 25};${Math.random() * 100 + 50};${Math.random() * 50 + 25}`}
                dur={`${Math.random() * 10 + 10}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="cx"
                values={`${Math.random() * 20}%;${Math.random() * 80 + 20}%;${Math.random() * 20}%`}
                dur={`${Math.random() * 10 + 10}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="cy"
                values={`${Math.random() * 20}%;${Math.random() * 80 + 20}%;${Math.random() * 20}%`}
                dur={`${Math.random() * 10 + 10}s`}
                repeatCount="indefinite"
              />
            </circle>
          ))}
        </g>
      </svg>
    </div>
  );
};

export default AnimatedBackground;
