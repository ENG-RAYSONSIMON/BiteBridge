export interface RegisterInput {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    role?: "CUSTOMER" | "RESTAURANT" | "RIDER" | "ADMIN";
}

export interface LoginInput {
    email: string;
    password: string;
}