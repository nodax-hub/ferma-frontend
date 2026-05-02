import './App.css';

import { useEffect, useState, type FormEvent } from 'react';

import { Cart } from './components/Cart';
import { CheckoutForm } from './components/CheckoutForm';
import { OrdersList } from './components/OrdersList';
import { ProductCarousel } from './components/ProductCarousel';
import { SellerDashboard } from './components/SellerDashboard';
import { CartProvider } from './store/cart/CartContext';
import { OrdersProvider } from './store/orders/OrdersContext';
import { ProductsProvider } from './store/products/ProductsContext';

const SELLER_SESSION_KEY = 'seller-session';
const SELLER_LOGIN = 'seller';
const SELLER_PASSWORD = 'seller123';

function App() {
    return (
        <ProductsProvider>
            <OrdersProvider>
                <CartProvider>
                    <AppRoutes />
                </CartProvider>
            </OrdersProvider>
        </ProductsProvider>
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

    return <ShopPage onNavigate={navigate} />;
}

type PageProps = {
    onNavigate: (path: string) => void;
};

function ShopPage({ onNavigate }: PageProps) {
    return (
        <main className="page">
            <header className="page-header">
                <h1>Онлайн-магазин</h1>

                <button
                    className="nav-link-btn"
                    type="button"
                    onClick={() => onNavigate('/seller')}
                >
                    Продавцу
                </button>
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
                <CheckoutForm />
                <Cart onCheckout={() => undefined} hideCheckoutButton />
            </section>
        </main>
    );
}

function SellerPage({ onNavigate }: PageProps) {
    const [isAuthorized, setIsAuthorized] = useState(
        () => localStorage.getItem(SELLER_SESSION_KEY) === 'authorized',
    );

    const handleLogin = () => {
        localStorage.setItem(SELLER_SESSION_KEY, 'authorized');
        setIsAuthorized(true);
    };

    const handleLogout = () => {
        localStorage.removeItem(SELLER_SESSION_KEY);
        setIsAuthorized(false);
    };

    return (
        <main className="page seller-page">
            <header className="page-header">
                <div>
                    <h1>Страница продавца</h1>
                    <p>Авторизация и управление товарами</p>
                </div>

                <div className="page-actions">
                    {isAuthorized && (
                        <button
                            className="nav-link-btn"
                            type="button"
                            onClick={handleLogout}
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

            {isAuthorized ? (
                <SellerDashboard />
            ) : (
                <SellerLoginForm onLogin={handleLogin} />
            )}
        </main>
    );
}

type SellerLoginFormProps = {
    onLogin: () => void;
};

function SellerLoginForm({ onLogin }: SellerLoginFormProps) {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');

        if (login.trim() !== SELLER_LOGIN || password !== SELLER_PASSWORD) {
            setError('Неверный логин или пароль');
            return;
        }

        onLogin();
    };

    return (
        <section className="seller-auth">
            <div className="seller-card seller-auth-card">
                <h2>Вход для продавца</h2>
                <p className="seller-auth-hint">Демо: seller / seller123</p>

                <form className="seller-form" onSubmit={handleSubmit}>
                    <label className="form-field">
                        <span>Логин</span>
                        <input
                            type="text"
                            value={login}
                            onChange={(event) => setLogin(event.target.value)}
                            autoComplete="username"
                            placeholder="seller"
                        />
                    </label>

                    <label className="form-field">
                        <span>Пароль</span>
                        <input
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            autoComplete="current-password"
                            placeholder="seller123"
                        />
                    </label>

                    {error && <div className="form-error">{error}</div>}

                    <button className="seller-submit-btn" type="submit">
                        Войти
                    </button>
                </form>
            </div>
        </section>
    );
}

export default App;
