import { useEffect, useState, type FormEvent } from 'react';

import type { CustomerInfo, Order } from '../models/Order';
import { useAuth } from '../store/auth/AuthContext';
import { useCart } from '../store/cart/CartContext';
import { useOrders } from '../store/orders/OrdersContext';
import { createId } from '../utils/createId';

const initialCustomerInfo: CustomerInfo = {
    name: '',
    phone: '',
    address: '',
    comment: '',
};

type CheckoutFormProps = {
    onNavigate: (path: string) => void;
};

export function CheckoutForm({ onNavigate }: CheckoutFormProps) {
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
    const { user } = useAuth();

    const isCartEmpty = cartState.items.length === 0;

    useEffect(() => {
        if (!user) {
            return;
        }

        setCustomerInfo((current) => ({
            ...current,
            name: current.name || user.full_name,
            phone: current.phone || user.phone,
            address: current.address || user.address,
        }));
    }, [user]);

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

            {!user && (
                <div className="checkout-auth-offer">
                    <div>
                        <strong>Есть аккаунт?</strong>
                        <p>
                            Войдите или зарегистрируйтесь, и данные доставки будут
                            подставляться автоматически.
                        </p>
                    </div>

                    <div className="checkout-auth-actions">
                        <button
                            className="nav-link-btn nav-link-btn-secondary"
                            type="button"
                            onClick={() => onNavigate('/login')}
                        >
                            Войти
                        </button>

                        <button
                            className="nav-link-btn"
                            type="button"
                            onClick={() => onNavigate('/register')}
                        >
                            Регистрация
                        </button>
                    </div>
                </div>
            )}

            {user && (!user.phone || !user.address) && (
                <div className="checkout-auth-offer">
                    <div>
                        <strong>Заполните профиль</strong>
                        <p>
                            Телефон и адрес можно сохранить в профиле, чтобы не
                            вводить их каждый раз.
                        </p>
                    </div>

                    <button
                        className="nav-link-btn nav-link-btn-secondary"
                        type="button"
                        onClick={() => onNavigate('/profile')}
                    >
                        Открыть профиль
                    </button>
                </div>
            )}

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
