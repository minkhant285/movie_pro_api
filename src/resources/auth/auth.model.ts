export interface ILoginBody {
    phemail: string;
    password: string;
}

export interface IRegisterBody {
    username: string;
    phemail: string;
    password: string;
}

export interface ForgotPasswordRequestBody {
    phemail: string; // Can be either email or phone
}

export interface ResetPasswordRequestBody {
    token: string;
    newPassword: string;
}