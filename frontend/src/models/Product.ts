export type ProductStatus = 'pending_review' | 'approved' | 'rejected';

export type Product = {
    id: string;
    name: string;
    tag: string;
    discount: string;
    price: number;
    oldPrice?: number;
    imageUrl?: string;
    status: ProductStatus;
    sellerId: string;
    createdAt: string;
};
