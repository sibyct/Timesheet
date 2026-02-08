export interface IUser {
    user_id: number;
    employee_id: number;
    username: string;
    password_hash: string;
    role: string;
    is_active: boolean;
}