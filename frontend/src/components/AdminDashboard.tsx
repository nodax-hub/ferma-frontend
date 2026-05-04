import { useEffect, useMemo, useState } from 'react';

import { deleteUserRequest, fetchUsers, type AuthUser } from '../api/client';
import type { OrderStatus } from '../models/Order';
import type { Product, ProductStatus } from '../models/Product';
import type { ProductBatch } from '../models/ProductBatch';
import { useAuth } from '../store/auth/AuthContext';
import { useOrders } from '../store/orders/OrdersContext';
import { useProductBatches } from '../store/productBatches/ProductBatchesContext';
import { useProducts } from '../store/products/ProductsContext';
import { formatDate } from '../utils/dateFormat';

type AdminSection =
    | 'review'
    | 'orders'
    | 'sellers'
    | 'buyers'
    | 'batches'
    | 'products';

type Seller = {
    id: number;
    name: string;
    email: string;
    productCount: number;
    pendingCount: number;
};

type Buyer = {
    id: number;
    name: string;
    phone: string;
    email: string;
    orderCount: number;
};

const adminSections: Array<{
    id: AdminSection;
    label: string;
}> = [
    {
        id: 'review',
        label: 'На проверке',
    },
    {
        id: 'orders',
        label: 'Заказы',
    },
    {
        id: 'sellers',
        label: 'Продавцы',
    },
    {
        id: 'buyers',
        label: 'Покупатели',
    },
    {
        id: 'batches',
        label: 'Партии',
    },
    {
        id: 'products',
        label: 'Товары',
    },
];

export function AdminDashboard() {
    const { token } = useAuth();
    const [activeSection, setActiveSection] = useState<AdminSection>('review');
    const [users, setUsers] = useState<AuthUser[]>([]);
    const [deletingUserId, setDeletingUserId] = useState<AuthUser['id'] | null>(null);
    const [userDeleteError, setUserDeleteError] = useState('');

    const { state: productsState, updateProductStatus } = useProducts();
    const { state: ordersState } = useOrders();
    const { state: batchesState } = useProductBatches();

    useEffect(() => {
        if (!token) {
            return;
        }

        let isActive = true;

        fetchUsers(token)
            .then((loadedUsers) => {
                if (isActive) {
                    setUsers(loadedUsers);
                }
            })
            .catch(() => {
                if (isActive) {
                    setUsers([]);
                }
            });

        return () => {
            isActive = false;
        };
    }, [token]);

    const adminUsers = useMemo(() => (token ? users : []), [token, users]);

    const sellers = useMemo(() => {
        const sellersById = new Map<string, Seller>();

        adminUsers
            .filter((user) => user.role === 'seller')
            .forEach((user) => {
                sellersById.set(String(user.id), {
                    id: user.id,
                    name: user.full_name,
                    email: user.email,
                    productCount: 0,
                    pendingCount: 0,
                });
            });

        productsState.products.forEach((product) => {
            const seller = sellersById.get(product.sellerId);

            if (seller) {
                seller.productCount += 1;

                if (getProductStatus(product) === 'pending_review') {
                    seller.pendingCount += 1;
                }

                return;
            }
        });

        return Array.from(sellersById.values());
    }, [adminUsers, productsState.products]);

    const buyers = useMemo(() => {
        const buyerMap = new Map<string, Buyer>();

        adminUsers
            .filter((user) => user.role === 'buyer')
            .forEach((user) => {
                buyerMap.set(user.phone || user.email || String(user.id), {
                    id: user.id,
                    name: user.full_name,
                    phone: user.phone,
                    email: user.email,
                    orderCount: 0,
                });
            });

        ordersState.orders.forEach((order) => {
            const key = order.customer.phone || order.customer.name;
            const buyer = buyerMap.get(key);

            if (buyer) {
                buyer.orderCount += 1;
            }
        });

        return Array.from(buyerMap.values());
    }, [adminUsers, ordersState.orders]);

    const handleDeleteUser = async (user: Pick<AuthUser, 'id' | 'full_name'>) => {
        if (!token || deletingUserId !== null) {
            return;
        }

        const shouldDelete = window.confirm(
            `Удалить пользователя "${user.full_name}"? Это действие нельзя отменить.`,
        );

        if (!shouldDelete) {
            return;
        }

        setUserDeleteError('');
        setDeletingUserId(user.id);

        try {
            await deleteUserRequest(token, user.id);
            setUsers((currentUsers) =>
                currentUsers.filter((currentUser) => currentUser.id !== user.id),
            );
        } catch (error) {
            setUserDeleteError(
                error instanceof Error
                    ? error.message
                    : 'Не удалось удалить пользователя',
            );
        } finally {
            setDeletingUserId(null);
        }
    };

    return (
        <section className="admin-dashboard">
            <nav className="admin-menu" aria-label="Разделы администратора">
                {adminSections.map((section) => (
                    <button
                        className={
                            activeSection === section.id
                                ? 'admin-menu-btn admin-menu-btn-active'
                                : 'admin-menu-btn'
                        }
                        type="button"
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                    >
                        {section.label}
                    </button>
                ))}
            </nav>

            <div className="admin-content">
                {activeSection === 'review' && (
                    <ProductsAdminList
                        title="Товары на проверке"
                        products={productsState.products.filter(
                            (product) => getProductStatus(product) === 'pending_review',
                        )}
                        emptyText="Товаров на проверке нет"
                        updateProductStatus={updateProductStatus}
                    />
                )}

                {activeSection === 'orders' && (
                    <OrdersAdminList orders={ordersState.orders} />
                )}

                {activeSection === 'sellers' && (
                    <SellersAdminList
                        sellers={sellers}
                        deletingUserId={deletingUserId}
                        error={userDeleteError}
                        onDeleteUser={handleDeleteUser}
                    />
                )}

                {activeSection === 'buyers' && (
                    <BuyersAdminList
                        buyers={buyers}
                        deletingUserId={deletingUserId}
                        error={userDeleteError}
                        onDeleteUser={handleDeleteUser}
                    />
                )}

                {activeSection === 'batches' && (
                    <BatchesAdminList
                        batches={batchesState.batches}
                        products={productsState.products}
                    />
                )}

                {activeSection === 'products' && (
                    <ProductsAdminList
                        title="Все товары"
                        products={productsState.products}
                        emptyText="Товаров пока нет"
                        updateProductStatus={updateProductStatus}
                    />
                )}
            </div>
        </section>
    );
}

