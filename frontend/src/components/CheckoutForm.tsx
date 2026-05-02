import { useState, type FormEvent } from 'react';

import type { CustomerInfo, Order } from '../models/Order';
import { useCart } from '../store/cart/CartContext';
import { useOrders } from '../store/orders/OrdersContext';
import { createId } from '../utils/createId';

const initialCustomerInfo: CustomerInfo = {
    name: '',
    phone: '',
    address: '',
    comment: '',
};

export function CheckoutForm() {
    const [customerInfo, setCustomerInfo] = useState<CustomerInfo>(
        initialCustomerInfo,
    );

    const [error, setError] = useState<string>('');
    const [successMessage, setSuccessMessage] = useState<string>('');

    const {
        state: cartState,
        totalPrice,
        totalQuantity,
        clearCart,
    } = useCart();

    const { createOrder } = useOrders();

    const isCartEmpty = cartState.items.length === 0;

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setError('');
        setSuccessMessage('');

        if (isCartEmpty) {
            setError('Нельзя оформить заказ с пустой корзиной');
            return;
        }

        if (!customerInfo.name.trim()) {
            setError('Введите имя');
            return;
        }

        if (!customerInfo.phone.trim()) {
            setError('Введите телефон');
            return;
        }

        if (!customerInfo.address.trim()) {
            setError('Введите адрес доставки');
            return;
        }

        const newOrder: Order = {
            id: createId(),
            createdAt: new Date().toISOString(),
            customer: {
                name: customerInfo.name.trim(),
                phone: customerInfo.phone.trim(),
                address: customerInfo.address.trim(),
                comment: customerInfo.comment.trim(),
            },
            items: cartState.items.map((item) => ({
                product: item.product,
                quantity: item.quantity,
            })),
            totalPrice,
            totalQuantity,
            status: 'created',
        };

        createOrder(newOrder);
        clearCart();
        setCustomerInfo(initialCustomerInfo);
        setSuccessMessage('Заказ оформлен');
    };

    return (
        <section className="checkout" id="checkout">
            <h2>Оформление заказа</h2>

            <form className="checkout-form" onSubmit={handleSubmit}>
                <label className="form-field">
                    <span>Имя</span>
                    <input
                        type="text"
                        value={customerInfo.name}
                        onChange={(event) =>
                            setCustomerInfo((current) => ({
                                ...current,
                                name: event.target.value,
                            }))
                        }
                        placeholder="Иван"
                    />
                </label>

                <label className="form-field">
                    <span>Телефон</span>
                    <input
                        type="tel"
                        value={customerInfo.phone}
                        onChange={(event) =>
                            setCustomerInfo((current) => ({
                                ...current,
                                phone: event.target.value,
                            }))
                        }
                        placeholder="+7 999 123-45-67"
                    />
                </label>

                <label className="form-field">
                    <span>Адрес доставки</span>
                    <input
                        type="text"
                        value={customerInfo.address}
                        onChange={(event) =>
                            setCustomerInfo((current) => ({
                                ...current,
                                address: event.target.value,
                            }))
                        }
                        placeholder="Город, улица, дом, квартира"
                    />
                </label>

                <label className="form-field">
                    <span>Комментарий</span>
                    <textarea
                        value={customerInfo.comment}
                        onChange={(event) =>
                            setCustomerInfo((current) => ({
                                ...current,
                                comment: event.target.value,
                            }))
                        }
                        placeholder="Комментарий к заказу"
                        rows={3}
                    />
                </label>

                {error && <div className="form-error">{error}</div>}

                {successMessage && (
                    <div className="form-success">{successMessage}</div>
                )}

                <button
                    className="checkout-submit-btn"
                    type="submit"
                    disabled={isCartEmpty}
                >
                    Оформить заказ
                </button>
            </form>
        </section>
    );
}