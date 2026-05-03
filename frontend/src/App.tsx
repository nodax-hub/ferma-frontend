import './App.css';

import {
    useEffect,
    useState,
    type ChangeEvent,
    type Dispatch,
    type FormEvent,
    type ReactNode,
    type SetStateAction,
} from 'react';

import { AdminDashboard } from './components/AdminDashboard';
import { Cart } from './components/Cart';
import { CheckoutForm } from './components/CheckoutForm';
import { OrdersList } from './components/OrdersList';
import { ProductCarousel } from './components/ProductCarousel';
import { SellerDashboard } from './components/SellerDashboard';
import type { Product } from './models/Product';
import type { ProductBatch } from './models/ProductBatch';
import type { AuthUser, RegisterPayload, UserRole } from './api/client';
import { AuthProvider, useAuth } from './store/auth/AuthContext';
import { CartProvider, useCart } from './store/cart/CartContext';
import { OrdersProvider, useOrders } from './store/orders/OrdersContext';
import {
    ProductBatchesProvider,
    useProductBatches,
} from './store/productBatches/ProductBatchesContext';
import { ProductsProvider, useProducts } from './store/products/ProductsContext';
import {
    loadBuyerAddresses,
    saveBuyerAddresses,
    type BuyerAddress,
} from './utils/buyerAddresses';
import {
    loadBuyerProfilePhoto,
    removeBuyerProfilePhoto,
    saveBuyerProfilePhoto,
} from './utils/buyerProfilePhoto';

function App() {
    return (
        <AuthProvider>
            <ProductsProvider>
                <ProductBatchesProvider>
                    <OrdersProvider>
                        <CartProvider>
                            <AppRoutes />
                        </CartProvider>
                    </OrdersProvider>
                </ProductBatchesProvider>
            </ProductsProvider>
        </AuthProvider>
    );
}

