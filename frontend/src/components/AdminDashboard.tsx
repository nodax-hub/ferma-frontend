import { useMemo, useState } from 'react';

import type { OrderStatus } from '../models/Order';
import type { Product, ProductStatus } from '../models/Product';
import { useOrders } from '../store/orders/OrdersContext';
import { useProducts } from '../store/products/ProductsContext';
import { formatDate } from '../utils/dateFormat';

type AdminSection =
    | 'review'
    | 'orders'
    | 'sellers'
    | 'buyers'
    | 'batches'
    | 'products';

type SellerStatus = 'active' | 'blocked' | 'checking';

type Seller = {
    id: string;
    name: string;
    status: SellerStatus;
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

const initialSellers: Seller[] = [
    {
        id: 'demo-seller',
        name: 'Демо-продавец',
        status: 'active',
    },
];

export function AdminDashboard() {
    const [activeSection, setActiveSection] = useState<AdminSection>('review');
    const [sellers, setSellers] = useState<Seller[]>(initialSellers);

    const { state: productsState, updateProductStatus } = useProducts();
    const { state: ordersState } = useOrders();

    const sellersWithProducts = useMemo(() => {
        const sellerMap = new Map(sellers.map((seller) => [seller.id, seller]));

        productsState.products.forEach((product) => {
            if (!sellerMap.has(product.sellerId)) {
                sellerMap.set(product.sellerId, {
                    id: product.sellerId,
                    name: product.sellerId,
                    status: 'checking',
                });
            }
        });

        return Array.from(sellerMap.values());
    }, [productsState.products, sellers]);

    const buyers = useMemo(() => {
        const buyerMap = new Map<
            string,
            {
                name: string;
                phone: string;
                orderCount: number;
            }
        >();

        ordersState.orders.forEach((order) => {
            const key = order.customer.phone || order.customer.name;
            const buyer = buyerMap.get(key);

            if (buyer) {
                buyer.orderCount += 1;
                return;
            }

            buyerMap.set(key, {
                name: order.customer.name,
                phone: order.customer.phone,
                orderCount: 1,
            });
        });

        return Array.from(buyerMap.values());
    }, [ordersState.orders]);

    const updateSellerStatus = (sellerId: string, status: SellerStatus) => {
        setSellers((current) => {
            const existingSeller = current.find((seller) => seller.id === sellerId);

            if (!existingSeller) {
                return [
                    ...current,
                    {
                        id: sellerId,
                        name: sellerId,
                        status,
                    },
                ];
            }

            return current.map((seller) =>
                seller.id === sellerId
                    ? {
                        ...seller,
                        status,
                    }
                    : seller,
            );
        });
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
                        sellers={sellersWithProducts}
                        updateSellerStatus={updateSellerStatus}
                    />
                )}

                {activeSection === 'buyers' && (
                    <BuyersAdminList buyers={buyers} />
                )}

                {activeSection === 'batches' && (
                    <BatchesAdminList products={productsState.products} />
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
                                        updateProductStatus(
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
    updateSellerStatus,
}: {
    sellers: Seller[];
    updateSellerStatus: (sellerId: string, status: SellerStatus) => void;
}) {
    return (
        <section className="admin-panel">
            <h2>Продавцы</h2>

            <div className="admin-list">
                {sellers.map((seller) => (
                    <article className="admin-list-item" key={seller.id}>
                        <div>
                            <h3>{seller.name}</h3>
                            <p>ID: {seller.id}</p>
                            <p>Статус: {getSellerStatusLabel(seller.status)}</p>
                        </div>

                        <select
                            value={seller.status}
                            onChange={(event) =>
                                updateSellerStatus(
                                    seller.id,
                                    event.target.value as SellerStatus,
                                )
                            }
                        >
                            <option value="active">Активен</option>
                            <option value="checking">На проверке</option>
                            <option value="blocked">Заблокирован</option>
                        </select>
                    </article>
                ))}
            </div>
        </section>
    );
}

function BuyersAdminList({
    buyers,
}: {
    buyers: Array<{
        name: string;
        phone: string;
        orderCount: number;
    }>;
}) {
    return (
        <section className="admin-panel">
            <h2>Покупатели</h2>

            {buyers.length === 0 ? (
                <p className="admin-empty">Покупателей пока нет</p>
            ) : (
                <div className="admin-list">
                    {buyers.map((buyer) => (
                        <article className="admin-list-item" key={buyer.phone}>
                            <div>
                                <h3>{buyer.name}</h3>
                                <p>{buyer.phone}</p>
                            </div>

                            <strong>{buyer.orderCount} заказ(ов)</strong>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}

function BatchesAdminList({ products }: { products: Product[] }) {
    return (
        <section className="admin-panel">
            <h2>Партии товара</h2>

            {products.length === 0 ? (
                <p className="admin-empty">Партий пока нет</p>
            ) : (
                <div className="admin-list">
                    {products.map((product) => (
                        <article className="admin-list-item" key={product.id}>
                            <div>
                                <h3>Партия {product.id.slice(0, 8)}</h3>
                                <p>{product.name}</p>
                                <p>Продавец: {product.sellerId}</p>
                                <p>Создана: {formatDate(product.createdAt)}</p>
                            </div>

                            <span className="admin-status">
                                {getProductStatusLabel(getProductStatus(product))}
                            </span>
                        </article>
                    ))}
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

function getSellerStatusLabel(status: SellerStatus): string {
    switch (status) {
        case 'active':
            return 'Активен';

        case 'checking':
            return 'На проверке';

        case 'blocked':
            return 'Заблокирован';

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
