import { ProductCreateForm } from './ProductCreateForm';
import { SellerProductsList } from './SellerProductsList';

export function SellerDashboard() {
    return (
        <section className="seller-dashboard">
            <div className="seller-dashboard-title">
                <h1>Кабинет продавца</h1>
                <p>Создание и управление карточками товаров</p>
            </div>

            <div className="seller-layout">
                <ProductCreateForm />
                <SellerProductsList />
            </div>
        </section>
    );
}