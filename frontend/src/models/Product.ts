export type ProductStatus = 'pending_review' | 'approved' | 'rejected';
export type ProductTag = 'Без сахара' | 'Халяль' | 'Без лактозы' | 'Белковый' | 'Сливочный';
export type MeasurementUnit = 'г' | 'кг' | 'мл' | 'л' | 'шт';

export type Product = {
    id: string;
    name: string;
    tag?: ProductTag | null;
    weight?: string | null;
    price: number;
    oldPrice?: number | null;
    imageUrl?: string | null;
    expiryDays?: number | null;
    isVerified: boolean;
    isPublished: boolean;
    status: ProductStatus;
    sellerId: string;
    createdAt: string;
    updatedAt: string;
};
