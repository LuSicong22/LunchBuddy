import React from 'react';
import { Clock, Eye, EyeOff, MapPin, Target, Users, Utensils, X } from 'lucide-react';

export function StatusConfigModal({
  isOpen,
  lunchDetails,
  onClose,
  onConfirm,
  onUpdate,
  onTogglePrivacy
}) {
  if (!isOpen) return null;

  const setLunchDetails = (details) => onUpdate(details);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden relative animate-bounce-in z-10 max-h-[90vh] flex flex-col">
        <div className="bg-gradient-to-r from-orange-400 to-orange-500 p-6 pb-8 text-white shrink-0">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Target size={24} /> 精准组局
          </h2>
          <p className="text-orange-100 text-sm mt-1">有点想法？填个单子告诉大家</p>
          <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 -mt-4 bg-white rounded-t-3xl space-y-5 flex-1 overflow-y-auto">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Utensils size={16} className="text-orange-500" /> 想吃什么
              </div>
              <button
                onClick={() => onTogglePrivacy('hideFood')}
                className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full transition-colors ${
                  lunchDetails.hideFood ? 'bg-orange-100 text-orange-600' : 'text-gray-400 hover:bg-gray-100'
                }`}
              >
                {lunchDetails.hideFood ? <EyeOff size={12} /> : <Eye size={12} />}
                {lunchDetails.hideFood ? '隐藏' : '公开'}
              </button>
            </label>
            <input
              type="text"
              value={lunchDetails.food}
              onChange={(e) => setLunchDetails({ ...lunchDetails, food: e.target.value })}
              placeholder="例如：日料 (默认: 随便)"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
            <div className="flex gap-2 flex-wrap">
              {['随便', '火锅', '轻食', '烧烤'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setLunchDetails({ ...lunchDetails, food: tag })}
                  className={`text-xs px-2 py-1 rounded-full border ${
                    lunchDetails.food === tag ? 'bg-orange-100 text-orange-600 border-orange-200' : 'bg-white text-gray-500 border-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Users size={16} className="text-blue-500" /> 几人局
              </label>
              <select
                value={lunchDetails.size}
                onChange={(e) => setLunchDetails({ ...lunchDetails, size: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 appearance-none"
              >
                <option value="随意">随意 (默认)</option>
                <option value="2人">2人</option>
                <option value="3-4人">3-4人</option>
                <option value="多人聚餐">多人聚餐</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Clock size={16} className="text-green-500" /> 时间
              </label>
              <select
                value={lunchDetails.time}
                onChange={(e) => setLunchDetails({ ...lunchDetails, time: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-200 appearance-none"
              >
                <option value="随意">随意 (默认)</option>
                <option value="11:30">11:30</option>
                <option value="12:00">12:00</option>
                <option value="12:30">12:30</option>
                <option value="13:00">13:00</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-purple-500" /> 目标地点
              </div>
              <button
                onClick={() => onTogglePrivacy('hideLocation')}
                className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full transition-colors ${
                  lunchDetails.hideLocation ? 'bg-purple-100 text-purple-600' : 'text-gray-400 hover:bg-gray-100'
                }`}
              >
                {lunchDetails.hideLocation ? <EyeOff size={12} /> : <Eye size={12} />}
                {lunchDetails.hideLocation ? '隐藏' : '公开'}
              </button>
            </label>
            <input
              type="text"
              value={lunchDetails.location}
              onChange={(e) => setLunchDetails({ ...lunchDetails, location: e.target.value })}
              placeholder="例如：公司楼下"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
            />
          </div>
          <button
            onClick={onConfirm}
            className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2 mt-4"
          >
            <Target size={20} className="text-yellow-400" fill="currentColor" /> 发布组局
          </button>
        </div>
      </div>
    </div>
  );
}
