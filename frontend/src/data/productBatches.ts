import type { ProductBatch } from '../models/ProductBatch';

const now = new Date().toISOString();

export const initialProductBatches: ProductBatch[] = [
    {
        id: 'batch-1',
        productId: 'product-1',
        sellerId: 'demo-seller',
        manufacturedAt: '2026-05-01',
        quantity: 24,
        initialQuantity: 24,
        createdAt: now,
        updatedAt: now,
    },
    {
        id: 'batch-2',
        productId: 'product-2',
        sellerId: 'demo-seller',
        manufacturedAt: '2026-05-02',
        quantity: 40,
        initialQuantity: 40,
        createdAt: now,
        updatedAt: now,
    },
    {
        id: 'batch-3',
        productId: 'product-3',
        sellerId: 'demo-seller',
        manufacturedAt: '2026-05-01',
        quantity: 18,
        initialQuantity: 18,
        createdAt: now,
        updatedAt: now,
    },
];
