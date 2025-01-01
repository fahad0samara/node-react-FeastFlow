import React from 'react';
import { FaCheck } from 'react-icons/fa';

interface AuthBackgroundProps {
  isDarkMode: boolean;
}

const AuthBackground: React.FC<AuthBackgroundProps> = ({ isDarkMode }) => {
  return (
    <div className="relative flex items-end px-4 pb-10 pt-60 sm:pb-16 md:justify-center lg:pb-24 sm:px-6 lg:px-8">
      <div className="absolute inset-0">
        <img
          className="object-cover object-center w-full h-full"
          src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
          alt="Food background"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>

      <div className="relative">
        <div className="w-full max-w-xl xl:w-full xl:mx-auto xl:pr-24 xl:max-w-xl">
          <h3 className="text-4xl font-bold text-white">
            Discover Exquisite Cuisine <br className="hidden xl:block" />
            From Around the World
          </h3>
          <ul className="grid grid-cols-1 mt-10 sm:grid-cols-2 gap-x-8 gap-y-4">
            <li className="flex items-center space-x-3">
              <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full">
                <FaCheck className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-lg font-medium text-white">
                Experience Delicious Flavors
              </span>
            </li>
            <li className="flex items-center space-x-3">
              <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full">
                <FaCheck className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-lg font-medium text-white">
                Wide Range of Menu Options
              </span>
            </li>
            <li className="flex items-center space-x-3">
              <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full">
                <FaCheck className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-lg font-medium text-white">
                Exquisite Culinary Creations
              </span>
            </li>
            <li className="flex items-center space-x-3">
              <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full">
                <FaCheck className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-lg font-medium text-white">
                Cozy and Welcoming Ambiance
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AuthBackground;
