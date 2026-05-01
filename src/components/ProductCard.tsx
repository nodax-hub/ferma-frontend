import type { Product } from '../models/Product';
import { useCart } from '../store/cart/CartContext';

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

    const quantity = getProductQuantity(product.id);

    return (
        <article className="card">
            <div className="card-image">
                <div className="badge">{product.discount}</div>
            </div>

            <div className="card-content">
                <div className="product-name">{product.name}</div>

                <div className="weight-tag">{product.tag}</div>

                <div className="price">
                    <div className="price-new">{formatPrice(product.price)}</div>
                    <div className="price-old">{formatPrice(product.oldPrice)}</div>
                </div>

                <div className="button-wrapper">
                    {quantity === 0 ? (
                        <button
                            className="add-btn"
                            type="button"
                            onClick={() => addProduct(product)}
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
                                onClick={() => increaseQuantity(product.id)}
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