function AppRoutes() {
    const [path, setPath] = useState(window.location.pathname);

    useEffect(() => {
        const handlePopState = () => {
            setPath(window.location.pathname);
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, []);

    const navigate = (nextPath: string) => {
        window.history.pushState(null, '', nextPath);
        setPath(nextPath);
    };

    if (path.startsWith('/seller')) {
        return <SellerPage path={path} onNavigate={navigate} />;
    }

    if (path === '/checkout') {
        return <CheckoutPage onNavigate={navigate} />;
    }

    if (path === '/admin') {
        return <AdminPage onNavigate={navigate} />;
    }

    if (path === '/login') {
        return <AuthPage mode="login" onNavigate={navigate} />;
    }

    if (path === '/register') {
        return <AuthPage mode="register" onNavigate={navigate} />;
    }

    if (path === '/profile') {
        return <ProfilePage onNavigate={navigate} />;
    }

    if (path === '/orders') {
        return <BuyerOrdersPage onNavigate={navigate} />;
    }

    if (path === '/cart') {
        return <BuyerCartPage onNavigate={navigate} />;
    }

    if (path === '/addresses') {
        return <BuyerAddressesPage onNavigate={navigate} />;
    }

    return <ShopPage onNavigate={navigate} />;
}

type PageProps = {
    onNavigate: (path: string) => void;
};

function ShopPage({ onNavigate }: PageProps) {
    const { user } = useAuth();

    return (
        <main className="page">
            <header className="page-header buyer-header">
                <div className="brand-block">
                    <span className="brand-name">ферма</span>
                    <span className="brand-subtitle">фермерские продукты</span>
                </div>

                <div className="page-actions">
                    <button
                        className="icon-nav-btn"
                        type="button"
                        aria-label="Заказы"
                        title="Заказы"
                        onClick={() => onNavigate('/orders')}
                    >
                        <ClipboardIcon />
                    </button>

                    <button
                        className="icon-nav-btn"
                        type="button"
                        aria-label="Личный кабинет"
                        title="Личный кабинет"
                        onClick={() => onNavigate(user ? '/profile' : '/login')}
                    >
                        <UserBustIcon />
                    </button>
                </div>
            </header>

            <section className="shop-layout">
                <div className="products-section">
                    <ProductCarousel />
                </div>

                <Cart onCheckout={() => onNavigate('/checkout')} />
            </section>
        </main>
    );
}

function AdminPage({ onNavigate }: PageProps) {
    const { user, logout, isLoading } = useAuth();
    const canOpenAdmin = user?.role === 'admin';

    return (
        <main className="page">
            <header className="page-header">
                <div>
                    <h1>Администратор</h1>
                    <p>Вход и управление магазином</p>
                </div>

                <div className="page-actions">
                    {user && (
                        <>
                            <span className="user-chip">
                                {user.full_name} · {getRoleLabel(user.role)}
                            </span>

                            <button
                                className="nav-link-btn"
                                type="button"
                                onClick={logout}
                            >
                                Выйти
                            </button>
                        </>
                    )}

                    <button
                        className="nav-link-btn nav-link-btn-secondary"
                        type="button"
                        onClick={() => onNavigate('/')}
                    >
                        В магазин
                    </button>
                </div>
            </header>

            {isLoading ? (
                <section className="seller-auth">
                    <div className="seller-card seller-auth-card">
                        <h2>Проверяем сессию</h2>
                    </div>
                </section>
            ) : canOpenAdmin ? (
                <AdminDashboard />
            ) : user ? (
                <section className="seller-auth">
                    <div className="seller-card seller-auth-card">
                        <h2>Нет доступа</h2>
                        <p className="seller-auth-hint">
                            Для этой страницы нужен аккаунт администратора.
                        </p>
                    </div>
                </section>
            ) : (
                <AdminAuthPrompt onNavigate={onNavigate} />
            )}
        </main>
    );
}

function AdminAuthPrompt({ onNavigate }: PageProps) {
    return (
        <section className="seller-auth">
            <div className="seller-card seller-auth-card">
                <h2>Вход для администратора</h2>
                <p className="seller-auth-hint">
                    Войдите в аккаунт с ролью администратора, чтобы открыть панель.
                </p>

                <div className="auth-actions">
                    <button
                        className="seller-submit-btn"
                        type="button"
                        onClick={() => onNavigate('/login')}
                    >
                        Войти
                    </button>
                </div>
            </div>
        </section>
    );
}

function CheckoutPage({ onNavigate }: PageProps) {
    return (
        <main className="page">
            <header className="page-header">
                <div>
                    <h1>Оформление заказа</h1>
                    <p>Проверьте корзину и заполните данные доставки</p>
                </div>

                <button
                    className="nav-link-btn nav-link-btn-secondary"
                    type="button"
                    onClick={() => onNavigate('/')}
                >
                    В магазин
                </button>
            </header>

            <section className="checkout-layout">
                <CheckoutForm onNavigate={onNavigate} />
                <Cart onCheckout={() => undefined} hideCheckoutButton />
            </section>
        </main>
    );
}

type SellerPageProps = PageProps & {
    path: string;
};

function SellerPage({ onNavigate, path }: SellerPageProps) {
    const { user, logout, isLoading } = useAuth();
    const canManageProducts = user?.role === 'seller' || user?.role === 'admin';

    return (
        <main className="page seller-page">
            {isLoading ? (
                <section className="seller-auth">
                    <div className="seller-card seller-auth-card">
                        <h2>Проверяем сессию</h2>
                    </div>
                </section>
            ) : canManageProducts ? (
                <SellerWorkspace
                    path={path}
                    user={user}
                    logout={logout}
                    onNavigate={onNavigate}
                />
            ) : user ? (
                <>
                    <SellerPageHeader
                        title="Страница продавца"
                        subtitle="Авторизация и управление товарами"
                        onNavigate={onNavigate}
                    />

                    <section className="seller-auth">
                        <div className="seller-card seller-auth-card">
                            <h2>Нет доступа</h2>
                            <p className="seller-auth-hint">
                                Для этой страницы нужен аккаунт продавца.
                            </p>
                        </div>
                    </section>
                </>
            ) : (
                <>
                    <SellerPageHeader
                        title="Страница продавца"
                        subtitle="Авторизация и управление товарами"
                        onNavigate={onNavigate}
                    />
                    <SellerAuthPrompt onNavigate={onNavigate} />
                </>
            )}
        </main>
    );
}

type SellerWorkspaceProps = PageProps & {
    path: string;
    user: AuthUser;
    logout: () => void;
};

function SellerWorkspace({
    path,
    user,
    logout,
    onNavigate,
}: SellerWorkspaceProps) {
    switch (path) {
        case '/seller/profile':
            return (
                <SellerProfilePage
                    user={user}
                    logout={logout}
                    onNavigate={onNavigate}
                />
            );

        case '/seller/documents':
            return <SellerDocumentsPage user={user} onNavigate={onNavigate} />;

        case '/seller/orders':
            return (
                <SellerOrdersPage
                    mode="active"
                    user={user}
                    onNavigate={onNavigate}
                />
            );

        case '/seller/order-history':
            return (
                <SellerOrdersPage
                    mode="history"
                    user={user}
                    onNavigate={onNavigate}
                />
            );

        case '/seller/add-product':
            return <SellerAddProductPage user={user} onNavigate={onNavigate} />;

        case '/seller/add-batch':
            return <SellerBatchesPage user={user} onNavigate={onNavigate} />;

        case '/seller/checks':
            return <SellerChecksPage user={user} onNavigate={onNavigate} />;

        default:
            return <SellerHomePage user={user} onNavigate={onNavigate} />;
    }
}

function SellerHomePage({ user, onNavigate }: PageProps & { user: AuthUser }) {
    return (
        <>
            <header className="page-header buyer-header">
                <div className="brand-block">
                    <span className="brand-name">Ферма</span>
                    <span className="brand-subtitle">
                        кабинет продавца натуральных продуктов
                    </span>
                </div>

                <div className="page-actions">
                    <button
                        className="icon-nav-btn"
                        type="button"
                        aria-label="Заказы"
                        title="Заказы"
                        onClick={() => onNavigate('/seller/orders')}
                    >
                        <ClipboardIcon />
                    </button>

                    <button
                        className="icon-nav-btn"
                        type="button"
                        aria-label="Личный кабинет"
                        title="Личный кабинет"
                        onClick={() => onNavigate('/seller/profile')}
                    >
                        <UserBustIcon />
                    </button>
                </div>
            </header>

            <section className="seller-home-layout">
                <div className="seller-hero-panel">
                    <h1>Продажи фермерских продуктов</h1>
                    <p>
                        Управляйте товарами, партиями, проверками качества и
                        заказами на доставку.
                    </p>

                    <div className="seller-status-row">
                        <span className="seller-status-chip seller-status-checking">
                            {getSellerVerificationStatusLabel(user)}
                        </span>
                        <span>{formatBuyerLine(user.full_name, user.phone)}</span>
                    </div>
                </div>

                <div className="buyer-menu seller-home-menu">
                    <SellerMenuButton
                        title="Активные заказы"
                        description="Товары, которые нужно подготовить к доставке"
                        icon={<ClipboardIcon />}
                        onClick={() => onNavigate('/seller/orders')}
                    />
                    <SellerMenuButton
                        title="Добавить товар"
                        description="Карточка товара с фото и характеристиками"
                        icon={<PlusIcon />}
                        onClick={() => onNavigate('/seller/add-product')}
                    />
                    <SellerMenuButton
                        title="Добавить партию"
                        description="Дата изготовления и количество товара"
                        icon={<PackageIcon />}
                        onClick={() => onNavigate('/seller/add-batch')}
                    />
                    <SellerMenuButton
                        title="История проверок"
                        description="Ожидает, подтверждён, отклонён"
                        icon={<CheckCircleIcon />}
                        onClick={() => onNavigate('/seller/checks')}
                    />
                </div>
            </section>
        </>
    );
}

function SellerProfilePage({
    user,
    logout,
    onNavigate,
}: PageProps & {
    user: AuthUser;
    logout: () => void;
}) {
    return (
        <>
            <SellerPageHeader
                title="Личный кабинет продавца"
                subtitle={formatBuyerLine(user.full_name, user.phone)}
                onNavigate={onNavigate}
                backHome
            />

            <section className="buyer-profile-layout">
                <div className="buyer-profile-summary seller-profile-summary">
                    <div className="buyer-avatar">
                        <UserBustIcon />
                    </div>

                    <div>
                        <h2>{user.full_name}</h2>
                        <p>{user.phone || 'Телефон не указан'}</p>
                        <span className="seller-status-chip seller-status-checking">
                            {getSellerVerificationStatusLabel(user)}
                        </span>
                    </div>
                </div>

                <div className="buyer-menu">
                    <SellerMenuButton
                        title="Загрузить документы"
                        description="Заглушка для будущей проверки фермера"
                        icon={<FileIcon />}
                        onClick={() => onNavigate('/seller/documents')}
                    />
                    <SellerMenuButton
                        title="Активные заказы"
                        description="Партии и товары, требующие доставки"
                        icon={<ClipboardIcon />}
                        onClick={() => onNavigate('/seller/orders')}
                    />
                    <SellerMenuButton
                        title="История заказов"
                        description="Завершённые и отменённые заказы"
                        icon={<HistoryIcon />}
                        onClick={() => onNavigate('/seller/order-history')}
                    />
                    <SellerMenuButton
                        title="Добавить товар"
                        description="Форма товара и фото"
                        icon={<PlusIcon />}
                        onClick={() => onNavigate('/seller/add-product')}
                    />
                    <SellerMenuButton
                        title="Добавить партию"
                        description="Количество, дата изготовления, остаток"
                        icon={<PackageIcon />}
                        onClick={() => onNavigate('/seller/add-batch')}
                    />
                    <SellerMenuButton
                        title="История проверок"
                        description="Статусы проверки товаров"
                        icon={<CheckCircleIcon />}
                        onClick={() => onNavigate('/seller/checks')}
                    />

                    <button
                        className="nav-link-btn nav-link-btn-secondary"
                        type="button"
                        onClick={logout}
                    >
                        Выйти
                    </button>
                </div>
            </section>
        </>
    );
}

function SellerDocumentsPage({
    user,
    onNavigate,
}: PageProps & { user: AuthUser }) {
    return (
        <>
            <SellerPageHeader
                title="Документы продавца"
                subtitle={formatBuyerLine(user.full_name, user.phone)}
                onNavigate={onNavigate}
                backHome
            />

            <section className="buyer-content-narrow">
                <div className="buyer-page-panel seller-placeholder-panel">
                    <FileIcon />
                    <h2>Загрузка документов</h2>
                    <p>
                        Здесь будет загрузка документов фермерского хозяйства,
                        сертификатов и подтверждений качества. Сейчас это
                        подготовленная страница-заглушка.
                    </p>
                    <span className="seller-status-chip seller-status-checking">
                        Статус: в проверке
                    </span>
                </div>
            </section>
        </>
    );
}

function SellerAddProductPage({
    user,
    onNavigate,
}: PageProps & { user: AuthUser }) {
    return (
        <>
            <SellerPageHeader
                title="Добавить товар"
                subtitle={formatBuyerLine(user.full_name, user.phone)}
                onNavigate={onNavigate}
                backHome
            />

            <SellerDashboard />
        </>
    );
}

function SellerOrdersPage({
    mode,
    user,
    onNavigate,
}: PageProps & {
    mode: 'active' | 'history';
    user: AuthUser;
}) {
    const { state: ordersState } = useOrders();
    const { state: productsState } = useProducts();
    const sellerProducts = productsState.products.filter(
        (product) => product.sellerId === 'demo-seller',
    );
    const sellerProductIds = new Set(sellerProducts.map((product) => product.id));
    const matchingOrders = ordersState.orders.filter((order) => {
        const hasSellerItems = order.items.some((item) =>
            sellerProductIds.has(item.product.id),
        );
        const isActive =
            order.status === 'created' || order.status === 'processing';

        return hasSellerItems && (mode === 'active' ? isActive : !isActive);
    });

    return (
        <>
            <SellerPageHeader
                title={mode === 'active' ? 'Активные заказы' : 'История заказов'}
                subtitle={formatBuyerLine(user.full_name, user.phone)}
                onNavigate={onNavigate}
                backHome
            />

            <section className="buyer-content-narrow">
                <div className="buyer-page-panel">
                    {matchingOrders.length === 0 ? (
                        <p className="seller-empty">
                            {mode === 'active'
                                ? 'Активных заказов нет'
                                : 'История заказов пока пустая'}
                        </p>
                    ) : (
                        <div className="seller-order-list">
                            {matchingOrders.map((order) => {
                                const sellerItems = order.items.filter((item) =>
                                    sellerProductIds.has(item.product.id),
                                );

                                return (
                                    <article
                                        className="seller-order-card"
                                        key={order.id}
                                    >
                                        <div className="order-main">
                                            <div>
                                                <h3>Заказ №{order.id.slice(0, 8)}</h3>
                                                <p>{formatDate(order.createdAt)}</p>
                                                <p>
                                                    {order.customer.name},{' '}
                                                    {order.customer.phone}
                                                </p>
                                            </div>

                                            <span className="admin-status">
                                                {mode === 'active'
                                                    ? 'Требует доставки'
                                                    : getOrderStatusLabel(order.status)}
                                            </span>
                                        </div>

                                        <div className="order-items">
                                            {sellerItems.map((item) => (
                                                <div
                                                    className="order-item"
                                                    key={item.product.id}
                                                >
                                                    <span>{item.product.name}</span>
                                                    <strong>{item.quantity} шт.</strong>
                                                </div>
                                            ))}
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}

function SellerBatchesPage({
    user,
    onNavigate,
}: PageProps & { user: AuthUser }) {
    const { state: productsState } = useProducts();
    const {
        state: batchesState,
        createBatch,
        deleteBatch,
        getProductQuantity,
    } = useProductBatches();
    const sellerProducts = productsState.products.filter(
        (product) => product.sellerId === 'demo-seller',
    );
    const [productId, setProductId] = useState(sellerProducts[0]?.id ?? '');
    const [manufacturedAt, setManufacturedAt] = useState('');
    const [quantity, setQuantity] = useState('');
    const [error, setError] = useState('');

    const sellerBatches = batchesState.batches.filter(
        (batch) => batch.sellerId === 'demo-seller',
    );

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const parsedQuantity = Number(quantity);

        setError('');

        if (!productId) {
            setError('Выберите товар');
            return;
        }

        if (!manufacturedAt) {
            setError('Укажите дату изготовления');
            return;
        }

        if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
            setError('Количество в партии обязательно и должно быть больше 0');
            return;
        }

        const now = new Date().toISOString();

        createBatch({
            id: crypto.randomUUID(),
            productId,
            sellerId: 'demo-seller',
            manufacturedAt,
            quantity: parsedQuantity,
            initialQuantity: parsedQuantity,
            createdAt: now,
            updatedAt: now,
        });

        setManufacturedAt('');
        setQuantity('');
    };

    return (
        <>
            <SellerPageHeader
                title="Добавить партию"
                subtitle={formatBuyerLine(user.full_name, user.phone)}
                onNavigate={onNavigate}
                backHome
            />

            <section className="seller-batches-layout">
                <div className="buyer-page-panel">
                    <h2>Остатки по товарам</h2>
                    <div className="seller-stock-list">
                        {sellerProducts.map((product) => (
                            <div className="seller-stock-row" key={product.id}>
                                <span>{product.name}</span>
                                <strong>{getProductQuantity(product.id)} шт.</strong>
                            </div>
                        ))}
                    </div>
                </div>

                <form className="buyer-page-panel seller-form" onSubmit={handleSubmit}>
                    <h2>Новая партия</h2>

                    <label className="form-field">
                        <span>Товар</span>
                        <select
                            value={productId}
                            onChange={(event) => setProductId(event.target.value)}
                        >
                            {sellerProducts.map((product) => (
                                <option value={product.id} key={product.id}>
                                    {product.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="form-field">
                        <span>Дата изготовления</span>
                        <input
                            type="date"
                            value={manufacturedAt}
                            onChange={(event) =>
                                setManufacturedAt(event.target.value)
                            }
                        />
                    </label>

                    <label className="form-field">
                        <span>Количество, шт.</span>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={quantity}
                            onChange={(event) => setQuantity(event.target.value)}
                            placeholder="Например: 30"
                        />
                    </label>

                    {error && <div className="form-error">{error}</div>}

                    <button className="seller-submit-btn" type="submit">
                        Добавить партию
                    </button>
                </form>

                <div className="buyer-page-panel seller-batches-panel">
                    <h2>Партии</h2>

                    {sellerBatches.length === 0 ? (
                        <p className="seller-empty">Партий пока нет</p>
                    ) : (
                        <div className="seller-products-list">
                            {sellerBatches.map((batch) => {
                                const product = sellerProducts.find(
                                    (item) => item.id === batch.productId,
                                );

                                return (
                                    <article
                                        className="seller-product-item"
                                        key={batch.id}
                                    >
                                        <div>
                                            <div className="seller-product-name">
                                                {product?.name ?? 'Товар удалён'}
                                            </div>
                                            <div className="seller-product-meta">
                                                Изготовлено:{' '}
                                                {formatDateOnly(batch.manufacturedAt)}
                                            </div>
                                            <div className="seller-product-meta">
                                                Годен до:{' '}
                                                {formatExpiryDate(
                                                    batch,
                                                    product ?? null,
                                                )}
                                            </div>
                                            <div className="seller-product-meta">
                                                Остаток: {batch.quantity} из{' '}
                                                {batch.initialQuantity} шт.
                                            </div>
                                        </div>

                                        <button
                                            className="seller-danger-btn"
                                            type="button"
                                            onClick={() => deleteBatch(batch.id)}
                                        >
                                            Удалить
                                        </button>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}

function SellerChecksPage({
    user,
    onNavigate,
}: PageProps & { user: AuthUser }) {
    const { state } = useProducts();
    const sellerProducts = state.products.filter(
        (product) => product.sellerId === 'demo-seller',
    );

    return (
        <>
            <SellerPageHeader
                title="История проверок"
                subtitle={formatBuyerLine(user.full_name, user.phone)}
                onNavigate={onNavigate}
                backHome
            />

            <section className="buyer-content-narrow">
                <div className="buyer-page-panel">
                    {sellerProducts.length === 0 ? (
                        <p className="seller-empty">Товаров пока нет</p>
                    ) : (
                        <div className="admin-list">
                            {sellerProducts.map((product) => (
                                <article
                                    className="admin-list-item"
                                    key={product.id}
                                >
                                    <div>
                                        <h3>{product.name}</h3>
                                        <p>{formatProductMeta(product)}</p>
                                        <p>
                                            Обновлено:{' '}
                                            {formatDate(product.updatedAt)}
                                        </p>
                                    </div>

                                    <span className="admin-status">
                                        {getProductStatusLabel(product.status)}
                                    </span>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}

function SellerPageHeader({
    title,
    subtitle,
    onNavigate,
    backHome = false,
}: PageProps & {
    title: string;
    subtitle: string;
    backHome?: boolean;
}) {
    return (
        <header className="page-header buyer-header">
            <div>
                <h1>{title}</h1>
                <p>{subtitle}</p>
            </div>

            <div className="page-actions">
                {backHome && (
                    <button
                        className="nav-link-btn nav-link-btn-secondary"
                        type="button"
                        onClick={() => onNavigate('/seller')}
                    >
                        <HomeIcon />
                        Главная
                    </button>
                )}

                <button
                    className="nav-link-btn nav-link-btn-secondary"
                    type="button"
                    onClick={() => onNavigate('/')}
                >
                    В магазин
                </button>
            </div>
        </header>
    );
}

function SellerMenuButton({
    title,
    description,
    icon,
    onClick,
}: {
    title: string;
    description: string;
    icon: ReactNode;
    onClick: () => void;
}) {
    return (
        <button className="buyer-menu-item" type="button" onClick={onClick}>
            <span className="buyer-menu-icon">{icon}</span>
            <span>
                <strong>{title}</strong>
                <small>{description}</small>
            </span>
        </button>
    );
}

function SellerAuthPrompt({ onNavigate }: PageProps) {
    return (
        <section className="seller-auth">
            <div className="seller-card seller-auth-card">
                <h2>Вход для продавца</h2>
                <p className="seller-auth-hint">
                    Войдите в аккаунт продавца или зарегистрируйтесь как продавец.
                </p>

                <div className="auth-actions">
                    <button
                        className="seller-submit-btn"
                        type="button"
                        onClick={() => onNavigate('/login')}
                    >
                        Войти
                    </button>

                    <button
                        className="nav-link-btn nav-link-btn-secondary"
                        type="button"
                        onClick={() => onNavigate('/register')}
                    >
                        Зарегистрироваться
                    </button>
                </div>
            </div>
        </section>
    );
}

function ProfilePage({ onNavigate }: PageProps) {
    const { user, logout, isLoading } = useAuth();

    return (
        <main className="page">
            <header className="page-header buyer-header">
                <div>
                    <h1>Личный кабинет</h1>
                    {user && <p>{formatBuyerLine(user.full_name, user.phone)}</p>}
                </div>

                <div className="page-actions">
                    {user && (
                        <button
                            className="nav-link-btn nav-link-btn-secondary"
                            type="button"
                            onClick={logout}
                        >
                            Выйти
                        </button>
                    )}

                    <button
                        className="nav-link-btn nav-link-btn-secondary"
                        type="button"
                        onClick={() => onNavigate('/')}
                    >
                        <HomeIcon />
                        На главную
                    </button>
                </div>
            </header>

            {isLoading ? (
                <BuyerCenteredPanel title="Загружаем профиль" />
            ) : !user ? (
                <BuyerAuthPrompt onNavigate={onNavigate} />
            ) : (
                <section className="buyer-profile-layout">
                    <BuyerProfileSummary user={user} />

                    <div className="buyer-menu">
                        <BuyerMenuButton
                            title="История заказов"
                            description="Активные, отменённые и завершённые заказы"
                            onClick={() => onNavigate('/orders')}
                            icon={<ClipboardIcon />}
                        />

                        <BuyerMenuButton
                            title="Корзина"
                            description="Выбранные товары и оформление заказа"
                            onClick={() => onNavigate('/cart')}
                            icon={<CartIcon />}
                        />

                        <BuyerMenuButton
                            title="Мои адреса"
                            description="Адрес для быстрого выбора при доставке"
                            onClick={() => onNavigate('/addresses')}
                            icon={<PinIcon />}
                        />
                    </div>
                </section>
            )}
        </main>
    );
}

function BuyerOrdersPage({ onNavigate }: PageProps) {
    const { user, isLoading } = useAuth();

    return (
        <main className="page">
            <BuyerPageHeader
                title="История заказов"
                userLine={user ? formatBuyerLine(user.full_name, user.phone) : ''}
                onNavigate={onNavigate}
                backToProfile
            />

            {isLoading ? (
                <BuyerCenteredPanel title="Загружаем заказы" />
            ) : !user ? (
                <BuyerAuthPrompt onNavigate={onNavigate} />
            ) : (
                <section className="buyer-content-narrow">
                    <OrdersList />
                </section>
            )}
        </main>
    );
}

function BuyerProfileSummary({ user }: { user: AuthUser }) {
    const { updateProfile } = useAuth();
    const [phoneDraft, setPhoneDraft] = useState(user.phone);
    const [photoUrl, setPhotoUrl] = useState(() => loadBuyerProfilePhoto(user.id));
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handlePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        setError('');
        setSuccessMessage('');

        if (!file) {
            return;
        }

        if (!file.type.startsWith('image/')) {
            setError('Выберите изображение');
            return;
        }

        try {
            const nextPhotoUrl = await cropProfilePhoto(file);
            saveBuyerProfilePhoto(user.id, nextPhotoUrl);
            setPhotoUrl(nextPhotoUrl);
            setSuccessMessage('Фото обновлено');
        } catch {
            setError('Не удалось загрузить фото');
        } finally {
            event.target.value = '';
        }
    };

    const handleRemovePhoto = () => {
        removeBuyerProfilePhoto(user.id);
        setPhotoUrl('');
        setError('');
        setSuccessMessage('Фото удалено');
    };

    const handlePhoneSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const nextPhone = phoneDraft.trim();

        setError('');
        setSuccessMessage('');

        if (nextPhone.length < 5) {
            setError('Введите корректный номер телефона');
            return;
        }

        setIsSubmitting(true);

        try {
            await updateProfile({
                full_name: user.full_name,
                phone: nextPhone,
                address: user.address,
            });
            setSuccessMessage('Телефон сохранён');
        } catch (caughtError) {
            setError(
                caughtError instanceof Error
                    ? caughtError.message
                    : 'Не удалось сохранить телефон',
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="buyer-profile-summary buyer-profile-summary-editable">
            <div className="buyer-photo-block">
                <div className="buyer-avatar buyer-avatar-large">
                    {photoUrl ? (
                        <img src={photoUrl} alt={user.full_name} />
                    ) : (
                        <UserBustIcon />
                    )}
                </div>

                <div className="buyer-photo-actions">
                    <label className="buyer-photo-btn">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoChange}
                        />
                        Заменить фото
                    </label>

                    {photoUrl && (
                        <button
                            className="seller-danger-btn"
                            type="button"
                            onClick={handleRemovePhoto}
                        >
                            Удалить
                        </button>
                    )}
                </div>
            </div>

            <div className="buyer-profile-main">
                <h2>{user.full_name}</h2>
                <p>{user.phone || 'Телефон не указан'}</p>

                <form className="buyer-phone-form" onSubmit={handlePhoneSubmit}>
                    <label className="form-field">
                        <span>Телефон</span>
                        <input
                            type="tel"
                            value={phoneDraft}
                            onChange={(event) => setPhoneDraft(event.target.value)}
                            placeholder="+7 999 123-45-67"
                        />
                    </label>

                    {error && <div className="form-error">{error}</div>}
                    {successMessage && (
                        <div className="form-success">{successMessage}</div>
                    )}

                    <button
                        className="seller-submit-btn"
                        type="submit"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Сохраняем...' : 'Сохранить телефон'}
                    </button>
                </form>
            </div>
        </div>
    );
}

function BuyerCartPage({ onNavigate }: PageProps) {
    const { user } = useAuth();
    const {
        state,
        totalPrice,
        totalQuantity,
        increaseQuantity,
        decreaseQuantity,
        removeProduct,
    } = useCart();

    const isEmpty = state.items.length === 0;

    return (
        <main className="page">
            <BuyerPageHeader
                title="Корзина"
                userLine={user ? formatBuyerLine(user.full_name, user.phone) : ''}
                onNavigate={onNavigate}
                backToProfile
            />

            <section className="buyer-content-narrow">
                <div className="buyer-page-panel">
                    {isEmpty ? (
                        <p className="cart-empty">Корзина пока пустая</p>
                    ) : (
                        <>
                            <div className="buyer-cart-list">
                                {state.items.map((item) => (
                                    <article
                                        className="buyer-cart-item"
                                        key={item.product.id}
                                    >
                                        {item.product.imageUrl && (
                                            <img
                                                src={item.product.imageUrl}
                                                alt={item.product.name}
                                            />
                                        )}

                                        <div className="buyer-cart-item-main">
                                            <h3>{item.product.name}</h3>
                                            <p>{formatPrice(item.product.price)}</p>
                                        </div>

                                        <div className="cart-item-controls">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    decreaseQuantity(item.product.id)
                                                }
                                            >
                                                -
                                            </button>

                                            <span>{item.quantity}</span>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    increaseQuantity(item.product.id)
                                                }
                                            >
                                                +
                                            </button>
                                        </div>

                                        <button
                                            className="cart-remove-btn"
                                            type="button"
                                            onClick={() =>
                                                removeProduct(item.product.id)
                                            }
                                        >
                                            Удалить
                                        </button>
                                    </article>
                                ))}
                            </div>

                            <div className="buyer-cart-footer">
                                <div>
                                    <span>{totalQuantity} шт.</span>
                                    <strong>{formatPrice(totalPrice)}</strong>
                                </div>

                                <button
                                    className="checkout-btn"
                                    type="button"
                                    onClick={() => onNavigate('/checkout')}
                                >
                                    Оформить
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </section>
        </main>
    );
}

function BuyerAddressesPage({ onNavigate }: PageProps) {
    const { user, isLoading } = useAuth();
    const [addresses, setAddresses] = useState<BuyerAddress[]>(() =>
        loadBuyerAddresses(),
    );
    const fallbackAddress = user?.address
        ? createProfileAddress(user.address)
        : null;
    const visibleAddresses = addresses.length > 0
        ? addresses
        : fallbackAddress
          ? [fallbackAddress]
          : [];
    const [editingAddress, setEditingAddress] = useState<BuyerAddress | null>(null);
    const [draftLabel, setDraftLabel] = useState('');
    const [draftValue, setDraftValue] = useState('');
    const isEditing = Boolean(editingAddress);

    const persistAddresses = (nextAddresses: BuyerAddress[]) => {
        setAddresses(nextAddresses);
        saveBuyerAddresses(nextAddresses);
    };

    const selectAddress = (addressId: string) => {
        persistAddresses(
            visibleAddresses.map((address) => ({
                ...address,
                isSelected: address.id === addressId,
            })),
        );
    };

    const startEditAddress = (address: BuyerAddress) => {
        setEditingAddress(address);
        setDraftLabel(address.label);
        setDraftValue(address.value);
    };

    const startAddAddress = () => {
        setEditingAddress(null);
        setDraftLabel('');
        setDraftValue('');
    };

    const handleAddressSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const label = draftLabel.trim() || 'Адрес доставки';
        const value = draftValue.trim();

        if (!value) {
            return;
        }

        if (editingAddress) {
            persistAddresses(
                visibleAddresses.map((address) =>
                    address.id === editingAddress.id
                        ? {
                            ...address,
                            label,
                            value,
                        }
                        : address,
                ),
            );
        } else {
            persistAddresses([
                ...visibleAddresses.map((address) => ({
                    ...address,
                    isSelected: false,
                })),
                {
                    id: crypto.randomUUID(),
                    label,
                    value,
                    isSelected: true,
                },
            ]);
        }

        setEditingAddress(null);
        setDraftLabel('');
        setDraftValue('');
    };

    return (
        <main className="page">
            <BuyerPageHeader
                title="Мои адреса"
                userLine={user ? formatBuyerLine(user.full_name, user.phone) : ''}
                onNavigate={onNavigate}
                backToProfile
            />

            {isLoading ? (
                <BuyerCenteredPanel title="Загружаем адреса" />
            ) : !user ? (
                <BuyerAuthPrompt onNavigate={onNavigate} />
            ) : (
                <section className="buyer-address-layout">
                    <div className="buyer-page-panel">
                        {visibleAddresses.length === 0 ? (
                            <p className="cart-empty">Адреса пока не добавлены</p>
                        ) : (
                            <div className="buyer-address-list">
                                {visibleAddresses.map((address) => (
                                    <article
                                        className="buyer-address-item"
                                        key={address.id}
                                    >
                                        <button
                                            className={
                                                address.isSelected
                                                    ? 'address-radio address-radio-selected'
                                                    : 'address-radio'
                                            }
                                            type="button"
                                            aria-label="Выбрать адрес"
                                            onClick={() => selectAddress(address.id)}
                                        />

                                        <div>
                                            <h3>{address.label}</h3>
                                            <p>{address.value}</p>
                                        </div>

                                        <button
                                            className="icon-nav-btn icon-nav-btn-small"
                                            type="button"
                                            aria-label="Редактировать адрес"
                                            title="Редактировать адрес"
                                            onClick={() => startEditAddress(address)}
                                        >
                                            <PencilIcon />
                                        </button>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>

                    <form className="buyer-page-panel seller-form" onSubmit={handleAddressSubmit}>
                        <h2>{isEditing ? 'Редактировать адрес' : 'Новый адрес'}</h2>

                        <label className="form-field">
                            <span>Название</span>
                            <input
                                type="text"
                                value={draftLabel}
                                onChange={(event) => setDraftLabel(event.target.value)}
                                placeholder="Дом, работа"
                            />
                        </label>

                        <label className="form-field">
                            <span>Адрес</span>
                            <textarea
                                value={draftValue}
                                onChange={(event) => setDraftValue(event.target.value)}
                                placeholder="Город, улица, дом, квартира"
                                rows={3}
                            />
                        </label>

                        <button className="seller-submit-btn" type="submit">
                            {isEditing ? 'Сохранить адрес' : '+ Добавить новый адрес'}
                        </button>

                        {isEditing && (
                            <button
                                className="nav-link-btn nav-link-btn-secondary"
                                type="button"
                                onClick={startAddAddress}
                            >
                                Отмена
                            </button>
                        )}
                    </form>
                </section>
            )}
        </main>
    );
}

function BuyerPageHeader({
    title,
    userLine,
    onNavigate,
    backToProfile = false,
}: PageProps & {
    title: string;
    userLine: string;
    backToProfile?: boolean;
}) {
    return (
        <header className="page-header buyer-header">
            <div>
                <h1>{title}</h1>
                {userLine && <p>{userLine}</p>}
            </div>

            <div className="page-actions">
                {backToProfile && (
                    <button
                        className="nav-link-btn nav-link-btn-secondary"
                        type="button"
                        onClick={() => onNavigate('/profile')}
                    >
                        <UserBustIcon />
                        В профиль
                    </button>
                )}

                <button
                    className="nav-link-btn nav-link-btn-secondary"
                    type="button"
                    onClick={() => onNavigate('/')}
                >
                    <HomeIcon />
                    На главную
                </button>
            </div>
        </header>
    );
}

function BuyerMenuButton({
    title,
    description,
    icon,
    onClick,
}: {
    title: string;
    description: string;
    icon: ReactNode;
    onClick: () => void;
}) {
    return (
        <button className="buyer-menu-item" type="button" onClick={onClick}>
            <span className="buyer-menu-icon">{icon}</span>
            <span>
                <strong>{title}</strong>
                <small>{description}</small>
            </span>
        </button>
    );
}

function BuyerCenteredPanel({ title }: { title: string }) {
    return (
        <section className="seller-auth">
            <div className="seller-card seller-auth-card">
                <h2>{title}</h2>
            </div>
        </section>
    );
}

function BuyerAuthPrompt({ onNavigate }: PageProps) {
    return (
        <section className="seller-auth">
            <div className="seller-card seller-auth-card">
                <h2>Нужно войти</h2>
                <p className="seller-auth-hint">
                    Войдите или зарегистрируйтесь, чтобы открыть личные данные.
                </p>

                <div className="auth-actions">
                    <button
                        className="seller-submit-btn"
                        type="button"
                        onClick={() => onNavigate('/login')}
                    >
                        Войти
                    </button>

                    <button
                        className="nav-link-btn nav-link-btn-secondary"
                        type="button"
                        onClick={() => onNavigate('/register')}
                    >
                        Зарегистрироваться
                    </button>
                </div>
            </div>
        </section>
    );
}

function createProfileAddress(value: string): BuyerAddress {
    return {
        id: 'profile-address',
        label: 'Основной адрес',
        value,
        isSelected: true,
    };
}

function formatBuyerLine(name: string, phone: string): string {
    return [shortenFullName(name), phone || 'телефон не указан'].join(' · ');
}

function shortenFullName(value: string): string {
    const parts = value.trim().split(/\s+/).filter(Boolean);

    if (parts.length <= 2) {
        return value;
    }

    return `${parts[0]} ${parts[1][0]}.`;
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

function formatDateOnly(value: string): string {
    return new Intl.DateTimeFormat('ru-RU', {
        dateStyle: 'medium',
    }).format(new Date(value));
}

function formatExpiryDate(batch: ProductBatch, product: Product | null): string {
    if (!product?.expiryDays) {
        return 'не указан';
    }

    const expiryDate = new Date(batch.manufacturedAt);
    expiryDate.setDate(expiryDate.getDate() + product.expiryDays);

    return formatDateOnly(expiryDate.toISOString());
}

function formatProductMeta(product: Product): string {
    return [product.weight, product.tag].filter(Boolean).join(' • ') || 'Без метки';
}

function getSellerVerificationStatusLabel(user: AuthUser): string {
    return user.role === 'admin' ? 'Подтверждён' : 'В проверке';
}

function getProductStatusLabel(status = 'approved'): string {
    switch (status) {
        case 'pending_review':
            return 'Ожидает';

        case 'approved':
            return 'Подтверждён';

        case 'rejected':
            return 'Отклонён';

        default:
            return status;
    }
}

function getOrderStatusLabel(status: string): string {
    switch (status) {
        case 'created':
        case 'processing':
            return 'Активный';

        case 'completed':
            return 'Завершён';

        case 'cancelled':
            return 'Отменён';

        default:
            return status;
    }
}

function cropProfilePhoto(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        const objectUrl = URL.createObjectURL(file);

        image.onload = () => {
            const size = Math.min(image.naturalWidth, image.naturalHeight);
            const sourceX = (image.naturalWidth - size) / 2;
            const sourceY = (image.naturalHeight - size) / 2;
            const outputSize = 256;

            const canvas = document.createElement('canvas');
            canvas.width = outputSize;
            canvas.height = outputSize;

            const context = canvas.getContext('2d');

            if (!context) {
                URL.revokeObjectURL(objectUrl);
                reject(new Error('Canvas is not available'));
                return;
            }

            context.drawImage(
                image,
                sourceX,
                sourceY,
                size,
                size,
                0,
                0,
                outputSize,
                outputSize,
            );

            URL.revokeObjectURL(objectUrl);
            resolve(canvas.toDataURL('image/jpeg', 0.9));
        };

        image.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Image loading failed'));
        };

        image.src = objectUrl;
    });
}

function ClipboardIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 4h8v3H8z" />
            <path d="M7 5H5v16h14V5h-2" />
            <path d="M8 11h8M8 15h6" />
        </svg>
    );
}

function UserBustIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
            <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
    );
}

function HomeIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 11 12 4l9 7" />
            <path d="M6 10v11h12V10" />
        </svg>
    );
}

function CartIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 5h2l2 11h10l2-8H7" />
            <path d="M10 20h.01M17 20h.01" />
        </svg>
    );
}

function PinIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 21s7-6.1 7-12a7 7 0 0 0-14 0c0 5.9 7 12 7 12z" />
            <path d="M12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
        </svg>
    );
}

function PencilIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m4 20 4.5-1 10-10-3.5-3.5-10 10L4 20z" />
            <path d="m14 6 3.5 3.5" />
        </svg>
    );
}

function FileIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 3h7l5 5v13H7z" />
            <path d="M14 3v5h5" />
            <path d="M9 13h6M9 17h6" />
        </svg>
    );
}

function PackageIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m3 7 9-4 9 4-9 4z" />
            <path d="M3 7v10l9 4 9-4V7" />
            <path d="M12 11v10" />
        </svg>
    );
}

function CheckCircleIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M21 11.5V12a9 9 0 1 1-5.3-8.2" />
            <path d="m9 12 2 2 9-9" />
        </svg>
    );
}

function HistoryIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 12a9 9 0 1 0 3-6.7" />
            <path d="M3 4v5h5" />
            <path d="M12 7v5l3 2" />
        </svg>
    );
}

function PlusIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
        </svg>
    );
}

type AuthPageProps = PageProps & {
    mode: 'login' | 'register';
};

type AuthFieldErrors = Partial<{
    fullName: string;
    email: string;
    password: string;
    role: string;
}>;

function AuthPage({ mode, onNavigate }: AuthPageProps) {
    const { login, register } = useAuth();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole>('buyer');
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isRegister = mode === 'register';

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const validationErrors = validateAuthForm({
            email,
            fullName,
            isRegister,
            password,
            role,
        });

        if (Object.keys(validationErrors).length > 0) {
            setFieldErrors(validationErrors);
            setError('Проверьте поля формы');
            return;
        }

        setFieldErrors({});
        setError('');
        setIsSubmitting(true);

        try {
            let authorizedUser;

            if (isRegister) {
                const payload: RegisterPayload = {
                    email: email.trim(),
                    full_name: fullName.trim(),
                    password,
                    role,
                };

                authorizedUser = await register(payload);
            } else {
                authorizedUser = await login(email.trim(), password);
            }

            onNavigate(getPostAuthPath(authorizedUser.role));
        } catch (caughtError) {
            setError(
                caughtError instanceof Error
                    ? caughtError.message
                    : 'Не удалось выполнить запрос',
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="page">
            <header className="page-header">
                <h1>{isRegister ? 'Регистрация' : 'Вход'}</h1>

                <button
                    className="nav-link-btn nav-link-btn-secondary"
                    type="button"
                    onClick={() => onNavigate('/')}
                >
                    В магазин
                </button>
            </header>

            <section className="seller-auth">
                <div className="seller-card seller-auth-card">
                    <h2>{isRegister ? 'Создать аккаунт' : 'Войти в аккаунт'}</h2>
                    <p className="seller-auth-hint">
                        {isRegister
                            ? 'Укажите настоящую почту и пароль не короче 8 символов.'
                            : 'Введите почту и пароль от вашего аккаунта.'}
                    </p>

                    <form className="seller-form" onSubmit={handleSubmit} noValidate>
                        {isRegister && (
                            <label className="form-field">
                                <span>Имя</span>
                                <input
                                    className={
                                        fieldErrors.fullName ? 'field-invalid' : ''
                                    }
                                    type="text"
                                    value={fullName}
                                    onChange={(event) => {
                                        setFullName(event.target.value);
                                        clearFieldError('fullName', setFieldErrors);
                                    }}
                                    autoComplete="name"
                                    placeholder="Например: Иван Петров"
                                    aria-invalid={Boolean(fieldErrors.fullName)}
                                    required
                                />

                                {fieldErrors.fullName && (
                                    <small className="field-error">
                                        {fieldErrors.fullName}
                                    </small>
                                )}
                            </label>
                        )}

                        <label className="form-field">
                            <span>Email</span>
                            <input
                                className={fieldErrors.email ? 'field-invalid' : ''}
                                type="email"
                                value={email}
                                onChange={(event) => {
                                    setEmail(event.target.value);
                                    clearFieldError('email', setFieldErrors);
                                }}
                                autoComplete="email"
                                placeholder="name@example.com"
                                aria-invalid={Boolean(fieldErrors.email)}
                                required
                            />

                            {fieldErrors.email && (
                                <small className="field-error">
                                    {fieldErrors.email}
                                </small>
                            )}
                        </label>

                        <label className="form-field">
                            <span>Пароль</span>
                            <input
                                className={fieldErrors.password ? 'field-invalid' : ''}
                                type="password"
                                value={password}
                                onChange={(event) => {
                                    setPassword(event.target.value);
                                    clearFieldError('password', setFieldErrors);
                                }}
                                autoComplete={
                                    isRegister ? 'new-password' : 'current-password'
                                }
                                placeholder="Минимум 8 символов"
                                aria-invalid={Boolean(fieldErrors.password)}
                                required
                            />

                            {fieldErrors.password ? (
                                <small className="field-error">
                                    {fieldErrors.password}
                                </small>
                            ) : (
                                isRegister && (
                                    <small className="field-hint">
                                        Минимум 8 символов, максимум 128.
                                    </small>
                                )
                            )}
                        </label>

                        {isRegister && (
                            <label className="form-field">
                                <span>Роль</span>
                                <select
                                    className={fieldErrors.role ? 'field-invalid' : ''}
                                    value={role}
                                    onChange={(event) => {
                                        setRole(event.target.value as UserRole);
                                        clearFieldError('role', setFieldErrors);
                                    }}
                                    aria-invalid={Boolean(fieldErrors.role)}
                                >
                                    <option value="buyer">Покупатель</option>
                                    <option value="seller">Продавец</option>
                                </select>

                                {fieldErrors.role && (
                                    <small className="field-error">
                                        {fieldErrors.role}
                                    </small>
                                )}
                            </label>
                        )}

                        {error && <div className="form-error">{error}</div>}

                        <button
                            className="seller-submit-btn"
                            type="submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting
                                ? 'Отправляем...'
                                : isRegister
                                  ? 'Зарегистрироваться'
                                  : 'Войти'}
                        </button>
                    </form>
                </div>
            </section>
        </main>
    );
}

type ValidateAuthFormParams = {
    email: string;
    fullName: string;
    isRegister: boolean;
    password: string;
    role: UserRole;
};

function validateAuthForm({
    email,
    fullName,
    isRegister,
    password,
    role,
}: ValidateAuthFormParams): AuthFieldErrors {
    const errors: AuthFieldErrors = {};
    const trimmedEmail = email.trim();
    const trimmedName = fullName.trim();

    if (isRegister && trimmedName.length < 2) {
        errors.fullName = 'Введите имя: минимум 2 символа.';
    }

    if (!trimmedEmail) {
        errors.email = 'Введите почту.';
    } else if (!isValidEmail(trimmedEmail)) {
        errors.email = 'Почта должна быть в формате name@example.com.';
    }

    if (!password) {
        errors.password = 'Введите пароль.';
    } else if (password.length < 8) {
        errors.password = 'Пароль должен быть не короче 8 символов.';
    } else if (password.length > 128) {
        errors.password = 'Пароль должен быть не длиннее 128 символов.';
    }

    if (isRegister && role !== 'buyer' && role !== 'seller') {
        errors.role = 'Выберите роль: покупатель или продавец.';
    }

    return errors;
}

function isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function clearFieldError(
    field: keyof AuthFieldErrors,
    setFieldErrors: Dispatch<SetStateAction<AuthFieldErrors>>,
) {
    setFieldErrors((current) => {
        if (!current[field]) {
            return current;
        }

        const next = {
            ...current,
        };

        delete next[field];

        return next;
    });
}

function getPostAuthPath(role: UserRole): string {
    switch (role) {
        case 'admin':
            return '/admin';

        case 'seller':
            return '/seller';

        default:
            return '/';
    }
}

function getRoleLabel(role: UserRole): string {
    switch (role) {
        case 'buyer':
            return 'Покупатель';

        case 'seller':
            return 'Продавец';

        case 'admin':
            return 'Администратор';

        default:
            return role;
    }
}

export default App;
