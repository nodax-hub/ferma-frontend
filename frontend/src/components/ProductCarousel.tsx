import { useProducts } from '../store/products/ProductsContext';
import { ProductCard } from './ProductCard';

export function ProductCarousel() {
    const { state } = useProducts();
    const approvedProducts = state.products.filter(
        (product) =>
            (product.status ?? 'approved') === 'approved' &&
            (product.isPublished ?? true),
    );

    return (
        <section className="carousel" aria-label="Карусель товаров">
            {approvedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
            ))}
        </section>
    );
}
