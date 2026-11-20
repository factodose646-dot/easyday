import React from 'react';
import zaidiEmblemUrl from '../assets/zaidi-emblem.png';

interface LogoProps {
  className?: string;
}

export const EasyDayLogo: React.FC<LogoProps> = ({ className = 'w-10 h-10' }) => {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Subtle sun rays accent */}
      <circle cx="48" cy="17" r="9" fill="#FACC15" fillOpacity="0.9" />
      <path
        d="M48 4V7.5M59 17H55.5M55.8 9.2L53.3 11.7M55.8 24.8L53.3 22.3"
        stroke="#FACC15"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Calendar body */}
      <rect
        x="10"
        y="14"
        width="38"
        height="36"
        rx="9"
        fill="#FFFFFF"
        stroke="#0B6FF2"
        strokeWidth="3.5"
      />
      {/* Calendar top bar */}
      <path
        d="M10 23C10 18.0294 14.0294 14 19 14H39C43.9706 14 48 18.0294 48 23V25H10V23Z"
        fill="#0B6FF2"
      />
      {/* Calendar rings */}
      <rect x="19" y="9" width="4.5" height="9" rx="2.25" fill="#0F2957" />
      <rect x="34.5" y="9" width="4.5" height="9" rx="2.25" fill="#0F2957" />
      {/* Checkmark */}
      <path
        d="M21 36.5L26.5 42L38 30.5"
        stroke="#0B6FF2"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Yellow & Teal Dynamic Swoosh */}
      <path
        d="M6 41C14 53 37 56 54 39"
        stroke="#FACC15"
        strokeWidth="4.2"
        strokeLinecap="round"
      />
      <path
        d="M13 48.5C23 56.5 41 56.5 55 43.5"
        stroke="#0D9488"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
    </svg>
  );
};

export const EasyDayWordmark: React.FC<{ className?: string }> = ({
  className = 'text-xl',
}) => {
  return (
    <span className={`font-display font-extrabold tracking-tight ${className}`}>
      <span className="text-[#0F2957] dark:text-white">Easy</span>
      <span className="text-cyan-600 dark:text-cyan-400">Day</span>
    </span>
  );
};

/**
 * Original ZAIDI INTERACTIVE emblem extracted cleanly from reference artwork.
 * Transparent rounded corners, preserved proportions, zero black box background.
 */
export const ZaidiInteractiveLogo: React.FC<LogoProps> = ({
  className = 'w-9 h-9',
}) => {
  return (
    <img
      src={zaidiEmblemUrl}
      alt="ZAIDI INTERACTIVE"
      className={`${className} object-contain select-none`}
      draggable={false}
    />
  );
};

export const ZaidiStoreLogo: React.FC<LogoProps> = ({ className = 'w-8 h-8' }) => {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Bag handle */}
      <path
        d="M17 16V13C17 9.13401 20.134 6 24 6C27.866 6 31 9.13401 31 13V16"
        stroke="#0D9488"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* Bag body */}
      <path
        d="M9 17C9 15.3431 10.3431 14 12 14H36C37.6569 14 39 15.3431 39 17L41 38C41.2 40.2 39.5 42 37.3 42H10.7C8.5 42 6.8 40.2 7 38L9 17Z"
        fill="#0B6FF2"
      />
      {/* Z emblem inside bag */}
      <path
        d="M18 23H30L18 34H30"
        stroke="#FFFFFF"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="33" cy="21" r="2.2" fill="#FACC15" />
    </svg>
  );
};
