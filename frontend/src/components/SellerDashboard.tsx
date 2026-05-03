import { useState } from 'react';

import type { Product } from '../models/Product';
import { ProductCreateForm } from './ProductCreateForm';
import { SellerProductsList } from './SellerProductsList';

export function SellerDashboard() {
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    return (
        <section className="seller-dashboard">
            <div className="seller-dashboard-title">
                <h1>Кабинет продавца</h1>
                <p>Создание и управление карточками товаров</p>
            </div>

            <div className="seller-layout">
                <ProductCreateForm
                    key={editingProduct?.id ?? 'create-product'}
                    productToEdit={editingProduct}
                    onCancelEdit={() => setEditingProduct(null)}
                    onSaved={() => setEditingProduct(null)}
                />
                <SellerProductsList onEditProduct={setEditingProduct} />
            </div>
        </section>
    );
}