type ProductsAdminListProps = {
    title: string;
    products: Product[];
    emptyText: string;
    updateProductStatus: (productId: Product['id'], status: ProductStatus) => void;
};

function ProductsAdminList({
    title,
    products,
    emptyText,
    updateProductStatus,
}: ProductsAdminListProps) {
    return (
        <section className="admin-panel">
            <h2>{title}</h2>

            {products.length === 0 ? (
                <p className="admin-empty">{emptyText}</p>
            ) : (
                <div className="admin-list">
                    {products.map((product) => (
                        <article className="admin-list-item" key={product.id}>
                            <div className="admin-item-main">
                                {product.imageUrl && (
                                    <img
                                        className="admin-product-image"
                                        src={product.imageUrl}
                                        alt={product.name}
                                    />
                                )}

                                <div>
                                    <h3>{product.name}</h3>
                                    <p>{formatProductMeta(product)}</p>
                                    <p>Продавец: {product.sellerId}</p>
                                    <p>Цена: {formatPrice(product.price)}</p>
                                </div>
                            </div>

                            <div className="admin-item-side">
                                <span className="admin-status">
                                    {getProductStatusLabel(getProductStatus(product))}
                                </span>

                                <select
                                    value={getProductStatus(product)}
                                    onChange={(event) =>
                                        void updateProductStatus(
                                            product.id,
                                            event.target.value as ProductStatus,
                                        )
                                    }
                                >
                                    <option value="pending_review">На проверке</option>
                                    <option value="approved">Подтвержден</option>
                                    <option value="rejected">Отклонен</option>
                                </select>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}

function OrdersAdminList({ orders }: { orders: ReturnType<typeof useOrders>['state']['orders'] }) {
    return (
        <section className="admin-panel">
            <h2>Все заказы</h2>

            {orders.length === 0 ? (
                <p className="admin-empty">Заказов пока нет</p>
            ) : (
                <div className="admin-list">
                    {orders.map((order) => (
                        <article className="admin-list-item" key={order.id}>
                            <div>
                                <h3>Заказ №{order.id.slice(0, 8)}</h3>
                                <p>{formatDate(order.createdAt)}</p>
                                <p>
                                    {order.customer.name}, {order.customer.phone}
                                </p>
                                <p>{order.customer.address}</p>
                                <p>{order.totalQuantity} шт.</p>
                            </div>

                            <div className="admin-item-side">
                                <span className="admin-status">
                                    {getOrderStatusLabel(order.status)}
                                </span>
                                <strong>{formatPrice(order.totalPrice)}</strong>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}

function SellersAdminList({
    sellers,
    deletingUserId,
    error,
    onDeleteUser,
}: {
    sellers: Seller[];
    deletingUserId: AuthUser['id'] | null;
    error: string;
    onDeleteUser: (user: Pick<AuthUser, 'id' | 'full_name'>) => void;
}) {
    return (
        <section className="admin-panel">
            <h2>Продавцы</h2>
            {error && <p className="form-error">{error}</p>}

            {sellers.length === 0 ? (
                <p className="admin-empty">Продавцов пока нет</p>
            ) : (
                <div className="admin-list">
                    {sellers.map((seller) => (
                        <article className="admin-list-item" key={seller.id}>
                            <div>
                                <h3>{seller.name}</h3>
                                <p>ID: {seller.id}</p>
                                {seller.email && <p>{seller.email}</p>}
                            </div>

                            <div className="admin-item-side">
                                <strong>{seller.productCount} товар(ов)</strong>
                                <span className="admin-status">
                                    {seller.pendingCount} на проверке
                                </span>
                                <button
                                    className="admin-danger-btn"
                                    type="button"
                                    disabled={deletingUserId !== null}
                                    onClick={() =>
                                        onDeleteUser({
                                            id: seller.id,
                                            full_name: seller.name,
                                        })
                                    }
                                >
                                    {deletingUserId === seller.id
                                        ? 'Удаление...'
                                        : 'Удалить'}
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}

function BuyersAdminList({
    buyers,
    deletingUserId,
    error,
    onDeleteUser,
}: {
    buyers: Buyer[];
    deletingUserId: AuthUser['id'] | null;
    error: string;
    onDeleteUser: (user: Pick<AuthUser, 'id' | 'full_name'>) => void;
}) {
    return (
        <section className="admin-panel">
            <h2>Покупатели</h2>
            {error && <p className="form-error">{error}</p>}

            {buyers.length === 0 ? (
                <p className="admin-empty">Покупателей пока нет</p>
            ) : (
                <div className="admin-list">
                    {buyers.map((buyer) => (
                        <article
                            className="admin-list-item"
                            key={buyer.id}
                        >
                            <div>
                                <h3>{buyer.name}</h3>
                                <p>ID: {buyer.id}</p>
                                {buyer.phone && <p>{buyer.phone}</p>}
                                {buyer.email && <p>{buyer.email}</p>}
                            </div>

                            <div className="admin-item-side">
                                <strong>{buyer.orderCount} заказ(ов)</strong>
                                <button
                                    className="admin-danger-btn"
                                    type="button"
                                    disabled={deletingUserId !== null}
                                    onClick={() =>
                                        onDeleteUser({
                                            id: buyer.id,
                                            full_name: buyer.name,
                                        })
                                    }
                                >
                                    {deletingUserId === buyer.id
                                        ? 'Удаление...'
                                        : 'Удалить'}
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}

function BatchesAdminList({
    batches,
    products,
}: {
    batches: ProductBatch[];
    products: Product[];
}) {
    return (
        <section className="admin-panel">
            <h2>Партии товара</h2>

            {batches.length === 0 ? (
                <p className="admin-empty">Партий пока нет</p>
            ) : (
                <div className="admin-list">
                    {batches.map((batch) => {
                        const product = products.find(
                            (item) => item.id === batch.productId,
                        );

                        return (
                            <article className="admin-list-item" key={batch.id}>
                                <div>
                                    <h3>Партия {batch.id.slice(0, 8)}</h3>
                                    <p>{product?.name ?? 'Товар удалён'}</p>
                                    <p>Продавец: {batch.sellerId}</p>
                                    <p>Изготовлено: {batch.manufacturedAt}</p>
                                    <p>
                                        Остаток: {batch.quantity} из{' '}
                                        {batch.initialQuantity} шт.
                                    </p>
                                </div>

                                <span className="admin-status">
                                    {product
                                        ? getProductStatusLabel(
                                            getProductStatus(product),
                                        )
                                        : 'Нет товара'}
                                </span>
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

function getProductStatus(product: Product): ProductStatus {
    return product.status ?? 'approved';
}

function getProductStatusLabel(status: ProductStatus): string {
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

function getOrderStatusLabel(status: OrderStatus): string {
    switch (status) {
        case 'created':
            return 'Создан';

        case 'processing':
            return 'В обработке';

        case 'completed':
            return 'Выполнен';

        case 'cancelled':
            return 'Отменен';

        default:
            return status;
    }
}

function formatPrice(value: number): string {
    return `${value.toFixed(2).replace('.', ',')} ₽`;
}

function formatProductMeta(product: Product): string {
    return [product.weight, product.tag].filter(Boolean).join(' • ') || 'Без метки';
}
