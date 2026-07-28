export interface RegisterRequest {
    firstName: string;
    lastName: string;
    email?: string;
    phoneNumber?: string;
    password: string;
}

export interface AuthResponse {
    token: string;
    username: string;
    firstName: string;
    lastName: string;
    email?: string;
    phoneNumber?: string;
    bio?: string;
    profilePictureUrl?: string;
}