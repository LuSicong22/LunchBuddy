import React from 'react';
import { Users, Utensils } from 'lucide-react';

export function Navigation({ activeTab, onTabChange, friendRequestCount }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 py-2 px-16 flex justify-between items-center z-10 safe-area-bottom shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <button
        onClick={() => onTabChange('home')}
        className={`flex flex-col items-center space-y-1 p-2 w-16 transition-colors ${activeTab === 'home' ? 'text-orange-500' : 'text-gray-400'}`}
      >
        <Utensils size={24} />
        <span className="text-xs font-medium">约饭</span>
      </button>
      <button
        onClick={() => onTabChange('friends')}
        className={`flex flex-col items-center space-y-1 p-2 w-20 transition-colors ${activeTab === 'friends' ? 'text-orange-500' : 'text-gray-400'}`}
      >
        <div className="relative">
          <Users size={24} />
          {friendRequestCount > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
        </div>
        <span className="text-xs font-medium">我和朋友</span>
      </button>
    </div>
  );
}
