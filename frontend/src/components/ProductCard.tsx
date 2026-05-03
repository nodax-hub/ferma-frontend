import type { Product } from '../models/Product';
import { useCart } from '../store/cart/CartContext';
import { useProductBatches } from '../store/productBatches/ProductBatchesContext';

type ProductCardProps = {
    product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
    const {
        addProduct,
        increaseQuantity,
        decreaseQuantity,
        getProductQuantity,
    } = useCart();
    const { getProductQuantity: getAvailableProductQuantity } =
        useProductBatches();

    const quantity = getProductQuantity(product.id);
    const availableQuantity = getAvailableProductQuantity(product.id);
    const canIncreaseQuantity = quantity < availableQuantity;
    const discount = calculateDiscount(product.price, product.oldPrice);
    const meta = formatProductMeta(product);

    return (
        <article className="card">
            <div className="card-image">
                {product.imageUrl && (
                    <img
                        className="product-image"
                        src={product.imageUrl}
                        alt={product.name}
                    />
                )}

                {discount && <div className="badge">{discount}</div>}
            </div>

            <div className="card-content">
                <div className="product-name">{product.name}</div>

                <div className="weight-tag">{meta}</div>

                <div className="price">
                    <div className="price-new">{formatPrice(product.price)}</div>

                    {product.oldPrice !== undefined && product.oldPrice !== null && (
                        <div className="price-old">
                            {formatPrice(product.oldPrice)}
                        </div>
                    )}
                </div>

                <div className="stock-info">В наличии: {availableQuantity} шт.</div>

                <div className="button-wrapper">
                    {quantity === 0 ? (
                        <button
                            className="add-btn"
                            type="button"
                            disabled={availableQuantity <= 0}
                            onClick={() => addProduct(product, availableQuantity)}
                        >
                            +
                        </button>
                    ) : (
                        <div className="counter">
                            <button
                                type="button"
                                onClick={() => decreaseQuantity(product.id)}
                            >
                                −
                            </button>

                            <span>{quantity}</span>

                            <button
                                type="button"
                                disabled={!canIncreaseQuantity}
                                onClick={() =>
                                    increaseQuantity(product.id, availableQuantity)
                                }
                            >
                                +
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </article>
    );
}

function formatPrice(value: number): string {
    return `${value.toFixed(2).replace('.', ',')} ₽`;
}

function calculateDiscount(price: number, oldPrice?: number | null): string {
    if (oldPrice === undefined || oldPrice === null || oldPrice <= price || oldPrice <= 0) {
        return '';
    }

    const discount = Math.min(
        100,
        Math.max(1, Math.round(((oldPrice - price) / oldPrice) * 100)),
    );

    return `−${discount}%`;
}

function formatProductMeta(product: Product): string {
    const parts = [product.weight, product.tag].filter(Boolean);

    return parts.join(' • ');
}
