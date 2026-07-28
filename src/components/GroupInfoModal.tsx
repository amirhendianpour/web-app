import React, { useEffect, useRef, useState } from "react";
import Avatar from "./Avatar";
import type { GroupInfo } from "../services/groupService";
import type { GroupMemberInfo } from "../types/GroupMemberInfo";
import {
    getGroupMembersInfo,
    updateGroupName,
    updateMemberRole,
    removeMemberFromGroup,
    addMemberToGroup,
    uploadGroupImage
} from "../services/groupService";
import { lookupUser } from "../services/userService";
import { useWebSocket } from "../context/WebSocketContext";

interface Props {
    group: GroupInfo;
    onClose: () => void;
    onGroupUpdated: (updated: GroupInfo) => void;
    onGroupDeleted: (groupId: number) => void;
}

const GroupInfoModal: React.FC<Props> = ({ group, onClose, onGroupUpdated, onGroupDeleted }) => {
    const { groupUpdateEvent } = useWebSocket();
    const myUsername = localStorage.getItem("chat_username") || "";
    const isAdmin = group.role === "ADMIN";

    const [members, setMembers] = useState<GroupMemberInfo[]>([]);
    const [isLoadingMembers, setIsLoadingMembers] = useState(true);
    const [error, setError] = useState("");

    const [isEditingName, setIsEditingName] = useState(false);
    const [nameInput, setNameInput] = useState(group.name);
    const [isSavingName, setIsSavingName] = useState(false);

    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const imageInputRef = useRef<HTMLInputElement>(null);

    const [showAddMember, setShowAddMember] = useState(false);
    const [newMemberInput, setNewMemberInput] = useState("");
    const [isAddingMember, setIsAddingMember] = useState(false);

    const [roleUpdatingUser, setRoleUpdatingUser] = useState<string | null>(null);
    const [removingUser, setRemovingUser] = useState<string | null>(null);

    const loadMembers = async () => {
        setIsLoadingMembers(true);
        try {
            const data = await getGroupMembersInfo(group.id);
            setMembers(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoadingMembers(false);
        }
    };

    useEffect(() => {
        loadMembers();
        setNameInput(group.name);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [group.id]);

    useEffect(() => {
        if (!groupUpdateEvent || groupUpdateEvent.groupId !== group.id) return;

        if (groupUpdateEvent.type === "ADDED" || groupUpdateEvent.type === "MEMBER_REMOVED") {
            loadMembers();
        }
        if (groupUpdateEvent.type === "NAME_UPDATED" || groupUpdateEvent.type === "IMAGE_UPDATED") {
            onGroupUpdated({
                ...group,
                name: groupUpdateEvent.groupName || group.name,
                imageUrl: groupUpdateEvent.imageUrl ?? group.imageUrl
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [groupUpdateEvent]);

    const handleImageClick = () => {
        if (!isAdmin || isUploadingImage) return;
        imageInputRef.current?.click();
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploadingImage(true);
        setError("");
        try {
            const updated = await uploadGroupImage(group.id, file);
            onGroupUpdated({ ...group, ...updated });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsUploadingImage(false);
            if (imageInputRef.current) imageInputRef.current.value = "";
        }
    };

    const handleSaveName = async () => {
        setError("");
        if (!nameInput.trim()) {
            setError("نام گروه نمی‌تواند خالی باشد.");
            return;
        }
        setIsSavingName(true);
        try {
            const updated = await updateGroupName(group.id, nameInput.trim());
            onGroupUpdated({ ...group, ...updated });
            setIsEditingName(false);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSavingName(false);
        }
    };

    const handleAddMember = async () => {
        if (!newMemberInput.trim()) return;
        setError("");
        setIsAddingMember(true);
        try {
            const user = await lookupUser(newMemberInput.trim());
            await addMemberToGroup(group.id, user.username);
            setNewMemberInput("");
            setShowAddMember(false);
            await loadMembers();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsAddingMember(false);
        }
    };

    const handleToggleAdmin = async (member: GroupMemberInfo) => {
        const newRole = member.role === "ADMIN" ? "MEMBER" : "ADMIN";
        setError("");
        setRoleUpdatingUser(member.username);
        try {
            await updateMemberRole(group.id, member.username, newRole);
            await loadMembers();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setRoleUpdatingUser(null);
        }
    };

    const handleRemoveMember = async (member: GroupMemberInfo) => {
        const confirmed = window.confirm(
            `آیا از حذف ${member.firstName} ${member.lastName} از گروه مطمئن هستید؟`
        );
        if (!confirmed) return;

        setError("");
        setRemovingUser(member.username);
        try {
            await removeMemberFromGroup(group.id, member.username);
            await loadMembers();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setRemovingUser(null);
        }
    };

    const handleDeleteGroup = () => {
        onGroupDeleted(group.id);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] overflow-y-auto"
                dir="rtl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* هدر سبز — آواتار به‌صورت absolute روی مرز سبز/سفید می‌نشیند */}
                <div className="bg-green-500 h-24 relative flex items-center justify-center">
                    <button
                        onClick={onClose}
                        className="absolute top-3 left-3 text-white/90 hover:text-white text-xl leading-none"
                        aria-label="بستن"
                    >
                        ✕
                    </button>

                    <div className="absolute -bottom-12">
                        <div onClick={handleImageClick} className={`relative ${isAdmin ? "cursor-pointer group" : ""}`}>
                            <Avatar
                                name={group.name}
                                imageUrl={group.imageUrl}
                                size={96}
                                colorSeed={`group-${group.id}`}
                                className="border-4 border-white shadow-md"
                            />
                            {isAdmin && (
                                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs">
                                    {isUploadingImage ? "..." : "تغییر عکس"}
                                </div>
                            )}
                        </div>
                        <input ref={imageInputRef} type="file" accept="image/*" hidden onChange={handleImageChange} />
                    </div>
                </div>

                {/* محتوای اصلی — با pt-16 از زیر آواتار فاصله می‌گیرد، بدون هیچ overlap روی متن */}
                <div className="pt-16 pb-6 px-6">

                    <div className="text-center">
                        {isEditingName ? (
                            <div className="flex gap-2 items-center justify-center">
                                <input
                                    value={nameInput}
                                    onChange={(e) => setNameInput(e.target.value)}
                                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none text-sm font-bold text-center"
                                    autoFocus
                                />
                                <button
                                    onClick={handleSaveName}
                                    disabled={isSavingName}
                                    className="text-green-600 font-bold text-sm px-2 whitespace-nowrap"
                                >
                                    {isSavingName ? "..." : "ذخیره"}
                                </button>
                                <button
                                    onClick={() => { setIsEditingName(false); setNameInput(group.name); }}
                                    className="text-gray-400 text-sm px-2 whitespace-nowrap"
                                >
                                    انصراف
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-2">
                                <h2 className="text-lg font-bold text-gray-800">{group.name}</h2>
                                {isAdmin && (
                                    <button
                                        onClick={() => setIsEditingName(true)}
                                        className="text-green-600 text-sm hover:underline"
                                    >
                                        ویرایش
                                    </button>
                                )}
                            </div>
                        )}
                        <p className="text-xs text-gray-400 mt-1">{members.length} عضو</p>
                    </div>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mt-4 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <div className="mt-5 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-500">اعضای گروه</h3>
                        {isAdmin && (
                            <button
                                onClick={() => setShowAddMember(prev => !prev)}
                                className="text-sm text-green-600 hover:text-green-800 font-semibold"
                            >
                                + افزودن عضو
                            </button>
                        )}
                    </div>

                    {showAddMember && isAdmin && (
                        <div className="mt-2 flex gap-2">
                            <input
                                value={newMemberInput}
                                onChange={(e) => setNewMemberInput(e.target.value)}
                                placeholder="شماره موبایل یا ایمیل عضو..."
                                className="flex-1 border rounded-lg p-2 text-sm"
                                dir="ltr"
                            />
                            <button
                                onClick={handleAddMember}
                                disabled={isAddingMember}
                                className="bg-green-500 text-white px-3 rounded-lg text-sm hover:bg-green-600 disabled:bg-green-300"
                            >
                                {isAddingMember ? "..." : "افزودن"}
                            </button>
                        </div>
                    )}

                    <div className="mt-3 space-y-1">
                        {isLoadingMembers ? (
                            <p className="text-center text-gray-400 text-sm py-4">در حال بارگذاری...</p>
                        ) : (
                            members.map((member) => (
                                <div key={member.username} className="flex items-center gap-3 py-2 border-b last:border-b-0">
                                    <Avatar
                                        name={`${member.firstName} ${member.lastName}`}
                                        imageUrl={member.profilePictureUrl}
                                        size={44}
                                        colorSeed={member.username}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-800 truncate">
                                            {member.firstName} {member.lastName}
                                            {member.username === myUsername && (
                                                <span className="text-gray-400 font-normal"> (شما)</span>
                                            )}
                                        </p>
                                        {member.role === "ADMIN" && (
                                            <p className="text-xs text-green-600">ادمین گروه</p>
                                        )}
                                    </div>

                                    {isAdmin && member.username !== myUsername && (
                                        <div className="flex flex-col items-end gap-1">
                                            <button
                                                onClick={() => handleToggleAdmin(member)}
                                                disabled={roleUpdatingUser === member.username}
                                                className="text-xs text-blue-600 hover:underline disabled:text-gray-400 whitespace-nowrap"
                                            >
                                                {roleUpdatingUser === member.username
                                                    ? "..."
                                                    : member.role === "ADMIN"
                                                        ? "حذف ادمین"
                                                        : "ارتقا به ادمین"}
                                            </button>
                                            <button
                                                onClick={() => handleRemoveMember(member)}
                                                disabled={removingUser === member.username}
                                                className="text-xs text-red-500 hover:underline disabled:text-gray-400 whitespace-nowrap"
                                            >
                                                {removingUser === member.username ? "..." : "حذف از گروه"}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {isAdmin && (
                        <button
                            onClick={handleDeleteGroup}
                            className="w-full mt-6 pt-4 border-t text-red-500 hover:text-red-700 text-sm font-semibold py-2 transition"
                        >
                            🗑️ حذف گروه
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GroupInfoModal;