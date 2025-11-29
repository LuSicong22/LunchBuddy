import React from 'react';
import { Download, Info, Smartphone, X } from 'lucide-react';

export function PWAInstallPrompt({
  isIOS,
  hasNativePrompt,
  onInstallClick,
  onDismiss
}) {
  return (
    <div className="absolute top-4 left-4 right-4 z-40">
      <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white rounded-2xl shadow-2xl border border-white/30 p-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none" aria-hidden>
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
          <div className="absolute -left-12 bottom-0 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
        </div>

        <div className="flex items-start gap-3 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg">
            <Smartphone size={24} />
          </div>
          <div className="flex-1">
            <p className="text-xs uppercase tracking-wider font-semibold text-white/80 mb-1">
              添加到主屏幕体验更佳
            </p>
            <h3 className="text-lg font-bold leading-tight">安装 LunchBuddy，一键秒开</h3>
            <p className="text-sm text-white/80 mt-1">
              安装后可全屏沉浸、免登录进入，还能离线预览你的饭局。
            </p>

            <div className="mt-3 flex gap-2">
              <button
                onClick={onInstallClick}
                className="flex-1 bg-white text-orange-700 font-bold rounded-xl py-2.5 shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
              >
                <Download size={18} />
                {isIOS ? '查看添加步骤' : hasNativePrompt ? '立即安装' : '手动添加'}
              </button>
              <button
                onClick={onDismiss}
                className="p-2.5 bg-white/15 text-white rounded-xl hover:bg-white/25 transition-colors"
                aria-label="关闭提示"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-3 bg-white/15 rounded-xl p-3 text-xs flex items-start gap-2 border border-white/10">
              <Info size={14} className="mt-0.5" />
              {isIOS ? (
                <div className="leading-relaxed">
                  打开 Safari，点底部分享按钮，选择「添加到主屏幕」即可把 LunchBuddy 收进桌面。
                </div>
              ) : hasNativePrompt ? (
                <div className="leading-relaxed">
                  点击「立即安装」会弹出系统提示，确认后桌面就有独立的 LunchBuddy 图标啦。
                </div>
              ) : (
                <div className="leading-relaxed">
                  如果未弹出系统安装框，可在浏览器菜单中选择「添加到主屏幕」手动完成安装。
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
