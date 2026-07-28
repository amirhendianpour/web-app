import React, { useState, useRef, useEffect } from "react";
import Avatar from "./Avatar";
import { updateMyProfile, uploadMyAvatar } from "../services/profileService";
import type { UserProfile } from "../types/Profile";

interface Props {
    profile: UserProfile;
    onClose: () => void;
    onUpdated: (updated: UserProfile) => void;
}

const ProfileModal: React.FC<Props> = ({ profile, onClose, onUpdated }) => {
    const [mode, setMode] = useState<"view" | "edit">("view");
    const [firstName, setFirstName] = useState(profile.firstName);
    const [lastName, setLastName] = useState(profile.lastName);
    const [bio, setBio] = useState(profile.bio || "");
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [error, setError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setFirstName(profile.firstName);
        setLastName(profile.lastName);
        setBio(profile.bio || "");
    }, [profile]);

    const handleSave = async () => {
        setError("");
        if (!firstName.trim() || !lastName.trim()) {
            setError("نام و نام‌خانوادگی نمی‌تواند خالی باشد.");
            return;
        }
        setIsSaving(true);
        try {
            const updated = await updateMyProfile({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                bio: bio.trim()
            });
            onUpdated(updated);
            setMode("view");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAvatarClick = () => {
        if (mode === "edit") fileInputRef.current?.click();
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setError("");
        setIsUploadingAvatar(true);
        try {
            const updated = await uploadMyAvatar(file);
            onUpdated(updated);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsUploadingAvatar(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleCancelEdit = () => {
        setFirstName(profile.firstName);
        setLastName(profile.lastName);
        setBio(profile.bio || "");
        setError("");
        setMode("view");
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
                dir="rtl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="bg-blue-500 h-24 relative flex items-center justify-center">
                    <button
                        onClick={onClose}
                        className="absolute top-3 left-3 text-white/90 hover:text-white text-xl leading-none"
                        aria-label="بستن"
                    >
                        ✕
                    </button>

                    <div className="absolute -bottom-12">
                        <div onClick={handleAvatarClick} className={`relative ${mode === "edit" ? "cursor-pointer group" : ""}`}>
                            <Avatar
                                name={`${profile.firstName} ${profile.lastName}`}
                                imageUrl={profile.profilePictureUrl}
                                size={96}
                                className="border-4 border-white shadow-md"
                            />
                            {mode === "edit" && (
                                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs">
                                    {isUploadingAvatar ? "..." : "تغییر عکس"}
                                </div>
                            )}
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
                    </div>
                </div>

                <div className="pt-16 pb-6 px-6">
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-4 text-sm text-center">
                            {error}
                        </div>
                    )}

                    {mode === "view" ? (
                        <>
                            <h2 className="text-xl font-bold text-gray-800 text-center">
                                {profile.firstName} {profile.lastName}
                            </h2>
                            <p className="text-gray-500 text-sm text-center mt-1 whitespace-pre-wrap">
                                {profile.bio || "بدون بیو"}
                            </p>

                            <div className="mt-5 space-y-2 text-sm text-gray-600">
                                {profile.phoneNumber && (
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-gray-400">شماره موبایل</span>
                                        <span dir="ltr">{profile.phoneNumber}</span>
                                    </div>
                                )}
                                {profile.email && (
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-gray-400">ایمیل</span>
                                        <span dir="ltr">{profile.email}</span>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => setMode("edit")}
                                className="mt-6 w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg hover:bg-blue-700 transition"
                            >
                                ویرایش پروفایل
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <label className="block text-gray-700 text-sm font-bold mb-1">نام</label>
                                        <input
                                            type="text"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-gray-700 text-sm font-bold mb-1">نام‌خانوادگی</label>
                                        <input
                                            type="text"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-1">بیو</label>
                                    <textarea
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        rows={3}
                                        maxLength={150}
                                        placeholder="چند کلمه درباره خودتان بنویسید..."
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none"
                                    />
                                    <p className="text-xs text-gray-400 text-left mt-1">{bio.length}/150</p>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={handleCancelEdit}
                                    disabled={isSaving}
                                    className="flex-1 bg-gray-100 text-gray-700 font-bold py-2.5 rounded-lg hover:bg-gray-200 transition"
                                >
                                    انصراف
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex-1 bg-blue-600 text-white font-bold py-2.5 rounded-lg hover:bg-blue-700 transition disabled:bg-blue-300"
                                >
                                    {isSaving ? "در حال ذخیره..." : "ذخیره"}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;