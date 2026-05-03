import './App.css';

import {
    useEffect,
    useState,
    type Dispatch,
    type FormEvent,
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
import { CartProvider } from './store/cart/CartContext';
import { OrdersProvider } from './store/orders/OrdersContext';
import { ProductsProvider } from './store/products/ProductsContext';

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

    return <ShopPage onNavigate={navigate} />;
}

type PageProps = {
    onNavigate: (path: string) => void;
};

function ShopPage({ onNavigate }: PageProps) {
    const { user, logout } = useAuth();

    return (
        <main className="page">
            <header className="page-header">
                <h1>Онлайн-магазин</h1>

                <div className="page-actions">
                    {user ? (
                        <>
                            <span className="user-chip">
                                {user.full_name} · {getRoleLabel(user.role)}
                            </span>

                            <button
                                className="nav-link-btn nav-link-btn-secondary"
                                type="button"
                                onClick={() => onNavigate('/profile')}
                            >
                                Профиль
                            </button>

                            <button
                                className="nav-link-btn nav-link-btn-secondary"
                                type="button"
                                onClick={logout}
                            >
                                Выйти
                            </button>
                        </>
                    ) : (
                        <>
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
                        </>
                    )}

                    <button
                        className="nav-link-btn"
                        type="button"
                        onClick={() => onNavigate('/seller')}
                    >
                        Продавцу
                    </button>

                    <button
                        className="nav-link-btn nav-link-btn-secondary"
                        type="button"
                        onClick={() => onNavigate('/admin')}
                    >
                        Администратору
                    </button>
                </div>
            </header>

            <section className="shop-layout">
                <div className="products-section">
                    <ProductCarousel />

                    <div className="bottom-section">
                        <OrdersList />
                    </div>
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
    const { user, updateProfile, isLoading } = useAuth();
    const [fullName, setFullName] = useState(user?.full_name ?? '');
    const [phone, setPhone] = useState(user?.phone ?? '');
    const [address, setAddress] = useState(user?.address ?? '');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setFullName(user?.full_name ?? '');
        setPhone(user?.phone ?? '');
        setAddress(user?.address ?? '');
    }, [user]);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        setSuccessMessage('');

        if (fullName.trim().length < 2) {
            setError('Введите имя: минимум 2 символа');
            return;
        }

        setIsSubmitting(true);

        try {
            await updateProfile({
                full_name: fullName.trim(),
                phone: phone.trim(),
                address: address.trim(),
            });

            setSuccessMessage('Профиль сохранен');
        } catch (caughtError) {
            setError(
                caughtError instanceof Error
                    ? caughtError.message
                    : 'Не удалось сохранить профиль',
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="page">
            <header className="page-header">
                <div>
                    <h1>Профиль</h1>
                    <p>Контактные данные будут подставляться при оформлении заказа</p>
                </div>

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
                    {isLoading ? (
                        <h2>Загружаем профиль</h2>
                    ) : !user ? (
                        <>
                            <h2>Нужно войти</h2>
                            <p className="seller-auth-hint">
                                Войдите или зарегистрируйтесь, чтобы хранить данные
                                профиля.
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
                        </>
                    ) : (
                        <>
                            <h2>Мои данные</h2>

                            <form className="seller-form" onSubmit={handleSubmit}>
                                <label className="form-field">
                                    <span>Имя</span>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(event) =>
                                            setFullName(event.target.value)
                                        }
                                        placeholder="Иван Петров"
                                    />
                                </label>

                                <label className="form-field">
                                    <span>Телефон</span>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(event) =>
                                            setPhone(event.target.value)
                                        }
                                        placeholder="+7 999 123-45-67"
                                    />
                                </label>

                                <label className="form-field">
                                    <span>Адрес доставки</span>
                                    <input
                                        type="text"
                                        value={address}
                                        onChange={(event) =>
                                            setAddress(event.target.value)
                                        }
                                        placeholder="Город, улица, дом, квартира"
                                    />
                                </label>

                                {error && <div className="form-error">{error}</div>}

                                {successMessage && (
                                    <div className="form-success">
                                        {successMessage}
                                    </div>
                                )}

                                <button
                                    className="seller-submit-btn"
                                    type="submit"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Сохраняем...' : 'Сохранить'}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </section>
        </main>
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
