/* global __firebase_config, __app_id, __initial_auth_token */
import React, { useEffect, useState } from 'react';
import {
  Utensils,
  Users,
  Clock,
  MapPin,
  Zap,
  Target,
  Sparkles,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  CheckCircle2,
  X,
  CalendarCheck,
  HandPlatter,
  MessageSquare,
  BellRing,
  Check,
  RefreshCw,
  ArrowRight,
  Copy,
  Edit2,
  Save,
  Edit,
  SquarePlus,
  UserPlus,
  LogIn
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { doc, getFirestore, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { INITIAL_OPEN_EVENTS, RANDOM_NICKNAMES } from './constants';
import { NotificationOverlay } from './components/NotificationOverlay';
import { Navigation } from './components/Navigation';
import { StatusConfigModal } from './components/modals/StatusConfigModal';
import { useFriends } from './hooks/useFriends';
import { copyToClipboard } from './utils/clipboard';
import { generateShortId } from './utils/id';

const firebaseConfig = (() => {
  if (typeof __firebase_config !== 'undefined') return JSON.parse(__firebase_config);
  if (import.meta.env.VITE_FIREBASE_CONFIG) return JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG);
  return null;
})();

let app = null;
let auth = null;
let db = null;
if (firebaseConfig) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} else {
  console.warn('Firebase 配置缺失，应用将以离线模式运行。');
}

const appId = typeof __app_id !== 'undefined' ? __app_id : import.meta.env.VITE_APP_ID || 'default-app-id';
const localProfileStorageKey = `lunchbuddy_local_profile_${appId}`;

