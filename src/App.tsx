import './App.css';

import { Cart } from './components/Cart';
import { CheckoutForm } from './components/CheckoutForm';
import { OrdersList } from './components/OrdersList';
import { ProductCarousel } from './components/ProductCarousel';
import { SellerDashboard } from './components/SellerDashboard';
import { CartProvider } from './store/cart/CartContext';
import { OrdersProvider } from './store/orders/OrdersContext';
import { ProductsProvider } from './store/products/ProductsContext';

function App() {
    return (
        <ProductsProvider>
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

                                <SellerDashboard />
                            </div>

                            <Cart />
                        </section>
                    </main>
                </CartProvider>
            </OrdersProvider>
        </ProductsProvider>
    );
}

export default App;