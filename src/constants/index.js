export const RANDOM_NICKNAMES = ['干饭王', '碳水教父', '奶茶脑袋', '火锅战神', '减肥失败者', '随缘食客', '周五烧烤'];

export const INITIAL_OPEN_EVENTS = [
  {
    id: 'ab_confirmed_table',
    title: '产品阿强 x Java老哥 的饭局',
    description: 'A 主动邀了 B，B 偏好 2 人以上，饭局对好友开放拼桌',
    sizePreference: '3-4人',
    food: '日料 + 湘味混搭',
    time: '12:10',
    location: '公司楼下 · 二楼食堂',
    participants: [
      { friendId: 1, role: '发起人（用户A）' },
      { friendId: 3, role: '确认嘉宾（用户B）' }
    ],
    joined: false
  }
];

export const INITIAL_FRIENDS = [
  {
    id: 1,
    nickname: '产品阿强',
    note: '张强-产品部',
    avatarColor: 'bg-blue-500',
    status: 'active',
    wechatId: 'aqiang_pm',
    lunchPlan: { food: '日料鳗鱼饭', size: '2人', time: '12:00', location: '公司楼下', hideFood: false, hideLocation: false }
  },
  {
    id: 2,
    nickname: '设计师小美',
    note: '',
    avatarColor: 'bg-pink-500',
    status: 'active',
    wechatId: 'design_beauty',
    lunchPlan: { food: '轻食沙拉', size: '随意', time: '12:30', location: 'Wagas', hideFood: false, hideLocation: false }
  },
  {
    id: 3,
    nickname: 'Java老哥',
    note: '李工',
    avatarColor: 'bg-orange-500',
    status: 'active',
    wechatId: 'java_king',
    lunchPlan: { food: '湘菜小炒', size: '3-4人', time: '11:50', location: '二楼食堂', hideFood: false, hideLocation: false }
  },
  {
    id: 4,
    nickname: '运营喵',
    note: '',
    avatarColor: 'bg-gray-400',
    status: 'active',
    wechatId: 'ops_cat',
    lunchPlan: { food: '麦当劳', size: '1人', time: '12:15', location: '公司楼下', hideFood: true, hideLocation: true }
  }
];
