import React from 'react';
import { AlertCircle, AlertTriangle, ArrowRight, Info } from 'lucide-react';
import { Condition } from '../../contexts/SymptomContext';
import voiceService from '../../services/VoiceService';

interface ConditionCardProps {
  condition: Condition;
}

const ConditionCard: React.FC<ConditionCardProps> = ({ condition }) => {
  // Get the appropriate icon and color based on urgency level
  const getUrgencyDisplay = () => {
    const config = {
      // Urgency is the most safety-relevant label on the card, so each badge
      // uses an -800 foreground on its -50 tint. The previous -500 foregrounds
      // sat between 1.9:1 and 3.3:1, under the 4.5:1 required at this size.
      low: {
        icon: <Info className="h-5 w-5" />,
        color: 'text-blue-800 bg-blue-50',
        text: 'Low Urgency'
      },
      medium: {
        icon: <AlertTriangle className="h-5 w-5" />,
        color: 'text-amber-800 bg-amber-50',
        text: 'Medium Urgency'
      },
      high: {
        icon: <AlertCircle className="h-5 w-5" />,
        color: 'text-orange-800 bg-orange-50',
        text: 'High Urgency'
      },
      emergency: {
        icon: <AlertCircle className="h-5 w-5" />,
        color: 'text-red-800 bg-red-50',
        text: 'Emergency'
      }
    };
    
    return config[condition.urgency];
  };
  
  const urgencyDisplay = getUrgencyDisplay();
  const probabilityPercentage = Math.round(condition.probability * 100);
  
  // Read aloud the condition and its details
  const readAloud = () => {
    const text = `${condition.name}. ${condition.description}. This condition has a ${probabilityPercentage} percent match with your symptoms. The urgency level is ${condition.urgency}.`;
    voiceService.speak(text);
  };
  
  return (
    <div className={`border rounded-lg overflow-hidden shadow-sm transition-all hover:shadow-md ${
      condition.rank === 1 ? 'ring-2 ring-emerald-500/30 border-emerald-300' :
      condition.urgency === 'emergency' ? 'border-red-300' : 'border-gray-200'
    }`}>
      <div className="p-4">
        {/* Differential Rank & Category Badges */}
        <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
          {condition.rank === 1 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
              ★ Top-1 Primary Match
            </span>
          )}
          {condition.rank && condition.rank > 1 && condition.rank <= 3 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
              #{condition.rank} Top-3 Differential
            </span>
          )}
          {condition.rank && condition.rank > 3 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
              #{condition.rank} Alternative Consideration
            </span>
          )}
          {condition.category && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200/50">
              {condition.category}
            </span>
          )}
        </div>

        <div className="flex justify-between items-start">
          <h3 className="text-lg font-medium text-gray-900">{condition.name}</h3>
          <button
            onClick={readAloud}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Read aloud"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="w-5 h-5"
            >
              <path d="M12 6v12M6 12h12"></path>
            </svg>
          </button>
        </div>
        
        <div className="flex items-center mt-2">
          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${urgencyDisplay.color}`}>
            {urgencyDisplay.icon}
            <span className="ml-1">{urgencyDisplay.text}</span>
          </div>
          <div className="ml-2 text-sm text-gray-500">
            {probabilityPercentage}% match
          </div>
        </div>
        
        <p className="mt-3 text-gray-600">{condition.description}</p>
        
        {/* Progress bar for match probability */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full ${
                condition.urgency === 'emergency' ? 'bg-red-600' : 
                condition.urgency === 'high' ? 'bg-orange-600' :
                condition.urgency === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
              }`} 
              style={{ width: `${probabilityPercentage}%` }}
            ></div>
          </div>
        </div>
        
        {/* Recommended Specialist */}
        {condition.specialist && (
          <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Recommended Specialist:</span>
            <span className="text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60">{condition.specialist}</span>
          </div>
        )}

        {/* Next Steps */}
        <div className="mt-3.5">
          <h4 className="text-sm font-medium text-gray-700">Recommended Next Steps:</h4>
          <ul className="mt-2 space-y-2">
            {condition.nextSteps.map((step, index) => (
              <li key={index} className="flex items-start">
                <ArrowRight className="h-4 w-4 text-gray-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-sm text-gray-600">{step}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      {/* Emergency warning */}
      {condition.urgency === 'emergency' && (
        <div className="bg-red-50 border-t border-red-200 px-4 py-3">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Seek immediate medical attention
              </h3>
              <div className="mt-1 text-sm text-red-700">
                This condition may require emergency medical care. Please contact emergency services.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConditionCard;