import { useCart } from '../store/cart/CartContext';
import { useProductBatches } from '../store/productBatches/ProductBatchesContext';

type CartProps = {
    onCheckout?: () => void;
    hideCheckoutButton?: boolean;
};

export function Cart({ onCheckout, hideCheckoutButton = false }: CartProps) {
    const {
        state,
        totalPrice,
        totalQuantity,
        increaseQuantity,
        decreaseQuantity,
        removeProduct,
        clearCart,
    } = useCart();
    const { getProductQuantity: getAvailableProductQuantity } =
        useProductBatches();

    const isEmpty = state.items.length === 0;

    return (
        <aside className="cart">
            <div className="cart-header">
                <h2>Корзина</h2>

                {totalQuantity > 0 && (
                    <span className="cart-count">{totalQuantity}</span>
                )}
            </div>

            {isEmpty ? (
                <p className="cart-empty">Корзина пока пустая</p>
            ) : (
                <>
                    <div className="cart-items">
                        {state.items.map((item) => {
                            const availableQuantity = getAvailableProductQuantity(
                                item.product.id,
                            );
                            const canIncreaseQuantity =
                                item.quantity < availableQuantity;

                            return (
                            <div className="cart-item" key={item.product.id}>
                                <div className="cart-item-info">
                                    <div className="cart-item-name">{item.product.name}</div>
                                    <div className="cart-item-price">
                                        {formatPrice(item.product.price)}
                                    </div>
                                    <div className="cart-item-stock">
                                        В наличии: {availableQuantity} шт.
                                    </div>
                                </div>

                                <div className="cart-item-controls">
                                    <button
                                        type="button"
                                        onClick={() => decreaseQuantity(item.product.id)}
                                    >
                                        −
                                    </button>

                                    <span>{item.quantity}</span>

                                    <button
                                        type="button"
                                        disabled={!canIncreaseQuantity}
                                        onClick={() =>
                                            increaseQuantity(
                                                item.product.id,
                                                availableQuantity,
                                            )
                                        }
                                    >
                                        +
                                    </button>
                                </div>

                                <button
                                    className="cart-remove-btn"
                                    type="button"
                                    onClick={() => removeProduct(item.product.id)}
                                >
                                    Удалить
                                </button>
                            </div>
                            );
                        })}
                    </div>

                    <div className="cart-footer">
                        <div className="cart-total">
                            <span>Итого:</span>
                            <strong>{formatPrice(totalPrice)}</strong>
                        </div>

                        <button
                            className="cart-clear-btn"
                            type="button"
                            onClick={clearCart}
                        >
                            Очистить корзину
                        </button>

                        {!hideCheckoutButton && (
                            <button
                                className="checkout-btn"
                                type="button"
                                onClick={onCheckout}
                            >
                                Оформить заказ
                            </button>
                        )}
                    </div>
                </>
            )}
        </aside>
    );
}

function formatPrice(value: number): string {
    return `${value.toFixed(2).replace('.', ',')} ₽`;
}
