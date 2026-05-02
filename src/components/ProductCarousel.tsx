import { useProducts } from '../store/products/ProductsContext';
import { ProductCard } from './ProductCard';

export function ProductCarousel() {
    const { state } = useProducts();

    return (
        <section className="carousel" aria-label="Карусель товаров">
            {state.products.map((product) => (
                <ProductCard key={product.id} product={product} />
            ))}
        </section>
    );
}