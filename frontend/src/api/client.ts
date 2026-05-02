const API_BASE_URL = '/api';

export type UserRole = 'buyer' | 'seller' | 'admin';

export type AuthUser = {
    id: number;
    email: string;
    full_name: string;
    phone: string;
    address: string;
    role: UserRole;
    created_at: string;
};

export type RegisterPayload = {
    email: string;
    full_name: string;
    password: string;
    role: UserRole;
};

export type TokenResponse = {
    access_token: string;
    token_type: string;
};

export type UpdateProfilePayload = {
    full_name: string;
    phone: string;
    address: string;
};

export async function registerUser(payload: RegisterPayload): Promise<AuthUser> {
    return request<AuthUser>('/auth/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
}

export async function loginUser(
    email: string,
    password: string,
): Promise<TokenResponse> {
    const formData = new URLSearchParams();
    formData.set('username', email);
    formData.set('password', password);

    return request<TokenResponse>('/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
    });
}

export async function getCurrentUser(token: string): Promise<AuthUser> {
    return request<AuthUser>('/auth/me', {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

export async function updateCurrentUser(
    token: string,
    payload: UpdateProfilePayload,
): Promise<AuthUser> {
    return request<AuthUser>('/auth/me', {
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, init);

    if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const message = getApiErrorMessage(response.status, errorBody);

        throw new Error(message);
    }

    return response.json() as Promise<T>;
}

function getApiErrorMessage(status: number, errorBody: unknown): string {
    if (status === 401) {
        return 'Неверная почта или пароль';
    }

    if (status === 409) {
        return 'Пользователь с такой почтой уже зарегистрирован';
    }

    if (
        typeof errorBody === 'object' &&
        errorBody !== null &&
        'detail' in errorBody
    ) {
        const detail = (errorBody as { detail: unknown }).detail;

        if (Array.isArray(detail)) {
            return detail
                .map((item) => {
                    if (
                        typeof item === 'object' &&
                        item !== null &&
                        'msg' in item
                    ) {
                        return String((item as { msg: unknown }).msg);
                    }

                    return String(item);
                })
                .join('. ');
        }

        if (typeof detail === 'string') {
            return detail;
        }
    }

    return `Не удалось выполнить запрос. Код ошибки: ${status}`;
}
