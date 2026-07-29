import React, { useState, useEffect } from 'react';
import { saveAuthSession } from './hooks/useAuth';
import OtpVerify from './components/OtpVerify';
import type { AuthResponse } from './types/Auth';
import { useWebSocket } from './context/WebSocketContext';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import GroupChatArea from './components/GroupChatArea';
import CallOverlay from './components/CallOverlay';
import Login from './components/Login';
import Register from './components/Register';
import { resetChatDBConnection } from './db/chatDB';
import { createGroup, getUserGroups, deleteGroup as deleteGroupApi } from './services/groupService';
import type { GroupInfo } from './services/groupService';
import { useCall } from './context/CallContext';
import type { CallKind } from './types/Call';
import { getDisplayName as getMyDisplayName } from './hooks/useAuth';
import ProfileModal from './components/ProfileModal';
import { getMyProfile } from './services/profileService';
import type { UserProfile } from './types/Profile';
import { updateDisplayName } from './hooks/useAuth';

const App: React.FC = () => {
  const { startCall } = useCall();
  const { connect, isConnected, disconnect, messages, groupUpdateEvent } = useWebSocket();
  const [myDisplayName, setMyDisplayName] = useState<string | null>(getMyDisplayName());
  const [authView, setAuthView] = useState<'login' | 'register' | 'otp'>('login');
  const [pendingIdentifier, setPendingIdentifier] = useState<string>('');
  const [myProfile, setMyProfile] = useState<UserProfile | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const handleAuthSuccess = (auth: AuthResponse) => {
    const displayName = `${auth.firstName} ${auth.lastName}`.trim();
    saveAuthSession(auth.token, auth.username, displayName);
    setToken(auth.token);
    setMyUsername(auth.username);
    setMyDisplayName(displayName);
  };
  
  const [token, setToken] = useState<string | null>(localStorage.getItem('chat_token'));
  const [myUsername, setMyUsername] = useState<string | null>(localStorage.getItem('chat_username'));
  
  const [chatList, setChatList] = useState<string[]>([]);
  const [activeChat, setActiveChatState] = useState<string | null>(null);
  
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [activeGroup, setActiveGroup] = useState<GroupInfo | null>(null);
  const isChatOpen = Boolean(activeChat || activeGroup);

  const handleAddNewChat = (username: string) => {
    if (!chatList.includes(username)) {
      setChatList(prev => [username, ...prev]);
    }
    setActiveGroup(null);
    setActiveChatState(username);
  };

  const setActiveChat = (username: string) => {
    setActiveGroup(null);
    setActiveChatState(username);
  };

  const handleSelectGroup = (group: GroupInfo) => {
    setActiveChatState(null);
    setActiveGroup(group);
  };

  const handleCreateGroup = async (name: string) => {
    try {
      const newGroup = await createGroup(name);
      setGroups(prev => [newGroup, ...prev]);
      handleSelectGroup(newGroup);
    } catch (err: any) {
      alert('خطا در ساخت گروه: ' + err.message);
    }
  };

  useEffect(() => {
      if (!groupUpdateEvent) return;

      handleRefreshGroups();

      if (
        (groupUpdateEvent.type === "DELETED" || groupUpdateEvent.type === "REMOVED") &&
        activeGroup?.id === groupUpdateEvent.groupId
      ) {
        setActiveGroup(null);
      }
  }, [groupUpdateEvent]);

  useEffect(() => {
    if (!myUsername) return;

    const partners = new Set<string>();
    messages.forEach(m => {
        const partner = m.sender === myUsername ? m.recipient : m.sender;
        if (partner) partners.add(partner);
    });

    setChatList(prev => {
        const merged = new Set(prev);
        partners.forEach(p => merged.add(p));
        return Array.from(merged);
    });
  }, [messages, myUsername]);

  useEffect(() => {
    if (token) {
      connect(token);
    }
    return () => {
      disconnect();
    };
  }, [token]);

  useEffect(() => {
    if (!token) return;
    getMyProfile()
      .then(setMyProfile)
      .catch(err => console.error('خطا در دریافت پروفایل:', err));
  }, [token]);

  useEffect(() => {
    if (token) {
      handleRefreshGroups();
    }
  }, [token]);

  const handleProfileUpdated = (updated: UserProfile) => {
    setMyProfile(updated);
    const displayName = `${updated.firstName} ${updated.lastName}`.trim();
    setMyDisplayName(displayName);
    updateDisplayName(displayName);
  };

  const handleRefreshGroups = () => {
    getUserGroups()
      .then((updatedGroups) => {
        setGroups(updatedGroups);
        setActiveGroup(prev => {
          if (!prev) return prev;
          const match = updatedGroups.find(g => g.id === prev.id);
          return match || prev;
        });
      })
      .catch(err => console.error('خطا در دریافت گروه‌ها:', err));
  };

  const handleGroupUpdated = (updated: GroupInfo) => {
    setGroups(prev => prev.map(g => g.id === updated.id ? { ...g, ...updated } : g));
    setActiveGroup(prev => (prev && prev.id === updated.id ? { ...prev, ...updated } : prev));
  };

  const handleLogout = () => {
    localStorage.removeItem('chat_token');
    localStorage.removeItem('chat_username');
    localStorage.removeItem('chat_display_name');
    resetChatDBConnection();
    setToken(null);
    setMyUsername(null);
    setMyDisplayName(null);
    disconnect();
  };

  const handleDeleteGroup = async (groupId: number) => {
    const confirmed = window.confirm('آیا از حذف این گروه مطمئن هستید؟ این عملیات غیرقابل بازگشت است و تمام پیام‌های گروه هم حذف می‌شوند.');
    if (!confirmed) return;
    try {
      await deleteGroupApi(groupId);
      setGroups(prev => prev.filter(g => g.id !== groupId));
      if (activeGroup?.id === groupId) {
        setActiveGroup(null);
      }
    } catch (err: any) {
      alert('خطا در حذف گروه: ' + err.message);
    }
  };

  if (!token) {
    if (authView === 'login') {
      return (
        <Login
          onLoginSuccess={handleAuthSuccess}
          onSwitchToRegister={() => setAuthView('register')}
          onOtpRequested={(identifier) => {
            setPendingIdentifier(identifier);
            setAuthView('otp');
          }}
        />
      );
    }
    if (authView === 'register') {
      return (
        <Register
          onSwitchToLogin={() => setAuthView('login')}
          onRegistered={(identifier) => {
            setPendingIdentifier(identifier);
            setAuthView('otp');
          }}
        />
      );
    }
    return (
      <OtpVerify
        identifier={pendingIdentifier}
        onVerified={handleAuthSuccess}
        onBack={() => setAuthView('login')}
      />
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 font-sans relative overflow-hidden" dir="rtl">

      {!isConnected && (
        <div className="absolute top-0 left-0 right-0 bg-yellow-500 text-white text-center text-xs p-1 z-50 shadow-md">
          در حال اتصال به سرور...
        </div>
      )}

      {/* لیست چت‌ها: در موبایل فقط وقتی گفتگویی باز نیست دیده می‌شود */}
      <div className={`${isChatOpen ? 'hidden' : 'flex'} md:flex w-full md:w-1/3 h-full`}>
        <Sidebar
          activeChat={activeChat}
          setActiveChat={setActiveChat}
          chatList={chatList}
          onAddNewChat={handleAddNewChat}
          myUsername={myUsername}
          myDisplayName={myDisplayName}
          onLogout={handleLogout}
          groups={groups}
          activeGroupId={activeGroup?.id ?? null}
          onSelectGroup={handleSelectGroup}
          onCreateGroup={handleCreateGroup}
          myProfilePictureUrl={myProfile?.profilePictureUrl}
          onOpenProfile={() => setShowProfileModal(true)}
        />
      </div>

      {/* پنل گفتگو: در موبایل فقط وقتی چت/گروهی انتخاب شده دیده می‌شود */}
      <div className={`${isChatOpen ? 'flex' : 'hidden'} md:flex flex-1 w-full h-full`}>
        {activeChat ? (
          <ChatArea
            activeChat={activeChat}
            onCallClick={(callType: CallKind) => startCall(activeChat, callType)}
            onBack={() => setActiveChatState(null)}
          />
        ) : activeGroup ? (
          <GroupChatArea
            activeGroup={activeGroup}
            onBack={() => setActiveGroup(null)}
            onGroupUpdated={handleGroupUpdated}
            onGroupDeleted={handleDeleteGroup}
          />
        ) : (
          <div className="w-full flex flex-col items-center justify-center bg-[#efeae2]">
            <div className="bg-white/60 px-6 py-3 rounded-full text-gray-500 shadow-sm">
              برای شروع چت، یک مخاطب یا گروه را از لیست انتخاب کنید
            </div>
          </div>
        )}
      </div>

      {showProfileModal && myProfile && (
        <ProfileModal
          profile={myProfile}
          onClose={() => setShowProfileModal(false)}
          onUpdated={handleProfileUpdated}
        />
      )}
      
      <CallOverlay />
    </div>
  );
};

export default App;