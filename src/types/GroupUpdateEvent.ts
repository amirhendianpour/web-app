export interface GroupUpdateEvent {

    type: "ADDED" | "DELETED" | "IMAGE_UPDATED" | "NAME_UPDATED" | "ROLE_UPDATED" | "REMOVED" | "MEMBER_REMOVED";

    groupId: number;

    groupName?: string;

    role?: string;

    imageUrl?: string;

    targetUsername?: string;

}