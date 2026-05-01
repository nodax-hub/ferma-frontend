import './App.css';

import { Cart } from './components/Cart';
import { CheckoutForm } from './components/CheckoutForm';
import { OrdersList } from './components/OrdersList';
import { ProductCarousel } from './components/ProductCarousel';
import { CartProvider } from './store/cart/CartContext';
import { OrdersProvider } from './store/orders/OrdersContext';

function App() {
    return (
        <OrdersProvider>
            <CartProvider>
                <main className="page">
                    <section className="shop-layout">
                        <div className="products-section">
                            <h1>Онлайн-магазин</h1>

                            <ProductCarousel />

                            <div className="bottom-section">
                                <CheckoutForm />
                                <OrdersList />
                            </div>
                        </div>

                        <Cart />
                    </section>
                </main>
            </CartProvider>
        </OrdersProvider>
    );
}

export default App;