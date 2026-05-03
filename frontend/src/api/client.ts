import type { Order } from '../models/Order';
import type { Product, ProductStatus } from '../models/Product';
import type { ProductBatch } from '../models/ProductBatch';

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

export async function fetchUsers(token: string): Promise<AuthUser[]> {
    return request<AuthUser[]>('/auth/users', {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

export async function fetchProducts(): Promise<Product[]> {
    return request<Product[]>('/products');
}

export async function createProductRequest(
    token: string,
    payload: Product,
): Promise<Product> {
    return request<Product>('/products', {
        method: 'POST',
        headers: getJsonAuthHeaders(token),
        body: JSON.stringify(payload),
    });
}

export async function updateProductRequest(
    token: string,
    productId: Product['id'],
    payload: Product,
): Promise<Product> {
    return request<Product>(`/products/${productId}`, {
        method: 'PATCH',
        headers: getJsonAuthHeaders(token),
        body: JSON.stringify(payload),
    });
}

export async function deleteProductRequest(
    token: string,
    productId: Product['id'],
): Promise<void> {
    return request<void>(`/products/${productId}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

export async function updateProductStatusRequest(
    token: string,
    productId: Product['id'],
    status: ProductStatus,
): Promise<Product> {
    return request<Product>(`/products/${productId}/status`, {
        method: 'PATCH',
        headers: getJsonAuthHeaders(token),
        body: JSON.stringify({ status }),
    });
}

export async function fetchProductBatches(): Promise<ProductBatch[]> {
    return request<ProductBatch[]>('/product-batches');
}

export async function createProductBatchRequest(
    token: string,
    payload: ProductBatch,
): Promise<ProductBatch> {
    return request<ProductBatch>('/product-batches', {
        method: 'POST',
        headers: getJsonAuthHeaders(token),
        body: JSON.stringify(payload),
    });
}

export async function deleteProductBatchRequest(
    token: string,
    batchId: ProductBatch['id'],
): Promise<void> {
    return request<void>(`/product-batches/${batchId}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

export async function decreaseProductQuantityRequest(
    productId: Product['id'],
    quantity: number,
): Promise<ProductBatch[]> {
    return request<ProductBatch[]>('/product-batches/decrease', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId, quantity }),
    });
}

export async function fetchOrders(): Promise<Order[]> {
    return request<Order[]>('/orders');
}

export async function createOrderRequest(payload: Order): Promise<Order> {
    return request<Order>('/orders', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
}

export async function cancelOrderRequest(orderId: Order['id']): Promise<Order> {
    return request<Order>(`/orders/${orderId}/cancel`, {
        method: 'PATCH',
    });
}

export async function clearOrdersRequest(): Promise<void> {
    return request<void>('/orders', {
        method: 'DELETE',
    });
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, init);

    if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const message = getApiErrorMessage(response.status, errorBody);

        throw new Error(message);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return response.json() as Promise<T>;
}

function getJsonAuthHeaders(token: string): HeadersInit {
    return {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
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
