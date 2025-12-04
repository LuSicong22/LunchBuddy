import { useCallback, useEffect, useState } from 'react';
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

export function useFriends({ db, user, appId }) {
  const [friends, setFriends] = useState(USE_MOCK_DATA ? INITIAL_FRIENDS : []);
  const [friendRequests, setFriendRequests] = useState([]);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [newFriendId, setNewFriendId] = useState('');
  const [friendToDelete, setFriendToDelete] = useState(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [currentNoteFriend, setCurrentNoteFriend] = useState(null);
  const [noteInput, setNoteInput] = useState('');
  const [showFriendRequestModal, setShowFriendRequestModal] = useState(false);

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

  const acceptFriendRequest = useCallback(
    (request) => {
      const newFriend = { ...request, status: 'active', lunchPlan: null };
      setFriends((prev) => [...prev, newFriend]);
      setFriendRequests((prev) => prev.filter((r) => r.id !== request.id));
      if (friendRequests.length <= 1) setShowFriendRequestModal(false);
    },
    [friendRequests.length]
  );

  const handleAddFriend = useCallback(async () => {
    if (!newFriendId.trim() || newFriendId.length !== 6) {
      alert('请输入6位数字ID');
      return;
    }
    if (!db || !user) {
      alert('当前离线模式，无法添加好友');
      return;
    }
    try {
      const usersRef = collection(db, 'artifacts', appId, 'users');
      const q = query(usersRef, where('shortId', '==', newFriendId));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        alert('未找到该 ID 的用户，请确认对方已注册');
        return;
      }

      const friendDoc = querySnapshot.docs[0];
      const friendData = friendDoc.data();

      if (friendData.uid === user.uid) {
        alert('不能添加自己为好友');
        return;
      }

      const myFriendRef = doc(db, 'artifacts', appId, 'users', user.uid, 'friends', friendData.uid);
      await setDoc(myFriendRef, {
        uid: friendData.uid,
        addedAt: new Date().toISOString(),
        note: ''
      });

      alert(`成功添加 ${friendData.nickname}！`);
      setNewFriendId('');
      setShowAddFriendModal(false);
    } catch (error) {
      console.error('Add friend error:', error);
      alert('添加失败，请重试');
    }
  }, [appId, db, newFriendId, user]);

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
