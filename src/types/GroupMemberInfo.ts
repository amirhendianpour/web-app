export interface GroupMemberInfo {
    username: string;
    firstName: string;
    lastName: string;
    profilePictureUrl?: string;
    role: "ADMIN" | "MEMBER" | string;
}