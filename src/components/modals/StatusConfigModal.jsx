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

  const foodPresets = ['随意', '淮南牛肉汤', '麻辣香锅', '菜饭', '私聊'];
  const locationPresets = ['随意', '老巴刹', '私聊'];

  const setLunchDetails = (details) => onUpdate(details);
  const clearIfDefault = (field) => {
    if (lunchDetails[field] === '随意') {
      setLunchDetails({ ...lunchDetails, [field]: '' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden relative animate-bounce-in z-10 max-h-[90vh] flex flex-col border border-gray-100">
        <div className="flex items-start justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <Target size={22} className="text-orange-500" />
            <h2 className="text-lg font-bold text-gray-900 leading-tight">精准组局</h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 active:scale-95"
            aria-label="关闭"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 pb-5 space-y-5 flex-1 overflow-y-auto">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Utensils size={16} className="text-orange-500" /> 想吃什么
              </div>
              <button
                onClick={() => onTogglePrivacy('hideFood')}
                className={`text-xs px-2 py-1 rounded-lg border transition-colors inline-flex items-center gap-1 ${
                  lunchDetails.hideFood
                    ? 'border-orange-200 bg-orange-50 text-orange-600'
                    : 'border-transparent text-gray-400 hover:border-gray-200'
                }`}
              >
                {lunchDetails.hideFood ? (
                  <>
                    <EyeOff size={14} />
                    <span>仅自己</span>
                  </>
                ) : (
                  <>
                    <Eye size={14} />
                    <span>公开</span>
                  </>
                )}
              </button>
            </label>
            <input
              type="text"
              value={lunchDetails.food}
              onChange={(e) => setLunchDetails({ ...lunchDetails, food: e.target.value })}
              placeholder="想吃的菜名"
              onFocus={() => clearIfDefault('food')}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
            <div className="flex flex-wrap gap-2">
              {foodPresets.map((item) => {
                const active = lunchDetails.food === item;
                return (
                  <button
                    key={item}
                    onClick={() => setLunchDetails({ ...lunchDetails, food: item })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border active:scale-95 transition-colors ${
                      active
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Users size={16} className="text-blue-500" /> 几人局
              </label>
              <select
                value={lunchDetails.size}
                onChange={(e) => setLunchDetails({ ...lunchDetails, size: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 appearance-none"
              >
                <option value="随意">随意</option>
                <option value="2人">2人</option>
                <option value="3-4人">3-4人</option>
                <option value="多人聚餐">多人聚餐</option>
                <option value="私聊">私聊</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Clock size={16} className="text-green-500" /> 时间
              </label>
              <select
                value={lunchDetails.time}
                onChange={(e) => setLunchDetails({ ...lunchDetails, time: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-200 appearance-none"
              >
                <option value="随意">随意</option>
                <option value="私聊">私聊</option>
                <option value="11:30">11:30</option>
                <option value="12:00">12:00</option>
                <option value="12:30">12:30</option>
                <option value="13:00">13:00</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-purple-500" /> 目标地点
              </div>
              <button
                onClick={() => onTogglePrivacy('hideLocation')}
                className={`text-xs px-2 py-1 rounded-lg border transition-colors inline-flex items-center gap-1 ${
                  lunchDetails.hideLocation
                    ? 'border-purple-200 bg-purple-50 text-purple-600'
                    : 'border-transparent text-gray-400 hover:border-gray-200'
                }`}
              >
                {lunchDetails.hideLocation ? (
                  <>
                    <EyeOff size={14} />
                    <span>仅自己</span>
                  </>
                ) : (
                  <>
                    <Eye size={14} />
                    <span>公开</span>
                  </>
                )}
              </button>
            </label>
            <input
              type="text"
              value={lunchDetails.location}
              onChange={(e) => setLunchDetails({ ...lunchDetails, location: e.target.value })}
              placeholder="想去的地点"
              onFocus={() => clearIfDefault('location')}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
            />
            <div className="flex flex-wrap gap-2">
              {locationPresets.map((item) => {
                const active = lunchDetails.location === item;
                return (
                  <button
                    key={item}
                    onClick={() => setLunchDetails({ ...lunchDetails, location: item })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border active:scale-95 transition-colors ${
                      active
                        ? 'bg-purple-500 text-white border-purple-500'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium active:scale-95"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-bold shadow-md active:scale-95"
          >
            发布组局
          </button>
        </div>
      </div>
    </div>
  );
}
