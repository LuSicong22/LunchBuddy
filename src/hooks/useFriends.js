import { useCallback, useState } from 'react';
import { INITIAL_FRIENDS } from '../constants';
import { generateShortId } from '../utils/id';

export function useFriends() {
  const [friends, setFriends] = useState(INITIAL_FRIENDS);
  const [friendRequests, setFriendRequests] = useState([]);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [newFriendId, setNewFriendId] = useState('');
  const [friendToDelete, setFriendToDelete] = useState(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [currentNoteFriend, setCurrentNoteFriend] = useState(null);
  const [noteInput, setNoteInput] = useState('');
  const [showFriendRequestModal, setShowFriendRequestModal] = useState(false);

  const simulateFriendRequest = useCallback(() => {
    const randomId = generateShortId();
    const newRequest = { id: Date.now(), nickname: `新朋友_${randomId}`, shortId: randomId, avatarColor: 'bg-indigo-500' };
    setFriendRequests((prev) => [...prev, newRequest]);
    return newRequest;
  }, []);

  const acceptFriendRequest = useCallback(
    (request) => {
      const newFriend = { ...request, status: 'active', lunchPlan: null };
      setFriends((prev) => [...prev, newFriend]);
      setFriendRequests((prev) => prev.filter((r) => r.id !== request.id));
      if (friendRequests.length <= 1) setShowFriendRequestModal(false);
    },
    [friendRequests.length]
  );

  const handleAddFriend = useCallback(() => {
    if (!newFriendId.trim() || newFriendId.length !== 6) {
      alert('请输入6位数字ID');
      return;
    }
    const newFriend = {
      id: Date.now(),
      nickname: `用户_${newFriendId}`,
      wechatId: 'unknown',
      shortId: newFriendId,
      note: '',
      avatarColor: `bg-${['purple', 'indigo', 'teal', 'red'][Math.floor(Math.random() * 4)]}-500`,
      status: 'active',
      lunchPlan: { food: '随便吃点', size: '随意', time: '12:00', location: '附近', hideFood: false, hideLocation: false }
    };
    setFriends((prev) => [...prev, newFriend]);
    setNewFriendId('');
    setShowAddFriendModal(false);
  }, [newFriendId]);

  const initiateDeleteFriend = useCallback((friend) => setFriendToDelete(friend), []);
  const confirmDeleteFriend = useCallback(() => {
    if (friendToDelete) {
      setFriends((prev) => prev.filter((f) => f.id !== friendToDelete.id));
      setFriendToDelete(null);
    }
  }, [friendToDelete]);

  const openNoteModal = useCallback((friend) => {
    setCurrentNoteFriend(friend);
    setNoteInput(friend.note || '');
    setShowNoteModal(true);
  }, []);

  const handleSaveNote = useCallback(() => {
    if (currentNoteFriend) {
      setFriends((prev) => prev.map((f) => (f.id === currentNoteFriend.id ? { ...f, note: noteInput } : f)));
    }
    setShowNoteModal(false);
  }, [currentNoteFriend, noteInput]);

  return {
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
  };
}
