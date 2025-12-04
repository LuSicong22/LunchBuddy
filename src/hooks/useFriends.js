import { useCallback, useEffect, useRef, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore';
import { INITIAL_FRIENDS, USE_MOCK_DATA } from '../constants';

export function useFriends({ db, user, appId, userProfile, showToast }) {
  const [friends, setFriends] = useState(USE_MOCK_DATA ? INITIAL_FRIENDS : []);
  const [friendRequests, setFriendRequests] = useState([]);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [newFriendId, setNewFriendId] = useState('');
  const [friendToDelete, setFriendToDelete] = useState(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [currentNoteFriend, setCurrentNoteFriend] = useState(null);
  const [noteInput, setNoteInput] = useState('');
  const [showFriendRequestModal, setShowFriendRequestModal] = useState(false);
  const previousRequestCountRef = useRef(0);

  useEffect(() => {
    if (USE_MOCK_DATA) return;
    if (!db || !user) {
      setFriends([]);
      return;
    }

    const friendsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'friends');
    let unsubscribeFriendDetails = null;

    const unsubFriends = onSnapshot(
      friendsRef,
      (snapshot) => {
        const friendIds = snapshot.docs.map((docSnap) => docSnap.data().uid || docSnap.id);
        const noteMap = snapshot.docs.reduce((acc, docSnap) => {
          const data = docSnap.data();
          const targetId = data.uid || docSnap.id;
          acc[targetId] = data.note || '';
          return acc;
        }, {});

        if (unsubscribeFriendDetails) {
          unsubscribeFriendDetails();
          unsubscribeFriendDetails = null;
        }

        if (friendIds.length === 0) {
          setFriends([]);
          return;
        }

        const limitedIds = friendIds.slice(0, 10); // Firestore "in" queries support up to 10.
        const usersRef = collection(db, 'artifacts', appId, 'users');
        const detailQuery = query(usersRef, where('uid', 'in', limitedIds));
        unsubscribeFriendDetails = onSnapshot(
          detailQuery,
          (userSnaps) => {
            const realFriends = userSnaps.docs.map((docSnap) => {
              const data = docSnap.data();
              return {
                id: data.uid,
                ...data,
                note: noteMap[data.uid] || ''
              };
            });
            setFriends(realFriends);
          },
          (error) => console.error('Friends detail listen error:', error)
        );
      },
      (error) => console.error('Friends listen error:', error)
    );

    return () => {
      unsubFriends();
      if (unsubscribeFriendDetails) unsubscribeFriendDetails();
    };
  }, [db, user, appId]);

  useEffect(() => {
    if (USE_MOCK_DATA) return;
    if (!db || !user) {
      setFriendRequests([]);
      return;
    }
    const requestsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'friendRequests');
    const unsubscribe = onSnapshot(
      requestsRef,
      (snapshot) => {
        const requests = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const fromUid = data.fromUid || data.uid || docSnap.id;
          const fromNickname = data.fromNickname || data.nickname || '好友';
          const fromShortId = data.fromShortId || data.shortId || '';
          const fromAvatarColor = data.fromAvatarColor || data.avatarColor || 'bg-orange-500';
          return {
            id: docSnap.id,
            ...data,
            fromUid,
            fromNickname,
            fromShortId,
            fromAvatarColor,
            nickname: fromNickname,
            shortId: fromShortId,
            avatarColor: fromAvatarColor
          };
        });
        setFriendRequests(requests);
        if (requests.length > previousRequestCountRef.current) {
          setShowFriendRequestModal(true);
        }
        previousRequestCountRef.current = requests.length;
      },
      (error) => console.error('Friend requests listen error:', error)
    );
    return () => unsubscribe();
  }, [appId, db, user]);

  const acceptFriendRequest = useCallback(
    async (request) => {
      const newFriend = {
        id: request.fromUid,
        nickname: request.fromNickname,
        shortId: request.fromShortId,
        avatarColor: request.fromAvatarColor,
        status: 'active',
        lunchPlan: null,
        note: ''
      };
      setFriends((prev) => [...prev, newFriend]);
      setFriendRequests((prev) => prev.filter((r) => r.id !== request.id));
      if (friendRequests.length <= 1) setShowFriendRequestModal(false);

      if (db && user) {
        try {
          const now = new Date().toISOString();
          const myFriendRef = doc(db, 'artifacts', appId, 'users', user.uid, 'friends', request.fromUid);
          const otherFriendRef = doc(db, 'artifacts', appId, 'users', request.fromUid, 'friends', user.uid);
          const requestRef = doc(db, 'artifacts', appId, 'users', user.uid, 'friendRequests', request.id);
          await Promise.all([
            setDoc(myFriendRef, { uid: request.fromUid, addedAt: now, note: '' }, { merge: true }),
            setDoc(otherFriendRef, { uid: user.uid, addedAt: now, note: '' }, { merge: true }),
            deleteDoc(requestRef)
          ]);
        } catch (error) {
          console.error('Accept friend request error:', error);
        }
      }
    },
    [appId, db, friendRequests.length, user]
  );

  const handleAddFriend = useCallback(async () => {
    if (!newFriendId.trim() || newFriendId.length !== 6) {
      showToast?.('请检查 ID', '请输入6位数字ID', 'error');
      return;
    }
    if (!db || !user) {
      showToast?.('当前离线模式，无法添加好友', '', 'error');
      return;
    }
    try {
      const usersRef = collection(db, 'artifacts', appId, 'users');
      const q = query(usersRef, where('shortId', '==', newFriendId));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        showToast?.('没有找到这个朋友', '请确认 TA 已注册并提供正确的 6 位 ID', 'error');
        return;
      }

      const friendDoc = querySnapshot.docs[0];
      const friendData = friendDoc.data();

      if (friendData.uid === user.uid) {
        showToast?.('不能添加自己', '换个朋友试试吧', 'error');
        return;
      }

      const alreadyFriend = friends.some((f) => f.id === friendData.uid || f.shortId === friendData.shortId);
      if (alreadyFriend) {
        showToast?.('已在好友列表中', '', 'info');
        return;
      }

      const requestRef = doc(db, 'artifacts', appId, 'users', friendData.uid, 'friendRequests', user.uid);
      await setDoc(requestRef, {
        fromUid: user.uid,
        fromNickname: userProfile?.nickname || '好友',
        fromShortId: userProfile?.shortId || '',
        fromAvatarColor: userProfile?.avatarColor || 'bg-orange-500',
        createdAt: new Date().toISOString()
      });

      showToast?.('好友请求已发送', `已向 ${friendData.nickname} 发送好友请求`, 'success');
      setNewFriendId('');
      setShowAddFriendModal(false);
    } catch (error) {
      console.error('Add friend error:', error);
      showToast?.('添加失败，请重试', '', 'error');
    }
  }, [appId, db, friends, newFriendId, showToast, user, userProfile]);

  const initiateDeleteFriend = useCallback((friend) => setFriendToDelete(friend), []);
  const confirmDeleteFriend = useCallback(async () => {
    if (friendToDelete) {
      if (db && user) {
        try {
          const friendRef = doc(db, 'artifacts', appId, 'users', user.uid, 'friends', friendToDelete.id);
          await deleteDoc(friendRef);
        } catch (error) {
          console.error('Delete friend error:', error);
        }
      }
      setFriends((prev) => prev.filter((f) => f.id !== friendToDelete.id));
      setFriendToDelete(null);
    }
  }, [appId, db, friendToDelete, user]);

  const openNoteModal = useCallback((friend) => {
    setCurrentNoteFriend(friend);
    setNoteInput(friend.note || '');
    setShowNoteModal(true);
  }, []);

  const handleSaveNote = useCallback(async () => {
    if (currentNoteFriend) {
      if (db && user) {
        try {
          const noteRef = doc(db, 'artifacts', appId, 'users', user.uid, 'friends', currentNoteFriend.id);
          await updateDoc(noteRef, { note: noteInput });
        } catch (error) {
          console.error('Save note error:', error);
        }
      }
      setFriends((prev) => prev.map((f) => (f.id === currentNoteFriend.id ? { ...f, note: noteInput } : f)));
    }
    setShowNoteModal(false);
  }, [appId, currentNoteFriend, db, noteInput, user]);

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
    acceptFriendRequest,
    handleAddFriend,
    initiateDeleteFriend,
    confirmDeleteFriend,
    openNoteModal,
    handleSaveNote
  };
}
