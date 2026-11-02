import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Heart, Github } from 'lucide-react';

const Footer: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <footer className="bg-slate-800 text-white py-6 transition-all duration-300">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-center md:text-left">{t('disclaimer')}</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <a 
              href="#" 
              className="hover:text-teal-200 transition-colors flex items-center space-x-1"
            >
              <Heart className="h-4 w-4" />
              <span>Support</span>
            </a>
            <a 
              href="#" 
              className="text-gray-300 hover:text-white transition-colors flex items-center space-x-1"
            >
              <Github className="h-4 w-4" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
        
        <div className="mt-6 text-center text-slate-400 text-sm">
          <p>&copy; {new Date().getFullYear()} MediScan. All rights reserved.</p>
          <p className="mt-1">
            This is a hackathon project and is not intended for actual medical use.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;