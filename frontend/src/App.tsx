import './App.css';

import {
    useEffect,
    useState,
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
import type { RegisterPayload, UserRole } from './api/client';
import { AuthProvider, useAuth } from './store/auth/AuthContext';
import { CartProvider, useCart } from './store/cart/CartContext';
import { OrdersProvider } from './store/orders/OrdersContext';
import { ProductsProvider } from './store/products/ProductsContext';
import {
    loadBuyerAddresses,
    saveBuyerAddresses,
    type BuyerAddress,
} from './utils/buyerAddresses';

function App() {
    return (
        <AuthProvider>
            <ProductsProvider>
                <OrdersProvider>
                    <CartProvider>
                        <AppRoutes />
                    </CartProvider>
                </OrdersProvider>
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

    if (path === '/seller') {
        return <SellerPage onNavigate={navigate} />;
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

function SellerPage({ onNavigate }: PageProps) {
    const { user, logout, isLoading } = useAuth();
    const canManageProducts = user?.role === 'seller' || user?.role === 'admin';

    return (
        <main className="page seller-page">
            <header className="page-header">
                <div>
                    <h1>Страница продавца</h1>
                    <p>Авторизация и управление товарами</p>
                </div>

                <div className="page-actions">
                    {user && (
                        <button
                            className="nav-link-btn"
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
            ) : canManageProducts ? (
                <SellerDashboard />
            ) : user ? (
                <section className="seller-auth">
                    <div className="seller-card seller-auth-card">
                        <h2>Нет доступа</h2>
                        <p className="seller-auth-hint">
                            Для этой страницы нужен аккаунт продавца.
                        </p>
                    </div>
                </section>
            ) : (
                <SellerAuthPrompt onNavigate={onNavigate} />
            )}
        </main>
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
                    <div className="buyer-profile-summary">
                        <div className="buyer-avatar">
                            <UserBustIcon />
                        </div>

                        <div>
                            <h2>{user.full_name}</h2>
                            <p>{user.phone || 'Телефон не указан'}</p>
                        </div>
                    </div>

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
