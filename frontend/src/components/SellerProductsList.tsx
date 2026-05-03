import { useProducts } from '../store/products/ProductsContext';
import type { Product } from '../models/Product';

const CURRENT_SELLER_ID = 'demo-seller';

type SellerProductsListProps = {
    onEditProduct: (product: Product) => void;
};

export function SellerProductsList({ onEditProduct }: SellerProductsListProps) {
    const { state, deleteProduct, clearProducts } = useProducts();

    const sellerProducts = state.products.filter(
        (product) => product.sellerId === CURRENT_SELLER_ID,
    );

    const hasProducts = sellerProducts.length > 0;

    return (
        <section className="seller-card">
            <div className="seller-products-header">
                <h2>Мои товары</h2>

                <button
                    className="seller-danger-btn"
                    type="button"
                    onClick={clearProducts}
                >
                    Сбросить товары
                </button>
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
                                    onClick={() => deleteProduct(product.id)}
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

function formatDate(value: string): string {
    return new Intl.DateTimeFormat('ru-RU', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
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
