import { useProducts } from '../store/products/ProductsContext';
import { useProductBatches } from '../store/productBatches/ProductBatchesContext';
import type { Product } from '../models/Product';
import { formatDate } from '../utils/dateFormat';
import { useAuth } from '../store/auth/AuthContext';

type SellerProductsListProps = {
    onEditProduct: (product: Product) => void;
};

export function SellerProductsList({ onEditProduct }: SellerProductsListProps) {
    const { user } = useAuth();
    const { state, deleteProduct } = useProducts();
    const { getProductQuantity } = useProductBatches();
    const sellerId = user ? String(user.id) : '';

    const sellerProducts = state.products.filter(
        (product) => product.sellerId === sellerId,
    );

    const hasProducts = sellerProducts.length > 0;

    return (
        <section className="seller-card">
            <div className="seller-products-header">
                <h2>Мои товары</h2>

            </div>

            {!hasProducts ? (
                <p className="seller-empty">У продавца пока нет товаров</p>
            ) : (
                <div className="seller-products-list">
                    {sellerProducts.map((product) => (
                        <article className="seller-product-item" key={product.id}>
                            <div>
                                <div className="seller-product-name">{product.name}</div>

                                <div className="seller-product-meta">
                                    {formatProductMeta(product)}
                                </div>

                                <div className="seller-product-meta">
                                    Создан: {formatDate(product.createdAt)}
                                </div>

                                <div className="seller-product-meta">
                                    Статус: {getProductStatusLabel(product.status)}
                                </div>

                                <div className="seller-product-meta">
                                    Остаток по партиям: {getProductQuantity(product.id)} шт.
                                </div>
                            </div>

                            <div className="seller-product-side">
                                <div className="seller-product-price">
                                    {formatPrice(product.price)}
                                </div>

                                <button
                                    className="seller-secondary-btn"
                                    type="button"
                                    onClick={() => onEditProduct(product)}
                                >
                                    Редактировать
                                </button>

                                <button
                                    className="seller-danger-btn"
                                    type="button"
                                    onClick={() => void deleteProduct(product.id)}
                                >
                                    Удалить
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}

function formatPrice(value: number): string {
    return `${value.toFixed(2).replace('.', ',')} ₽`;
}

function formatProductMeta(product: {
    weight?: string | null;
    tag?: string | null;
}): string {
    return [product.weight, product.tag].filter(Boolean).join(' • ') || 'Без метки';
}

function getProductStatusLabel(status = 'approved'): string {
    switch (status) {
        case 'pending_review':
            return 'На проверке';

        case 'approved':
            return 'Подтвержден';

        case 'rejected':
            return 'Отклонен';

        default:
            return status;
    }
}
