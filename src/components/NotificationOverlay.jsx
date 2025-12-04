import React from 'react';
import { BellRing, Sparkles, UserPlus } from 'lucide-react';

export function NotificationOverlay({ notification, onClick, onAccept }) {
  if (!notification) return null;

  const isInvite = notification.type === 'incoming_invite';

  return (
    <div
      onClick={onClick}
      className="fixed top-4 left-4 right-4 z-50 bg-white/90 backdrop-blur-md border border-gray-200 shadow-2xl rounded-2xl p-4 animate-slide-down cursor-pointer active:scale-95 transition-transform"
    >
      <div className="flex items-start gap-3">
        <div className="bg-orange-500 rounded-xl p-2 text-white">
          {notification.type === 'friend_request' && <UserPlus size={20} />}
          {notification.type === 'perfect_match' && <Sparkles size={20} />}
          {notification.type === 'incoming_invite' && <BellRing size={20} />}
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-gray-800 text-sm">{notification.title}</h4>
          <p className="text-xs text-gray-500 mt-0.5">{notification.body}</p>
        </div>
        <span className="text-[10px] text-gray-400">刚刚</span>
      </div>
      {isInvite && (
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAccept?.();
            }}
            className="px-3 py-1 bg-orange-500 text-white rounded-full text-xs font-bold shadow-sm active:scale-95"
          >
            接受
          </button>
          <span className="text-[10px] text-gray-400">或稍后再说</span>
        </div>
      )}
    </div>
  );
}
