import { API_URL as API } from '../config/apiConfig';
import type { GroupMemberInfo } from '../types/GroupMemberInfo';

function getAuthHeaders() {

    const token = localStorage.getItem("chat_token");

    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
    };

}

export interface GroupInfo {
    id: number;
    name: string;
    role?: string;
    imageUrl?: string;
}

export async function createGroup(name: string): Promise<GroupInfo> {

    const response = await fetch(`${API}/api/groups/create`, {

        method: "POST",

        headers: getAuthHeaders(),

        body: JSON.stringify({ groupName: name })

    });

    if (!response.ok) {
        throw new Error("خطا در ساخت گروه");
    }

    const data = await response.json();

    return { id: data.id, name: data.name, role: 'ADMIN', imageUrl: data.imageUrl };

}

export async function addMemberToGroup(groupId: number | string, username: string, role: string = "MEMBER") {

    const response = await fetch(`${API}/api/groups/${groupId}/add-member`, {

        method: "POST",

        headers: getAuthHeaders(),

        body: JSON.stringify({ username, role })

    });

    if (!response.ok) {
        const errMsg = await response.text();
        throw new Error(errMsg);
    }

    return await response.json();

}

export async function getGroupById(groupId: number): Promise<GroupInfo> {

    const response = await fetch(`${API}/api/groups/${groupId}`, {

        method: "GET",

        headers: getAuthHeaders()

    });

    if (!response.ok) {
        throw new Error("خطا در دریافت اطلاعات گروه");
    }

    const data = await response.json();

    return { 
        id: data.id, 
        name: data.name || `گروه #${data.id}`,
        imageUrl: data.imageUrl
    };

}

export async function getUserGroups(): Promise<GroupInfo[]> {
    const response = await fetch(`${API}/api/groups/my-groups`, {
        method: "GET",
        headers: getAuthHeaders()
    });
    if (!response.ok) {
        throw new Error("خطا در دریافت لیست گروه‌ها");
    }
    const memberships = await response.json();
    const groupDetails = await Promise.all(
        memberships.map(async (member: any) => {
            try {
                const group = await getGroupById(member.groupId);
                return { id: group.id, name: group.name, role: member.role, imageUrl: group.imageUrl };
            } catch {
                return { id: member.groupId, name: `گروه #${member.groupId}`, role: member.role };
            }
        })
    );
    return groupDetails;
}

export async function uploadGroupImage(groupId: number | string, file: File): Promise<GroupInfo> {
    const token = localStorage.getItem("chat_token");
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API}/api/groups/${groupId}/image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
    });

    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || errData || "خطا در آپلود عکس گروه");
    }

    const data = await response.json();
    return { id: data.id, name: data.name, imageUrl: data.imageUrl };
}

export async function updateGroupName(groupId: number | string, groupName: string): Promise<GroupInfo> {
    const response = await fetch(`${API}/api/groups/${groupId}/name`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ groupName })
    });
    if (!response.ok) {
        const errMsg = await response.text();
        throw new Error(errMsg || "خطا در تغییر نام گروه");
    }
    const data = await response.json();
    return { id: data.id, name: data.name, imageUrl: data.imageUrl };
}

export async function getGroupMembersInfo(groupId: number | string): Promise<GroupMemberInfo[]> {
    const response = await fetch(`${API}/api/groups/${groupId}/members/info`, {
        method: "GET",
        headers: getAuthHeaders()
    });
    if (!response.ok) {
        throw new Error("خطا در دریافت لیست اعضا");
    }
    return await response.json();
}

export async function updateMemberRole(groupId: number | string, username: string, role: "ADMIN" | "MEMBER"): Promise<void> {
    const response = await fetch(`${API}/api/groups/${groupId}/members/${encodeURIComponent(username)}/role`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ role })
    });
    if (!response.ok) {
        const errMsg = await response.text();
        throw new Error(errMsg || "خطا در تغییر نقش عضو");
    }
}

// جدید: حذف یک عضو از گروه — فقط ادمین مجاز است
export async function removeMemberFromGroup(groupId: number | string, username: string): Promise<void> {
    const response = await fetch(`${API}/api/groups/${groupId}/members/${encodeURIComponent(username)}`, {
        method: "DELETE",
        headers: getAuthHeaders()
    });
    if (!response.ok) {
        const errMsg = await response.text();
        throw new Error(errMsg || "خطا در حذف عضو از گروه");
    }
}

export async function deleteGroup(groupId: number): Promise<void> {
    const response = await fetch(`${API}/api/groups/${groupId}`, {
        method: "DELETE",
        headers: getAuthHeaders()
    });
    if (!response.ok) {
        const errMsg = await response.text();
        throw new Error(errMsg || "خطا در حذف گروه");
    }
}