import type { CartItem } from './CartItem';

export type CustomerInfo = {
    name: string;
    phone: string;
    address: string;
    comment: string;
};

export type OrderStatus = 'created' | 'processing' | 'completed' | 'cancelled';

export type Order = {
    id: string;
    createdAt: string;
    customer: CustomerInfo;
    items: CartItem[];
    totalPrice: number;
    totalQuantity: number;
    status: OrderStatus;
};