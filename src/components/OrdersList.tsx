import { useState } from 'react';

import type { Order, OrderStatus } from '../models/Order';
import { useOrders } from '../store/orders/OrdersContext';

export function OrdersList() {
    const { state, cancelOrder, clearOrders } = useOrders();
    const [openedOrderIds, setOpenedOrderIds] = useState<string[]>([]);

    const hasOrders = state.orders.length > 0;

    const toggleOrder = (orderId: Order['id']) => {
        setOpenedOrderIds((current) => {
            if (current.includes(orderId)) {
                return current.filter((id) => id !== orderId);
            }

            return [...current, orderId];
        });
    };

    return (
        <section className="orders">
            <div className="orders-header">
                <h2>Мои заказы</h2>

                {hasOrders && (
                    <button
                        className="orders-clear-btn"
                        type="button"
                        onClick={clearOrders}
                    >
                        Очистить историю
                    </button>
                )}
            </div>

            {!hasOrders ? (
                <p className="orders-empty">Заказов пока нет</p>
            ) : (
                <div className="orders-list">
                    {state.orders.map((order) => {
                        const isOpened = openedOrderIds.includes(order.id);

                        return (
                            <article className="order-card" key={order.id}>
                                <div className="order-main">
                                    <div>
                                        <div className="order-title">
                                            Заказ №{shortOrderId(order.id)}
                                        </div>

                                        <div className="order-date">
                                            {formatDate(order.createdAt)}
                                        </div>
                                    </div>

                                    <OrderStatusBadge status={order.status} />
                                </div>

                                <div className="order-summary">
                                    <span>{order.totalQuantity} шт.</span>
                                    <strong>{formatPrice(order.totalPrice)}</strong>
                                </div>

                                <div className="order-customer">
                                    <div>{order.customer.name}</div>
                                    <div>{order.customer.phone}</div>
                                    <div>{order.customer.address}</div>

                                    {order.customer.comment && (
                                        <div>Комментарий: {order.customer.comment}</div>
                                    )}
                                </div>

                                <div className="order-actions">
                                    <button
                                        type="button"
                                        onClick={() => toggleOrder(order.id)}
                                    >
                                        {isOpened ? 'Скрыть состав' : 'Показать состав'}
                                    </button>

                                    {order.status !== 'cancelled' && (
                                        <button
                                            type="button"
                                            onClick={() => cancelOrder(order.id)}
                                        >
                                            Отменить заказ
                                        </button>
                                    )}
                                </div>

                                {isOpened && (
                                    <div className="order-items">
                                        {order.items.map((item) => (
                                            <div
                                                className="order-item"
                                                key={item.product.id}
                                            >
                                                <span>{item.product.name}</span>
                                                <span>
                          {item.quantity} ×{' '}
                                                    {formatPrice(item.product.price)}
                        </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

function OrderStatusBadge({ status }: { status: OrderStatus }) {
    return (
        <span className={`order-status order-status-${status}`}>
      {getOrderStatusLabel(status)}
    </span>
    );
}

function getOrderStatusLabel(status: OrderStatus): string {
    switch (status) {
        case 'created':
            return 'Создан';

        case 'processing':
            return 'В обработке';

        case 'completed':
            return 'Выполнен';

        case 'cancelled':
            return 'Отменён';

        default:
            return status;
    }
}

function shortOrderId(orderId: string): string {
    return orderId.slice(0, 8);
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