import { useState, type FormEvent } from 'react';

import type { CustomerInfo, Order } from '../models/Order';
import { useAuth } from '../store/auth/AuthContext';
import { useCart } from '../store/cart/CartContext';
import { useOrders } from '../store/orders/OrdersContext';
import { useProductBatches } from '../store/productBatches/ProductBatchesContext';
import { createId } from '../utils/createId';
import { getSelectedBuyerAddress, loadBuyerAddresses } from '../utils/buyerAddresses';

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
    const [selectedAddressId, setSelectedAddressId] = useState('');

    const [error, setError] = useState<string>('');
    const [successMessage, setSuccessMessage] = useState<string>('');

    const {
        state: cartState,
        totalPrice,
        totalQuantity,
        clearCart,
    } = useCart();

    const { createOrder } = useOrders();
    const { decreaseProductQuantity, getProductQuantity } = useProductBatches();
    const { user } = useAuth();
    const selectedAddress = getSelectedBuyerAddress();
    const savedAddresses = loadBuyerAddresses();
    const profileAddress = user?.address
        ? {
            id: 'profile-address',
            label: 'Основной адрес',
            value: user.address,
        }
        : null;
    const addressOptions = [
        ...savedAddresses.map((address) => ({
            id: address.id,
            label: address.isSelected
                ? `${address.label} · выбранный`
                : address.label,
            value: address.value,
        })),
        ...(profileAddress &&
        !savedAddresses.some((address) => address.value === profileAddress.value)
            ? [profileAddress]
            : []),
    ];
    const defaultAddressId =
        selectedAddressId ||
        selectedAddress?.id ||
        addressOptions[0]?.id ||
        'manual';
    const isManualAddress = defaultAddressId === 'manual';
    const selectedAddressOption = addressOptions.find(
        (address) => address.id === defaultAddressId,
    );
    const formCustomerInfo: CustomerInfo = {
        ...customerInfo,
        name: customerInfo.name || user?.full_name || '',
        phone: customerInfo.phone || user?.phone || '',
        address: isManualAddress
            ? customerInfo.address
            : selectedAddressOption?.value || '',
    };

    const isCartEmpty = cartState.items.length === 0;

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setError('');
        setSuccessMessage('');

        if (isCartEmpty) {
            setError('Нельзя оформить заказ с пустой корзиной');
            return;
        }

        if (!formCustomerInfo.name.trim()) {
            setError('Введите имя');
            return;
        }

        if (!formCustomerInfo.phone.trim()) {
            setError('Введите телефон');
            return;
        }

        if (!formCustomerInfo.address.trim()) {
            setError('Введите адрес доставки');
            return;
        }

        const unavailableItem = cartState.items.find(
            (item) => item.quantity > getProductQuantity(item.product.id),
        );

        if (unavailableItem) {
            setError(`Недостаточно товара: ${unavailableItem.product.name}`);
            return;
        }

        const newOrder: Order = {
            id: createId(),
            createdAt: new Date().toISOString(),
            customer: {
                name: formCustomerInfo.name.trim(),
                phone: formCustomerInfo.phone.trim(),
                address: formCustomerInfo.address.trim(),
                comment: formCustomerInfo.comment.trim(),
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
        cartState.items.forEach((item) => {
            decreaseProductQuantity(item.product.id, item.quantity);
        });
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
                        value={formCustomerInfo.name}
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
                        value={formCustomerInfo.phone}
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
                    <span>Выбор адреса</span>
                    <select
                        value={defaultAddressId}
                        onChange={(event) => {
                            const nextAddressId = event.target.value;
                            const nextAddress = addressOptions.find(
                                (address) => address.id === nextAddressId,
                            );

                            setSelectedAddressId(nextAddressId);
                            setCustomerInfo((current) => ({
                                ...current,
                                address: nextAddress?.value ?? '',
                            }));
                        }}
                    >
                        {addressOptions.map((address) => (
                            <option value={address.id} key={address.id}>
                                {address.label}
                            </option>
                        ))}

                        <option value="manual">Ввести адрес вручную</option>
                    </select>
                </label>

                <label className="form-field">
                    <span>Адрес доставки</span>
                    <input
                        type="text"
                        value={formCustomerInfo.address}
                        disabled={!isManualAddress}
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
