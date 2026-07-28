import React, { useState, useEffect, useMemo } from 'react';
import { useUserDirectory } from '../context/UserDirectoryContext';
import { useWebSocket } from '../context/WebSocketContext';
import { lookupUser } from '../services/userService';
import Avatar from './Avatar';
import type { GroupInfo } from '../services/groupService';

interface SidebarProps {
  activeChat: string | null;
  setActiveChat: (chatName: string) => void;
  chatList: string[];
  onAddNewChat: (user: string) => void;
  myUsername: string | null;
  myDisplayName: string | null;
  onLogout: () => void;
  groups: GroupInfo[];
  activeGroupId: number | null;
  onSelectGroup: (group: GroupInfo) => void;
  onCreateGroup: (name: string) => void;
  myProfilePictureUrl?: string;
  onOpenProfile: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeChat,
  setActiveChat,
  chatList,
  onAddNewChat,
  myUsername,
  myDisplayName,
  onLogout,
  groups,
  activeGroupId,
  onSelectGroup,
  onCreateGroup,
  myProfilePictureUrl,
  onOpenProfile
}) => {
  const { getDisplayName, getProfilePicture, ensureLoaded, setUserInfo } = useUserDirectory();
  const [lookupError, setLookupError] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const { messages, groupMessages } = useWebSocket();

  useEffect(() => {
    if (chatList.length > 0) ensureLoaded(chatList);
  }, [chatList.join(','), ensureLoaded]);

  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError('');
    if (!newChatInput.trim()) return;

    setIsLookingUp(true);
    try {
      const user = await lookupUser(newChatInput.trim());
      setUserInfo(user);
      onAddNewChat(user.username);
      setNewChatInput('');
    } catch (err: any) {
      setLookupError(err.message);
    } finally {
      setIsLookingUp(false);
    }
  };

  // آخرین زمان پیام برای یک چت خصوصی خاص
  const getLastMessageTime = (chatUser: string): string => {
    let latest = '';
    messages.forEach(m => {
      if ((m.sender === chatUser || m.recipient === chatUser) && m.timestamp && m.timestamp > latest) {
        latest = m.timestamp;
      }
    });
    return latest;
  };

  // آخرین زمان پیام برای یک گروه خاص
  const getLastGroupMessageTime = (groupId: number): string => {
    let latest = '';
    groupMessages.forEach(m => {
      if (m.groupId === groupId && m.timestamp && m.timestamp > latest) {
        latest = m.timestamp;
      }
    });
    return latest;
  };

  type CombinedItem =
    | { type: 'chat'; key: string; user: string; time: string }
    | { type: 'group'; key: string; group: GroupInfo; time: string };

  // ترکیب چت‌های خصوصی و گروه‌ها + مرتب‌سازی نزولی بر اساس آخرین زمان پیام
  const combinedList: CombinedItem[] = useMemo(() => {
    const items: CombinedItem[] = [
      ...chatList.map((u): CombinedItem => ({
        type: 'chat', key: `chat-${u}`, user: u, time: getLastMessageTime(u)
      })),
      ...groups.map((g): CombinedItem => ({
        type: 'group', key: `group-${g.id}`, group: g, time: getLastGroupMessageTime(g.id)
      }))
    ];
    return items.sort((a, b) => b.time.localeCompare(a.time));
  }, [chatList, groups, messages, groupMessages]);

  const [newChatInput, setNewChatInput] = useState('');
  const [newGroupInput, setNewGroupInput] = useState('');
  const [tab, setTab] = useState<'all' | 'chats' | 'groups'>('all');

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGroupInput.trim()) {
      onCreateGroup(newGroupInput.trim());
      setNewGroupInput('');
    }
  };

  return (
    <div className="w-full bg-white border-l border-gray-200 flex flex-col h-full">
      <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
        <button onClick={onOpenProfile} className="flex items-center gap-2 group">
          <Avatar name={myDisplayName || "?"} imageUrl={myProfilePictureUrl} size={36} colorSeed={myUsername || undefined} />
          <h1 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition">پیام‌رسان من</h1>
        </button>
        <button
          onClick={onLogout}
          className="text-red-500 hover:text-red-700 text-sm bg-red-50 px-3 py-1 rounded-full transition"
        >
          خروج ({myDisplayName})
        </button>
      </div>

      {/* تب‌ها */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setTab('all')}
          className={`flex-1 py-2 text-sm font-semibold transition ${
            tab === 'all' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
          }`}
        >
          همه
        </button>
        <button
          onClick={() => setTab('chats')}
          className={`flex-1 py-2 text-sm font-semibold transition ${
            tab === 'chats' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
          }`}
        >
          چت‌های خصوصی
        </button>
        <button
          onClick={() => setTab('groups')}
          className={`flex-1 py-2 text-sm font-semibold transition ${
            tab === 'groups' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
          }`}
        >
          گروه‌ها
        </button>
      </div>

      {tab === 'all' ? (
        <div className="overflow-y-auto flex-1 p-2">
          {combinedList.length === 0 ? (
            <p className="text-center text-gray-400 text-sm mt-4">هنوز چت یا گروهی ندارید.</p>
          ) : (
            combinedList.map((item) =>
              item.type === 'chat' ? (
                <div
                  key={item.key}
                  onClick={() => setActiveChat(item.user)}
                  className={`p-3 mb-2 rounded-lg cursor-pointer flex items-center gap-3 transition-colors ${
                    activeChat === item.user ? 'bg-blue-50 border-r-4 border-blue-500' : 'hover:bg-gray-100'
                  }`}
                >
                  <Avatar
                    name={getDisplayName(item.user)}
                    imageUrl={getProfilePicture(item.user)}
                    size={48}
                    colorSeed={item.user}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{getDisplayName(item.user)}</h3>
                    <p className="text-xs text-green-500">آنلاین</p>
                  </div>
                </div>
              ) : (
                <div
                  key={item.key}
                  onClick={() => onSelectGroup(item.group)}
                  className={`p-3 mb-2 rounded-lg cursor-pointer flex items-center gap-3 transition-colors ${
                    activeGroupId === item.group.id ? 'bg-green-50 border-r-4 border-green-500' : 'hover:bg-gray-100'
                  }`} >
                  <Avatar
                    name={item.group.name || "؟"}
                    imageUrl={item.group.imageUrl}
                    size={48}
                    colorSeed={`group-${item.group.id}`}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{item.group.name || "گروه بدون‌نام"}</h3>
                    <p className="text-xs text-gray-400">گروه</p>
                  </div>
                </div>
              )
            )
          )}
        </div>
      ) : tab === 'chats' ? (
        <>
          <div className="p-3 border-b border-gray-200 bg-white">
            <form onSubmit={handleStartChat} className="flex gap-2">
              <input
                type="text"
                value={newChatInput}
                onChange={(e) => setNewChatInput(e.target.value)}
                placeholder="شماره موبایل یا ایمیل مخاطب..."
                className="flex-1 p-2 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500 text-sm"
                dir="ltr"
              />
              <button type="submit" disabled={isLookingUp} className="bg-blue-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-600 transition disabled:bg-blue-300">
                {isLookingUp ? '...' : '+ چت'}
              </button>
            </form>
            {lookupError && <p className="text-red-500 text-xs mt-2 text-center">{lookupError}</p>}
          </div>

          <div className="overflow-y-auto flex-1 p-2">
            {chatList.length === 0 ? (
              <p className="text-center text-gray-400 text-sm mt-4">هیچ چتی ندارید. یک نام کاربری وارد کنید!</p>
            ) : (
              chatList.map((chatUser, index) => (
                <div
                  key={index}
                  onClick={() => setActiveChat(chatUser)}
                  className={`p-3 mb-2 rounded-lg cursor-pointer flex items-center gap-3 transition-colors ${
                    activeChat === chatUser ? 'bg-blue-50 border-r-4 border-blue-500' : 'hover:bg-gray-100'
                  }`}
                >
                  <Avatar
                    name={getDisplayName(chatUser)}
                    imageUrl={getProfilePicture(chatUser)}
                    size={48}
                    colorSeed={chatUser}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{getDisplayName(chatUser)}</h3>
                    <p className="text-xs text-green-500">آنلاین</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <>
          <div className="p-3 border-b border-gray-200 bg-white">
            <form onSubmit={handleCreateGroup} className="flex gap-2">
              <input
                type="text"
                value={newGroupInput}
                onChange={(e) => setNewGroupInput(e.target.value)}
                placeholder="نام گروه جدید..."
                className="flex-1 p-2 rounded-lg border border-gray-300 focus:outline-none focus:border-green-500 text-sm"
              />
              <button type="submit" className="bg-green-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-600 transition">
                + گروه
              </button>
            </form>
          </div>

          <div className="overflow-y-auto flex-1 p-2">
            {groups.length === 0 ? (
              <p className="text-center text-gray-400 text-sm mt-4">هنوز گروهی نساخته‌اید.</p>
            ) : (
              groups.map((group) => (
                <div
                  key={group.id}
                  onClick={() => onSelectGroup(group)}
                  className={`p-3 mb-2 rounded-lg cursor-pointer flex items-center gap-3 transition-colors ${
                    activeGroupId === group.id ? 'bg-green-50 border-r-4 border-green-500' : 'hover:bg-gray-100'
                  }`}
                >
                  <Avatar
                    name={group.name || "؟"}
                    imageUrl={group.imageUrl}
                    size={48}
                    colorSeed={`group-${group.id}`}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{group.name || "گروه بدون‌نام"}</h3>
                    <p className="text-xs text-gray-400">{group.role === 'ADMIN' ? 'ادمین' : 'عضو'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

    </div>
  );
};

export default Sidebar;