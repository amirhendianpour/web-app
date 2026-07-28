export interface UserProfile {
    username: string;
    firstName: string;
    lastName: string;
    email?: string;
    phoneNumber?: string;
    bio?: string;
    profilePictureUrl?: string;
}

export interface ProfileUpdatePayload {
    firstName: string;
    lastName: string;
    bio: string;
}