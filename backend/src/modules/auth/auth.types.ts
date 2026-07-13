export interface RegisterInput {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
}

export interface LoginInput {
    email: string;
    password: string;
}

export type SelfAssignableRole = "CUSTOMER" | "RESTAURANT" | "RIDER";

export interface UpdateRoleInput {
    role: SelfAssignableRole;
}
