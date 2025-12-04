LunchBuddy 设计规范文档
这个文档概述了 LunchBuddy（午餐搭子原型）的设计哲学、核心规范和视觉系统。这些规则确保了应用在不同状态和交互下的一致性、易用性和亲和力。

1. 核心设计哲学 (Design Philosophy)
   轻社交、低负担 (Low Friction Social)：
   理念：吃饭是一件轻松的事，找饭搭子不应有压力。
   体现：注册无需手机号密码（一键匿名）；默认选项多为“随意”；状态可以随时开启/结束；没有强制的深层社交绑定（如必须加好友才能看状态）。
   即时性与场景感 (Immediacy & Context)：
   理念：满足此时此刻的生理需求（饿了），而非长期的社交规划。
   体现：首页即“状态”，强调“正在求约饭”的实时性；状态卡片的呼吸灯和雷达效果强化了“在线”和“即时”的感知。
   信息分层与高效 (Information Hierarchy)：
   理念：一眼看清关键决策信息（吃什么、在哪、几人）。
   体现：好友卡片去除了冗余的自我介绍，直接以 Tag (标签) 形式展示饭局偏好；重要操作（如“约”）按钮醒目。
   设计哲学：

- 极简、留白、减少视觉噪音。
- 不添加任何不必要的说明性文字、解释、注释。
- 不使用渐变
- 不自动拓展功能，不自行生成额外描述。

2. 布局规范 (Layout Rules)
   移动端优先 (Mobile First)：
   所有容器宽度限制在 max-w-md (约 448px)，模拟手机屏幕体验。
   采用 底部导航栏 (Bottom Navigation) 模式，符合拇指操作习惯。
   卡片式设计 (Card-Based Design)：
   内容容器：几乎所有独立内容块（好友、饭局、状态设置）都使用圆角卡片 (rounded-2xl 或 rounded-3xl)。
   间距：
   卡片内部 Padding 通常为 p-4 (1rem)。
   列表项之间 Gap 通常为 gap-3 (0.75rem)。
   Z 轴与悬浮 (Elevation & Floating)：
   模态框 (Modals)：使用黑色半透明遮罩 (bg-black/40) + 居中白色卡片，配合 z-50 层级。
   通知 (Notifications)：顶部悬浮 (fixed top-4)，使用阴影 (shadow-2xl) 突出显示。
3. 色彩规范 (Color System)
   LunchBuddy 采用了一套 “食欲系” 配色方案，以温暖、活泼的暖色调为主，辅以功能性的辅助色。
   主色调 (Primary Brand Colors)：
   橙色 (Orange): bg-orange-500 / text-orange-500。
   用途：核心品牌色，用于主按钮、激活状态图标、重要强调文字（如“正在求约饭”）。代表食物、温暖和活力。
   浅橙色 (Light Orange): bg-orange-100 / bg-orange-50。
   用途：卡片背景、标签背景、辅助装饰。营造轻松的氛围。
   辅助色 (Secondary & Functional Colors)：
   绿色 (Green): text-green-500 / bg-green-100。
   用途：表示“时间”、“活跃状态”、“确认/成功”。
   蓝色 (Blue): text-blue-500 / bg-blue-100。
   用途：表示“人数”、“社交/朋友”。
   紫色 (Purple): text-purple-500 / bg-purple-100。
   用途：表示“地点/位置”。
   红色 (Red): text-red-500。
   用途：表示“取消”、“删除”、“警告”。
   中性色 (Neutrals)：
   深灰/黑: text-gray-800 / bg-gray-900。用于主要标题、强调按钮背景。
   中灰: text-gray-500。用于次要信息、说明文字。
   浅灰: text-gray-400 / bg-gray-100 / border-gray-200。用于未激活状态图标、辅助按钮、分割线。
4. 文本与排版规范 (Typography)
   字体：默认系统无衬线字体 (Sans-serif)，保持清晰易读。
   层级 (Hierarchy)：
   页面标题 (H1): text-2xl font-bold text-gray-800。
   卡片标题/人名 (H3): text-lg font-bold text-gray-800。
   正文/说明: text-sm text-gray-500。
   辅助信息/标签: text-xs 或 text-[10px]。
   标签文本 (Tag Text)：
   采用 小字号 + 加粗/中等字重 (text-[10px] font-medium)，配合彩色背景和深色文字，确保在小尺寸下依然清晰。
5. 交互与动效 (Interaction & Motion)
   微交互 (Micro-interactions)：
   点击反馈：几乎所有按钮都有 active:scale-95，提供按压的触感反馈。
   状态变化：从“无状态”到“求约饭”，通过布局变化和平滑过渡 (transition-all duration-300) 来体现。
   状态指示：
   呼吸灯: animate-pulse 用于“正在求约饭”的图标，提示正在进行中。
   波纹: animate-ping 用于雷达图标，模拟信号发射。
   进出场动画：
   弹窗: animate-bounce-in (模拟弹出效果)。
   列表: animate-slide-up (内容向上滑入)。
   通知: animate-slide-down (从顶部滑入)。
6. 组件设计规则 (Component Rules)
   好友卡片 (Friend Card)：
   结构：左侧头像 -> 中间信息流（名字+Tag 堆叠） -> 右侧操作区。
   原则：信息优先。如果没有特定约饭计划（lunchPlan），则显示“暂无计划”占位，保持高度一致性。
   标签 (Tags)：
   无井号原则：标签内容直接展示文字，不带 # 号，减少视觉噪音。
   图标化：如果是隐私隐藏状态，标签会变灰并显示 EyeOff 图标。
   按钮 (Buttons)：
   主按钮：实心背景（黑或橙），圆角较大 (rounded-xl)，带阴影。
   次级按钮：浅色背景（灰或淡彩），无阴影或轻微阴影。