export default function LunchBuddyApp() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [registrationName, setRegistrationName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const [activeTab, setActiveTab] = useState('home');
  const [myStatus, setMyStatus] = useState(null);
  const {
    friends,
    setFriends,
    friendRequests,
    setFriendRequests,
    showAddFriendModal,
    setShowAddFriendModal,
    newFriendId,
    setNewFriendId,
    friendToDelete,
    setFriendToDelete,
    showNoteModal,
    setShowNoteModal,
    currentNoteFriend,
    setCurrentNoteFriend,
    noteInput,
    setNoteInput,
    showFriendRequestModal,
    setShowFriendRequestModal,
    simulateFriendRequest,
    acceptFriendRequest,
    handleAddFriend,
    initiateDeleteFriend,
    confirmDeleteFriend,
    openNoteModal,
    handleSaveNote
  } = useFriends();

  const [confirmedDining, setConfirmedDining] = useState(null);
  const [friendToDate, setFriendToDate] = useState(null);
  const [datingStep, setDatingStep] = useState('confirm');

  const [showCancelDiningModal, setShowCancelDiningModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showStatusConfig, setShowStatusConfig] = useState(false);

  const [lunchDetails, setLunchDetails] = useState({
    food: '',
    size: '随意',
    time: '随意',
    location: '随意',
    hideFood: false,
    hideLocation: false
  });

  const [diningViewMode, setDiningViewMode] = useState('me');

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  const [notification, setNotification] = useState(null);

  const [openDiningEvents, setOpenDiningEvents] = useState(INITIAL_OPEN_EVENTS);
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  const installPromptDismissedKey = `lunchbuddy_install_prompt_dismissed_${appId}`;

  const hasDismissedInstallPrompt = () =>
    typeof window !== 'undefined' && localStorage.getItem(installPromptDismissedKey) === '1';

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const updateDisplayMode = () => setIsStandalone(mediaQuery.matches || window.navigator.standalone);
    setIsIos(/iphone|ipad|ipod/i.test(window.navigator.userAgent));
    updateDisplayMode();

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      if (hasDismissedInstallPrompt() || mediaQuery.matches || window.navigator.standalone) return;
      setInstallPromptEvent(event);
      setShowInstallPrompt(true);
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setShowInstallPrompt(false);
      setInstallPromptEvent(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    if (mediaQuery.addEventListener) mediaQuery.addEventListener('change', updateDisplayMode);
    else mediaQuery.addListener(updateDisplayMode);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (mediaQuery.removeEventListener) mediaQuery.removeEventListener('change', updateDisplayMode);
      else mediaQuery.removeListener(updateDisplayMode);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isStandalone || hasDismissedInstallPrompt()) return;

    const timer = setTimeout(() => {
      if (!installPromptEvent) setShowInstallPrompt(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [installPromptEvent, isStandalone]);

  useEffect(() => {
    if (!auth || !db) {
      setUser({ uid: 'local-user' });
      if (typeof window !== 'undefined') {
        const storedProfile = localStorage.getItem(localProfileStorageKey);
        if (storedProfile) {
          try {
            const parsedProfile = JSON.parse(storedProfile);
            setUserProfile(parsedProfile);
            setEditedName(parsedProfile.nickname);
          } catch (error) {
            console.error('Failed to parse local profile', error);
            localStorage.removeItem(localProfileStorageKey);
          }
        }
      }
      setAuthLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error('Auth init failed', error);
        setAuthLoading(false);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const profileRef = doc(db, 'artifacts', appId, 'users', currentUser.uid, 'data', 'profile');
        const unsubProfile = onSnapshot(profileRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserProfile(data);
            setEditedName(data.nickname);
          } else {
            setUserProfile(null);
          }
          setAuthLoading(false);
        });
        return () => unsubProfile();
      } else {
        setUser(null);
        setUserProfile(null);
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const triggerNotification = (title, body, type, payload = {}) => {
    setNotification({ title, body, type, payload });
    setTimeout(() => {
      setNotification((prev) => (prev && prev.type === type ? null : prev));
    }, 5000);
  };

  const handleNotificationClick = () => {
    if (!notification) return;
    const { type, payload } = notification;
    setNotification(null);
    if (type === 'friend_request') {
      setActiveTab('friends');
      setShowFriendRequestModal(true);
    } else if (type === 'perfect_match') {
      setActiveTab('home');
      setFriendToDate(payload.friend);
      setDatingStep('confirm');
    } else if (type === 'incoming_invite') {
      setActiveTab('home');
      setFriendToDate(payload.friend);
      setDatingStep('received_invite');
    }
  };

  const handleRegistration = async (e) => {
    e.preventDefault();
    if (!registrationName.trim() || !user) return;
    setIsRegistering(true);
    if (!db || !auth) {
      const localProfile = {
        nickname: registrationName,
        createdAt: new Date().toISOString(),
        avatarColor: 'bg-orange-500',
        shortId: generateShortId()
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem(localProfileStorageKey, JSON.stringify(localProfile));
      }
      setUserProfile(localProfile);
      setEditedName(localProfile.nickname);
      setIsRegistering(false);
      return;
    }

    try {
      const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'profile');
      await setDoc(profileRef, {
        nickname: registrationName,
        createdAt: new Date().toISOString(),
        avatarColor: `bg-${['orange', 'blue', 'green', 'purple'][Math.floor(Math.random() * 4)]}-500`,
        shortId: generateShortId()
      });
    } catch (error) {
      console.error('Registration failed:', error);
      alert('注册失败');
      setIsRegistering(false);
    }
  };

  const handleUpdateNickname = async () => {
    if (!editedName.trim() || !user) return;
    if (!db || !auth) {
      setUserProfile((p) => {
        const updatedProfile = { ...p, nickname: editedName };
        if (typeof window !== 'undefined') {
          localStorage.setItem(localProfileStorageKey, JSON.stringify(updatedProfile));
        }
        return updatedProfile;
      });
      setIsEditingName(false);
      return;
    }
    const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'profile');
    await updateDoc(profileRef, { nickname: editedName });
    setIsEditingName(false);
  };

  const simulateIncomingInvite = (friend) => {
    triggerNotification('收到约饭邀请', `${friend.nickname} 想要和你约饭`, 'incoming_invite', { friend });
  };

  const handleSimulateFriendRequest = () => {
    const request = simulateFriendRequest();
    triggerNotification('新好友请求', `${request.nickname} 请求添加你为好友`, 'friend_request');
  };

  const handleQuickStart = () => {
    const defaultDetails = {
      food: '随意',
      size: '随意',
      time: '随意',
      location: '随意',
      hideFood: false,
      hideLocation: false
    };
    setLunchDetails(defaultDetails);
    setMyStatus('active');
    checkForPerfectMatch(defaultDetails);
  };

  const handleCustomStart = () => {
    setLunchDetails({
      food: '',
      size: '随意',
      time: '随意',
      location: '随意',
      hideFood: false,
      hideLocation: false
    });
    setShowStatusConfig(true);
  };

  const confirmPublishStatus = () => {
    setMyStatus('active');
    setShowStatusConfig(false);
    checkForPerfectMatch(lunchDetails);
  };

  const checkForPerfectMatch = (details) => {
    const activeFriends = friends.filter((f) => f.status === 'active');
    const perfectMatch = activeFriends.find((f) => checkIsMatch(details, f.lunchPlan));
    if (perfectMatch) {
      setTimeout(() => {
        triggerNotification('发现完美匹配 ✨', `你和 ${perfectMatch.nickname} 的口味很合！`, 'perfect_match', { friend: perfectMatch });
      }, 1000);
    }
  };

  const handleStopStatus = () => setMyStatus(null);
  const togglePrivacy = (field) => setLunchDetails((p) => ({ ...p, [field]: !p[field] }));
  const initiateDateFriend = (f) => {
    setFriendToDate(f);
    setDatingStep('confirm');
  };

  const handleInstallApp = async () => {
    if (!installPromptEvent) {
      setShowInstallGuide((prev) => !prev);
      return;
    }
    installPromptEvent.prompt();
    const choice = await installPromptEvent.userChoice;
    if (choice.outcome === 'accepted') {
      setShowInstallPrompt(false);
      setInstallPromptEvent(null);
    } else if (typeof window !== 'undefined') {
      localStorage.setItem(installPromptDismissedKey, '1');
      setShowInstallPrompt(false);
    }
  };

  const handleDismissInstallPrompt = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(installPromptDismissedKey, '1');
    }
    setShowInstallGuide(false);
    setShowInstallPrompt(false);
  };
  const handleSendInvite = () => setDatingStep('partner');
  const handlePartnerDecline = () => {
    setFriendToDate(null);
    setDatingStep('confirm');
  };

  const handlePartnerAccept = () => {
    if (!friendToDate) return;
    const finalPlan = friendToDate.lunchPlan || lunchDetails;
    const participantEntries = [
      { friendId: null, role: '我', isSelf: true },
      { friendId: friendToDate.id, role: '朋友' }
    ];
    const mappedParticipants = mapParticipantsWithProfiles(participantEntries);
    const isGroup = isGroupDining(finalPlan.size);
    const newDining = {
      partner: friendToDate,
      food: finalPlan.food || '随意',
      time: finalPlan.time || '待定',
      location: finalPlan.location || '待定',
      size: finalPlan.size || '2人',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isAcknowledged: false,
      isGroup,
      participants: mappedParticipants,
      title: `${userProfile?.nickname || '我'} x ${friendToDate.nickname} 的饭局`
    };
    setConfirmedDining(newDining);
    setMyStatus(null);
    setFriends((prev) => prev.map((f) => (f.id === friendToDate.id ? { ...f, status: 'inactive' } : f)));
    setFriendToDate(null);
    setDatingStep('confirm');
    setDiningViewMode('me');
  };

  const handlePartnerAcknowledge = () => {
    setConfirmedDining((prev) => ({ ...prev, isAcknowledged: true }));
    alert('已确认收到！(状态已更新)');
    setDiningViewMode('me');
  };
  const handleInitiateCancel = () => {
    setCancelReason('');
    setShowCancelDiningModal(true);
  };
  const handleConfirmCancel = () => {
    if (!cancelReason.trim()) return;
    if (confirmedDining?.partner) setFriends((prev) => prev.map((f) => (f.id === confirmedDining.partner.id ? { ...f, status: 'active' } : f)));
    setConfirmedDining(null);
    setShowCancelDiningModal(false);
    setCancelReason('');
  };

  const handleExitDining = () => {
    const confirmedId = confirmedDining?.id;
    const isFromOpenEvent = Boolean(confirmedId);
    if (!window.confirm('确定要退出当前饭局吗？')) return;

    if (confirmedDining?.partner) {
      setFriends((prev) => prev.map((f) => (f.id === confirmedDining.partner.id ? { ...f, status: 'active' } : f)));
    }

    if (isFromOpenEvent) {
      setOpenDiningEvents((prev) =>
        prev.map((event) => {
          if (event.id !== confirmedId) return event;
          const filteredParticipants = (event.participants || []).filter((p) => !p.isSelf);
          return { ...event, joined: false, participants: filteredParticipants };
        })
      );
    }

    setConfirmedDining(null);
    setDiningViewMode('me');
    setShowCancelDiningModal(false);
    setCancelReason('');
  };
  const checkIsMatch = (my, fr) => {
    if (!fr) return false;
    const chk = (a, b) => (!a || !b || a === '随意' || b === '随意' || a === '') ? true : a.includes(b) || b.includes(a);
    return chk(my.food, fr.food) && chk(my.time, fr.time) && chk(my.location, fr.location);
  };

  const parseMaxSize = (sizeText) => {
    const numbers = (sizeText || '').match(/\d+/g);
    if (!numbers) return null;
    return Math.max(...numbers.map(Number));
  };

  const isGroupDining = (input) => {
    if (!input) return false;
    const sizeText = typeof input === 'string' ? input : input.sizePreference || input.size;
    const maxSize = parseMaxSize(sizeText);
    if (maxSize) return maxSize > 2;
    if (typeof input === 'object' && input.participants) return input.participants.length > 2;
    return false;
  };

  const mapParticipantsWithProfiles = (participants) =>
    participants.map((p, idx) => {
      const profile = getParticipantProfile(p);
      const nickname = p.isSelf ? userProfile?.nickname || '我' : profile?.nickname || p.name || '嘉宾';
      const avatarColor = p.isSelf ? 'bg-emerald-500' : profile?.avatarColor || 'bg-gray-300';
      return {
        id: profile?.id ?? `guest-${idx}`,
        nickname,
        avatarColor,
        role: p.role
      };
    });

  const getParticipantProfile = (participant) => friends.find((f) => f.id === participant.friendId);
  const eventHasFriend = (event) => event.participants.some((p) => !!getParticipantProfile(p));
  const handleJoinOpenEvent = (event) => {
    if (event.joined || !eventHasFriend(event)) return;

    const selfParticipant = {
      friendId: null,
      role: `${userProfile?.nickname || '我'} 已加入`,
      isSelf: true
    };
    const joinedEvent = { ...event, joined: true, participants: [...event.participants, selfParticipant] };

    setOpenDiningEvents((prev) => prev.map((item) => (item.id === event.id ? joinedEvent : item)));

    const participants = mapParticipantsWithProfiles(joinedEvent.participants);
    setConfirmedDining({
      ...joinedEvent,
      food: joinedEvent.food || '随意',
      time: joinedEvent.time || '待定',
      location: joinedEvent.location || '待定',
      size: joinedEvent.sizePreference,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isGroup: isGroupDining(joinedEvent),
      isAcknowledged: true,
      participants,
      title: joinedEvent.title || '好友饭局'
    });
    setMyStatus(null);
    setDiningViewMode('me');
    setActiveTab('home');
  };

  const OpenDiningCard = ({ event }) => {
    const canJoin = eventHasFriend(event);
    const participants = mapParticipantsWithProfiles(event.participants);
    const isGroup = isGroupDining(event);
    const badgeText = event.joined ? '已加入' : canJoin ? '可加入' : '等待好友';
    const eventLabel = isGroup ? '多人饭局' : '饭局';

    return (
      <div className="bg-gradient-to-br from-orange-50 to-white rounded-2xl p-4 shadow-md border border-orange-100 animate-slide-up relative overflow-hidden mb-4">
        <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] px-2 py-1 rounded-bl-xl font-bold">
          {badgeText}
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center">
            <div className="flex -space-x-3">
              {participants.map((p, idx) => (
                <div
                  key={p.id}
                  className={`w-10 h-10 rounded-full ${p.avatarColor} border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-sm z-[${
                    10 - idx
                  }]`}
                >
                  {p.nickname[0]}
                </div>
              ))}
              <div className="w-10 h-10 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-gray-400 text-xs font-bold shadow-sm z-0">
                +
              </div>
            </div>
            <div className="ml-3">
              <span className="text-sm font-bold text-gray-800">{participants.map((p) => p.nickname).join(' & ')}</span>
              <span className="text-xs text-gray-500 block">等 {participants.length} 人</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap mt-1">
            <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-md font-medium">{event.food}</span>
            <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-md font-medium">{event.location}</span>
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-md font-medium">{event.sizePreference}</span>
          </div>
          <button
            onClick={() => handleJoinOpenEvent(event)}
            disabled={!canJoin || event.joined}
            className={`w-full py-2 mt-1 rounded-xl font-bold text-sm flex items-center justify-center gap-1 border transition-colors ${
              event.joined
                ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                : canJoin
              ? 'bg-white border-orange-200 text-orange-600 hover:bg-orange-50'
              : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {event.joined ? <><Check size={14} /> 已加入{eventLabel}</> : <><LogIn size={14} /> 加入{eventLabel}</>}
          </button>
        </div>
      </div>
    );
  };

  const FriendCard = ({ friend }) => (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-slide-up flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className={`w-12 h-12 rounded-full ${friend.avatarColor} flex items-center justify-center text-white font-bold text-xl shrink-0 border-2 border-white shadow-sm`}
          >
            {friend.nickname[0]}
          </div>
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-800 text-lg leading-tight">{friend.nickname}</h3>
              {friend.note && <span className="text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">{friend.note}</span>}
            </div>
            {friend.lunchPlan ? (
              <div className="flex flex-wrap gap-1.5">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-md flex items-center gap-0.5 whitespace-nowrap font-medium ${
                    friend.lunchPlan.hideFood ? 'bg-gray-100 text-gray-400' : 'bg-orange-100 text-orange-600'
                  }`}
                >
                  {friend.lunchPlan.hideFood ? (
                    <>
                      <EyeOff size={10} /> 秘密
                    </>
                  ) : (
                    friend.lunchPlan.food
                  )}
                </span>
                <span className="bg-blue-100 text-blue-600 text-[10px] px-2 py-0.5 rounded-md flex items-center gap-0.5 whitespace-nowrap font-medium">
                  {friend.lunchPlan.size}
                </span>
                <span className="bg-green-100 text-green-600 text-[10px] px-2 py-0.5 rounded-md flex items-center gap-0.5 whitespace-nowrap font-medium">
                  {friend.lunchPlan.time}
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-md flex items-center gap-0.5 whitespace-nowrap font-medium ${
                    friend.lunchPlan.hideLocation ? 'bg-gray-100 text-gray-400' : 'bg-purple-100 text-purple-600'
                  }`}
                >
                  {friend.lunchPlan.hideLocation ? (
                    <>
                      <EyeOff size={10} /> 秘密
                    </>
                  ) : (
                    friend.lunchPlan.location
                  )}
                </span>
              </div>
            ) : (
              <span className="text-xs text-gray-300">暂无计划</span>
            )}
          </div>
        </div>
        <div className="flex items-center ml-2">
          <button
            onClick={() => initiateDateFriend(friend)}
            className="flex items-center justify-center px-4 py-2 rounded-xl bg-gray-900 text-white hover:bg-black transition-colors shadow-md text-sm font-bold gap-1 active:scale-95"
          >
            <HandPlatter size={16} /> 约一下
          </button>
        </div>
      </div>
    </div>
  );

  const HomeView = () => {
    const visibleOpenEvents = openDiningEvents.filter((event) => eventHasFriend(event));
    const hasGroupEvents = visibleOpenEvents.some((event) => isGroupDining(event));
    const openDiningTitle = hasGroupEvents ? '好友在场的开放饭局（含多人局）' : '好友在场的开放饭局';
    if (confirmedDining) {
      return (
        <div className="flex flex-col h-full bg-orange-50">
          <div className="bg-white px-6 pt-10 pb-4 shadow-sm z-10 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">当前饭局</h1>
            {confirmedDining.isGroup ? (
              <div className="text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded-full border border-orange-100">多人饭局</div>
            ) : (
              <button
                onClick={() => setDiningViewMode(diningViewMode === 'me' ? 'partner' : 'me')}
                className="flex items-center gap-1 text-xs bg-white/50 px-2 py-1 rounded-full text-gray-500 hover:bg-white transition-colors"
              >
                <RefreshCw size={12} /> {diningViewMode === 'me' ? '模拟对方视角' : '返回我的视角'}
              </button>
            )}
          </div>
          <div className="flex-1 p-5 pt-3 flex flex-col items-center overflow-y-auto">
            <div className="bg-white w-full rounded-3xl shadow-xl overflow-hidden animate-slide-up relative max-h-[calc(100vh-190px)]">
              <div className="bg-gradient-to-r from-orange-400 to-red-500 h-20 relative flex items-center justify-center">
                <h2 className="text-white font-bold text-2xl drop-shadow-md">{confirmedDining.isGroup ? '多人饭局已确认 🎉' : diningViewMode === 'me' ? '饭局已确认 🎉' : '收到饭局邀请 🎉'}</h2>
                <div className="absolute -bottom-10 flex gap-3 justify-center w-full px-4">
                  {confirmedDining.isGroup ? (
                    <div className="flex -space-x-3 bg-white/20 px-3 py-2 rounded-full shadow-lg backdrop-blur-sm">
                      {confirmedDining.participants?.slice(0, 4).map((p, idx) => (
                        <div
                          key={p.id}
                          className={`w-12 h-12 rounded-full ${p.avatarColor} border-2 border-white flex items-center justify-center text-white font-bold text-lg shadow-sm z-[${
                            10 - idx
                          }]`}
                        >
                          {p.nickname[0]}
                        </div>
                      ))}
                      {confirmedDining.participants?.length > 4 && (
                        <div className="w-12 h-12 rounded-full bg-white/70 border-2 border-white flex items-center justify-center text-gray-500 text-sm font-bold shadow-sm">
                          +{confirmedDining.participants.length - 4}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex gap-4">
                      <div className="w-20 h-20 rounded-full bg-gray-200 border-4 border-white shadow-md overflow-hidden">
                        <div className="w-full h-full bg-gray-800 flex items-center justify-center text-white font-bold text-2xl">我</div>
                      </div>
                      <div
                        className={`w-20 h-20 rounded-full ${confirmedDining.partner.avatarColor} border-4 border-white shadow-md flex items-center justify-center text-white font-bold text-2xl`}
                      >
                        {diningViewMode === 'me' ? confirmedDining.partner.nickname[0] : '我'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="pt-12 pb-6 px-6 text-center space-y-5">
                {confirmedDining.isGroup ? (
                  <div className="space-y-3">
                    <p className="text-gray-400 text-xs uppercase tracking-wide font-semibold">多人饭局</p>
                    <p className="text-gray-800 font-bold text-lg truncate">{confirmedDining.title || '好友饭局'}</p>
                    <div className="flex flex-wrap justify-center gap-2 max-h-24 overflow-y-auto px-2">
                      {confirmedDining.participants?.map((p) => (
                        <span key={p.id} className="inline-flex items-center gap-1 bg-gray-50 text-gray-700 px-2 py-1 rounded-full text-xs">
                          <span className={`w-6 h-6 rounded-full ${p.avatarColor} text-white flex items-center justify-center text-[10px] font-bold`}>
                            {p.nickname[0]}
                          </span>
                          <span className="font-medium">{p.nickname}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wide font-semibold">PARTNER</p>
                    <p className="text-gray-800 font-bold text-lg">{diningViewMode === 'me' ? confirmedDining.partner.nickname : '我'}</p>
                    <div className="mt-2">
                      {confirmedDining.isAcknowledged ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                          <CheckCircle2 size={12} /> {diningViewMode === 'me' ? '对方已确认收到' : '我已确认收到'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-500 bg-orange-50 px-3 py-1 rounded-full animate-pulse">
                          <Clock size={12} /> {diningViewMode === 'me' ? '等待对方确认收到...' : '等待我确认收到...'}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-orange-50 p-3 rounded-xl">
                    <Utensils className="mx-auto text-orange-500 mb-1" size={20} />
                    <p className="text-xs text-gray-400">吃什么</p>
                    <p className="font-bold text-gray-800">
                      {confirmedDining.isGroup
                        ? confirmedDining.food
                        : confirmedDining.partner.lunchPlan?.hideFood && diningViewMode === 'me'
                        ? '🤫 秘密'
                        : confirmedDining.food}
                    </p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-xl">
                    <Clock className="mx-auto text-green-500 mb-1" size={20} />
                    <p className="text-xs text-gray-400">时间</p>
                    <p className="font-bold text-gray-800">{confirmedDining.time}</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-xl">
                    <MapPin className="mx-auto text-purple-500 mb-1" size={20} />
                    <p className="text-xs text-gray-400">地点</p>
                    <p className="font-bold text-gray-800">
                      {confirmedDining.isGroup
                        ? confirmedDining.location
                        : confirmedDining.partner.lunchPlan?.hideLocation && diningViewMode === 'me'
                        ? '🤫 秘密'
                        : confirmedDining.location}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-xl">
                    <Users className="mx-auto text-blue-500 mb-1" size={20} />
                    <p className="text-xs text-gray-400">人数</p>
                    <p className="font-bold text-gray-800">{confirmedDining.size || `${confirmedDining.participants?.length || 0}人`}</p>
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-100">
                  {confirmedDining.isGroup ? (
                    <>
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                        <span>生成时间: {confirmedDining.timestamp}</span>
                        <button onClick={handleExitDining} className="text-red-400 hover:text-red-500 font-medium">退出饭局</button>
                      </div>
                      <button onClick={handleInitiateCancel} className="text-red-400 text-sm font-medium hover:text-red-500">
                        取消/结束饭局
                      </button>
                    </>
                  ) : diningViewMode === 'me' ? (
                    <>
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                        <span>生成时间: {confirmedDining.timestamp}</span>
                        <button onClick={handleExitDining} className="text-red-400 hover:text-red-500 font-medium">退出饭局</button>
                      </div>
                      <button onClick={handleInitiateCancel} className="text-red-400 text-sm font-medium hover:text-red-500">
                        取消/结束饭局
                      </button>
                    </>
                  ) : (
                    <div className="space-y-3">
                      {!confirmedDining.isAcknowledged ? (
                        <button
                          onClick={handlePartnerAcknowledge}
                          className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
                        >
                          <Check size={20} /> 👌 收到，没问题
                        </button>
                      ) : (
                        <button disabled className="w-full py-3 bg-gray-100 text-gray-400 rounded-xl font-bold cursor-not-allowed">
                          已确认收到
                        </button>
                      )}
                      <p className="text-xs text-gray-400">这是模拟的对方视角，点击上方按钮确认。</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    const activeFriends = friends.filter((f) => f.status === 'active');
    let matchedFriends = [];
    let otherFriends = [];

    if (myStatus === 'active') {
      activeFriends.forEach((friend) => {
        const isPlanMatch = checkIsMatch(lunchDetails, friend.lunchPlan);
        if (isPlanMatch) matchedFriends.push(friend);
        else otherFriends.push(friend);
      });
    }

    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-white px-6 pt-10 pb-6 rounded-b-3xl shadow-sm z-10 transition-all duration-300">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">中午好，<br />今天想和朋友吃饭吗？</h1>
          {myStatus === 'active' ? (
            <div className="relative overflow-hidden rounded-2xl transition-all duration-300 border-2 bg-orange-50 border-orange-200 shadow-orange-100 shadow-lg p-4 animate-pulse-slow">
              <div className="flex items-center justify-between relative z-10">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-orange-600 text-lg flex items-center gap-1">
                      正在求约饭 <Zap size={16} fill="currentColor" className="animate-pulse" />
                    </span>
                    <button
                      onClick={handleStopStatus}
                      className="text-xs bg-orange-200 text-orange-700 px-2 py-0.5 rounded-full font-medium hover:bg-orange-300 transition-colors"
                    >
                      点击结束
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-y-2 text-sm text-gray-700">
                    <div className="flex items-center gap-1.5">
                      <Utensils size={14} className="text-orange-400" />
                      <span className="font-medium">{lunchDetails.food || '随意'}</span>
                      {lunchDetails.hideFood && <EyeOff size={14} className="text-gray-400" />}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users size={14} className="text-blue-400" />
                      <span>{lunchDetails.size}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className="text-green-400" />
                      <span>{lunchDetails.time}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin size={14} className="text-purple-400" />
                      <span className="truncate max-w-[80px]">{lunchDetails.location}</span>
                      {lunchDetails.hideLocation && <EyeOff size={14} className="text-gray-400" />}
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-orange-100 text-xs text-orange-400 flex items-center gap-1">
                    <Eye size={12} /> 对所有朋友可见
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full flex items-center justify-center ml-2 bg-orange-500 shadow-md relative group">
                  <div className="absolute inset-0 rounded-full bg-orange-400 animate-ping opacity-75"></div>
                  <Utensils size={24} className="text-white relative z-10" />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleQuickStart}
                className="flex flex-col items-center justify-center gap-2 p-4 bg-gradient-to-br from-green-400 to-green-500 rounded-2xl shadow-lg text-white hover:scale-[1.02] transition-transform active:scale-95"
              >
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Sparkles size={24} fill="white" className="text-white" />
                </div>
                <span className="font-bold">一切随缘</span>
                <span className="text-xs text-green-100">一键开摆 啥都行</span>
              </button>
              <button
                onClick={handleCustomStart}
                className="flex flex-col items-center justify-center gap-2 p-4 bg-white border-2 border-orange-100 rounded-2xl shadow-sm hover:border-orange-200 transition-colors active:scale-95 group"
              >
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                  <Target size={24} className="text-orange-500" />
                </div>
                <span className="font-bold text-gray-700">精准组局</span>
                <span className="text-xs text-gray-400">想吃啥 我说了算</span>
              </button>
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-6 pb-24">
          {visibleOpenEvents.length > 0 && (
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 px-1">
                <CalendarCheck className="text-orange-500" size={18} />
                <h2 className="font-bold text-gray-800">{openDiningTitle}</h2>
                <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-bold">{visibleOpenEvents.length}</span>
              </div>
              <div className="space-y-3">
                {visibleOpenEvents.map((event) => (
                  <OpenDiningCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          )}
          {myStatus === 'active' ? (
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-2 mb-3 px-2">
                  <Sparkles className="text-yellow-500" size={18} fill="currentColor" />
                  <h2 className="font-bold text-gray-800">完美匹配</h2>
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">{matchedFriends.length}</span>
                </div>
                {matchedFriends.length > 0 ? (
                  <div className="space-y-4">{matchedFriends.map((friend) => <FriendCard key={friend.id} friend={friend} />)}</div>
                ) : (
                  <div className="bg-white/50 border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center text-gray-400 gap-2">
                    <Sparkles size={24} className="opacity-20" />
                    <span className="text-sm">暂时没有完美匹配的朋友<br />再等等看？</span>
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3 px-2">
                  <Users className="text-gray-400" size={18} />
                  <h2 className="font-bold text-gray-500">其他活跃饭友</h2>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{otherFriends.length}</span>
                </div>
                {otherFriends.length > 0 ? (
                  <div className="space-y-4">{otherFriends.map((friend) => <FriendCard key={friend.id} friend={friend} />)}</div>
                ) : (
                  <div className="bg-white/50 border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center text-gray-400 gap-2">
                    <Users size={24} className="opacity-20" />
                    <span className="text-sm">暂时没有其他活跃的朋友</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4 px-2">
                <h2 className="font-bold text-gray-700">正在觅食的朋友 ({activeFriends.length})</h2>
                <span className="text-xs text-orange-500 bg-orange-100 px-2 py-1 rounded-full">实时更新</span>
              </div>
              <div className="space-y-4">
                {activeFriends.map((friend) => (
                  <FriendCard key={friend.id} friend={friend} />
                ))}
                {activeFriends.length === 0 && (
                  <div className="text-center py-10 text-gray-400 text-sm">
                    哎呀，现在好像没有朋友在找吃的。<br />要不你主动吼一声？
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  const FriendsView = () => {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-white px-6 pt-10 pb-4 shadow-sm z-10">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">我和朋友</h1>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-5 text-white shadow-lg mb-2">
            <div className="flex items-center gap-4">
              <div
                className={`w-16 h-16 rounded-full ${userProfile?.avatarColor || 'bg-orange-500'} flex items-center justify-center text-2xl font-bold border-4 border-white/20 shadow-inner`}
              >
                {userProfile?.nickname?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {isEditingName ? (
                    <div className="flex gap-2 w-full">
                      <input
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="bg-white/10 text-white text-lg font-bold rounded px-2 py-0.5 w-full focus:outline-none focus:ring-1 focus:ring-orange-500"
                        autoFocus
                      />
                      <button onClick={handleUpdateNickname} className="p-1 bg-orange-500 rounded hover:bg-orange-600">
                        <Save size={16} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-xl font-bold truncate">{userProfile?.nickname}</h2>
                      <button onClick={() => setIsEditingName(true)} className="text-gray-400 hover:text-white transition-colors">
                        <Edit2 size={14} />
                      </button>
                    </>
                  )}
                </div>

                <div
                  className="flex items-center gap-2 bg-white/10 rounded-lg px-2 py-1.5 w-fit cursor-pointer hover:bg-white/20 transition-colors active:scale-95"
                  onClick={() => copyToClipboard(userProfile?.shortId)}
                >
                  <span className="text-xs text-gray-300 font-mono">ID: {userProfile?.shortId}</span>
                  <Copy size={12} className="text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 px-6 py-2 overflow-x-auto">
          <button
            onClick={handleSimulateFriendRequest}
            className="text-xs border border-gray-300 px-2 py-1 rounded bg-gray-50 whitespace-nowrap hover:bg-gray-100"
          >
            ⚡️模拟好友请求
          </button>
          {friends.length > 0 && (
            <button
              onClick={() => simulateIncomingInvite(friends[0])}
              className="text-xs border border-gray-300 px-2 py-1 rounded bg-gray-50 whitespace-nowrap hover:bg-gray-100"
            >
              ⚡️模拟收到邀请
            </button>
          )}
        </div>

        <div className="flex justify-between items-center px-6 py-3">
          <h2 className="font-bold text-gray-700">我的好友 ({friends.length})</h2>
          <button
            onClick={() => setShowAddFriendModal(true)}
            className="p-1.5 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors active:scale-95"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 pt-0 pb-24 space-y-3">
          {friends.map((friend) => (
            <div key={friend.id} className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-10 h-10 shrink-0 rounded-full ${friend.avatarColor} flex items-center justify-center text-white font-bold text-sm`}>
                  {friend.nickname[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-bold text-gray-800 truncate">{friend.nickname}</div>
                    <button
                      onClick={() => openNoteModal(friend)}
                      className="text-gray-300 hover:text-orange-500 transition-colors p-1 rounded-full hover:bg-orange-50"
                    >
                      <Edit size={14} />
                    </button>
                  </div>
                  {friend.note && <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">备注: {friend.note}</div>}
                </div>
              </div>
              <button
                onClick={() => initiateDeleteFriend(friend)}
                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>

        {showAddFriendModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAddFriendModal(false)}></div>
            <div className="bg-white w-full max-w-sm rounded-2xl p-6 relative z-10 animate-bounce-in">
              <h3 className="text-lg font-bold mb-4">添加新朋友</h3>
              <input
                type="text"
                value={newFriendId}
                onChange={(e) => setNewFriendId(e.target.value)}
                placeholder="输入朋友账号 (ID)"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-orange-200"
                autoFocus
              />
              <div className="flex gap-3">
                <button onClick={() => setShowAddFriendModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium">
                  取消
                </button>
                <button onClick={handleAddFriend} className="flex-1 py-3 bg-gray-900 text-white rounded-xl font-medium">
                  确认添加
                </button>
              </div>
            </div>
          </div>
        )}

        {friendToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setFriendToDelete(null)}></div>
            <div className="bg-white w-full max-w-sm rounded-2xl p-6 relative z-10 animate-bounce-in">
              <h3 className="text-lg font-bold mb-2">删除朋友</h3>
              <p className="text-gray-500 mb-6">
                确定要删除 <span className="font-bold text-gray-800">{friendToDelete.nickname}</span> 吗？此操作无法撤销。
              </p>
              <div className="flex gap-3">
                <button onClick={() => setFriendToDelete(null)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium">
                  取消
                </button>
                <button
                  onClick={confirmDeleteFriend}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium shadow-md shadow-red-200"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        )}

        {showNoteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowNoteModal(false)}></div>
            <div className="bg-white w-full max-w-sm rounded-2xl p-6 relative z-10 animate-bounce-in">
              <h3 className="text-lg font-bold mb-4">设置备注</h3>
              <p className="text-sm text-gray-500 mb-2">
                为 <span className="font-bold text-gray-800">{currentNoteFriend?.nickname}</span> 设置备注名：
              </p>
              <input
                type="text"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="输入备注..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-orange-200"
                autoFocus
              />
              <div className="flex gap-3">
                <button onClick={() => setShowNoteModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium">
                  取消
                </button>
                <button onClick={handleSaveNote} className="flex-1 py-3 bg-gray-900 text-white rounded-xl font-medium">
                  保存
                </button>
              </div>
            </div>
          </div>
        )}

        {showFriendRequestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowFriendRequestModal(false)}></div>
            <div className="bg-white w-full max-w-sm rounded-2xl p-6 relative z-10 animate-bounce-in">
              <h3 className="text-lg font-bold mb-4">新好友请求</h3>
              <div className="space-y-3 mb-4">
                {friendRequests.map((req) => (
                  <div key={req.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full ${req.avatarColor} flex items-center justify-center text-white text-xs`}>
                        {req.nickname[0]}
                      </div>
                      <div>
                        <div className="font-bold text-sm">{req.nickname}</div>
                        <div className="text-xs text-gray-400">ID: {req.shortId}</div>
                      </div>
                    </div>
                    <button onClick={() => acceptFriendRequest(req)} className="px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg font-bold">
                      接受
                    </button>
                  </div>
                ))}
                {friendRequests.length === 0 && <p className="text-gray-400 text-center text-sm">暂无新请求</p>}
              </div>
              <button onClick={() => setShowFriendRequestModal(false)} className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl font-medium">
                关闭
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (authLoading) {
    return (
      <div className="bg-orange-50 h-screen flex items-center justify-center">
        <p className="text-orange-500 font-bold animate-pulse">加载中...</p>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="bg-white h-screen flex flex-col px-8 pt-20 pb-10">
        <div className="flex-1">
          <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
            <Utensils size={32} className="text-orange-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            欢迎来到
            <br />
            LunchBuddy
          </h1>
          <p className="text-gray-500 mb-10">只需一步，开启你的蹭饭之旅。</p>
          <form onSubmit={handleRegistration}>
            <label className="block text-sm font-bold text-gray-700 mb-2">怎么称呼你？</label>
            <input
              type="text"
              value={registrationName}
              onChange={(e) => setRegistrationName(e.target.value)}
              placeholder="给自己起个响亮的名字"
              className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-4 text-lg focus:outline-none focus:border-orange-500 transition-colors"
              autoFocus
              maxLength={10}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {RANDOM_NICKNAMES.map((name) => (
                <button
                  type="button"
                  key={name}
                  onClick={() => setRegistrationName(name)}
                  className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full hover:bg-orange-100 hover:text-orange-600 transition-colors"
                >
                  {name}
                </button>
              ))}
            </div>
            <button
              type="submit"
              disabled={!registrationName.trim() || isRegistering}
              className="w-full bg-gray-900 text-white rounded-xl py-4 font-bold text-lg mt-8 shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRegistering ? '创建中...' : (
                <>
                  开始觅食 <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-gray-300">LunchBuddy v2.0</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen flex justify-center font-sans antialiased text-gray-900 selection:bg-orange-100">
      <div className="w-full max-w-md bg-white h-[100dvh] overflow-hidden relative shadow-2xl flex flex-col">
        <div className="flex-1 overflow-hidden relative">
          {activeTab === 'home' && <HomeView />}
          {activeTab === 'friends' && <FriendsView />}
        </div>
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} friendRequestCount={friendRequests.length} />
        {showInstallPrompt && !isStandalone && (
          <div className="fixed bottom-24 left-4 right-4 z-40 animate-slide-up">
            <div className="bg-white/95 backdrop-blur-xl border border-gray-200 shadow-2xl rounded-2xl p-4 flex items-start gap-3">
              <div className="p-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900">
                <SquarePlus size={18} strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-800">添加到主屏幕</p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  {installPromptEvent
                    ? '安装 LunchBuddy 到桌面，获取更便捷的启动体验与提醒。'
                    : isIos
                      ? '在浏览器底部的分享菜单中选择 “添加到主屏幕”，即可快速打开 LunchBuddy。'
                      : '在浏览器菜单中选择 “添加到主屏幕/安装应用”，即可更方便地启动 LunchBuddy。'}
                </p>
                {showInstallGuide && !installPromptEvent && (
                  <div className="mt-3 p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-600 leading-relaxed">
                    <p className="font-semibold text-gray-800 mb-1">添加步骤：</p>
                    {isIos ? (
                      <ol className="list-decimal list-inside space-y-1">
                        <li>点击浏览器底部的分享图标</li>
                        <li>选择 “添加到主屏幕”</li>
                        <li>点击右上角 “添加” 完成安装</li>
                      </ol>
                    ) : (
                      <ol className="list-decimal list-inside space-y-1">
                        <li>打开浏览器菜单（⋮/…）</li>
                        <li>找到 “添加到主屏幕” 或 “安装应用”</li>
                        <li>确认添加后即可从桌面打开 LunchBuddy</li>
                      </ol>
                    )}
                  </div>
                )}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleInstallApp}
                    className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl font-bold shadow-md active:scale-95 transition-transform"
                  >
                    {installPromptEvent ? '立即添加' : showInstallGuide ? '收起指引' : '查看指引'}
                  </button>
                  <button
                    onClick={handleDismissInstallPrompt}
                    className="px-3 py-2 text-xs text-gray-500 bg-gray-100 rounded-xl font-medium hover:bg-gray-200"
                  >
                    稍后再说
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        <StatusConfigModal
          isOpen={showStatusConfig}
          lunchDetails={lunchDetails}
          onClose={() => setShowStatusConfig(false)}
          onConfirm={confirmPublishStatus}
          onUpdate={setLunchDetails}
          onTogglePrivacy={togglePrivacy}
        />
        <NotificationOverlay notification={notification} onClick={handleNotificationClick} />

        {friendToDate && !['partner', 'received_invite'].includes(datingStep) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setFriendToDate(null)}></div>
            <div className="bg-white w-full max-w-sm rounded-2xl p-6 relative z-10 animate-bounce-in text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <HandPlatter size={32} className="text-orange-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">约个饭？</h3>
              <p className="text-gray-500 mb-6">
                确定要约 <span className="font-bold text-gray-800">{friendToDate.nickname}</span> 吗？
                <br />
                这将会结束你们当前的“求约”状态。
              </p>
              <div className="flex gap-3">
                <button onClick={() => setFriendToDate(null)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium">
                  再想想
                </button>
                <button onClick={handlePartnerAccept} className="flex-1 py-3 bg-gray-900 text-white rounded-xl font-medium shadow-lg active:scale-95 transition-transform">
                  确定约！
                </button>
              </div>
            </div>
          </div>
        )}

        {friendToDate && datingStep === 'partner' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md"></div>
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 relative z-10 animate-bounce-in text-center border-4 border-orange-200">
              <div className="absolute -top-4 -left-4 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">模拟对方视角</div>
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-lg">
                <div className="text-2xl font-bold text-gray-600">我</div>
              </div>
              <div className="flex items-center justify-center gap-2 mb-2 text-orange-500">
                <BellRing className="animate-bounce" size={20} />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-800">收到约饭邀请！</h3>
              <p className="text-gray-500 mb-6 text-sm">
                <span className="font-bold text-gray-800">我</span> 想要和你一起去吃
                <br />
                <span className="font-bold text-orange-500">{friendToDate.lunchPlan ? friendToDate.lunchPlan.food : lunchDetails.food || '随便'}</span>
              </p>
              <div className="flex gap-3">
                <button onClick={handlePartnerDecline} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold text-lg shadow-sm active:scale-95 transition-transform">
                  暂不回应
                </button>
                <button onClick={handlePartnerAccept} className="flex-1 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2">
                  <Zap size={20} fill="currentColor" />走起！
                </button>
              </div>
            </div>
          </div>
        )}

        {friendToDate && datingStep === 'received_invite' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md"></div>
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 relative z-10 animate-bounce-in text-center border-4 border-orange-200">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-lg">
                <div className="text-2xl font-bold text-gray-600">我</div>
              </div>
              <div className="flex items-center justify-center gap-2 mb-2 text-orange-500">
                <BellRing className="animate-bounce" size={20} />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-800">收到约饭邀请！</h3>
              <p className="text-gray-500 mb-6 text-sm">
                <span className="font-bold text-gray-800">{friendToDate.nickname}</span> 想要和你一起去吃
                <br />
                <span className="font-bold text-orange-500">{friendToDate.lunchPlan ? friendToDate.lunchPlan.food : '随便'}</span>
              </p>
              <div className="flex gap-3">
                <button onClick={handlePartnerDecline} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold text-lg shadow-sm active:scale-95 transition-transform">
                  暂不回应
                </button>
                <button onClick={handlePartnerAccept} className="flex-1 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2">
                  <Zap size={20} fill="currentColor" />走起！
                </button>
              </div>
            </div>
          </div>
        )}

        {showCancelDiningModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCancelDiningModal(false)}></div>
            <div className="bg-white w-full max-w-sm rounded-2xl p-6 relative z-10 animate-bounce-in">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-red-500">
                <MessageSquare size={20} />取消饭局
              </h3>
              <p className="text-sm text-gray-500 mb-4">请填写原因，让朋友知道为什么取消：</p>
              <textarea
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 h-24 resize-none mb-4"
                placeholder="例如：临时有急事，下次再约..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                autoFocus
              />
              <div className="flex gap-3">
                <button onClick={() => setShowCancelDiningModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium text-sm">
                  再想想
                </button>
                <button
                  onClick={handleConfirmCancel}
                  disabled={!cancelReason.trim()}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  确认取消
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
