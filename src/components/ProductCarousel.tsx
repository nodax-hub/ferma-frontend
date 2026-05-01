import { products } from '../data/products';
import { ProductCard } from './ProductCard';

export function ProductCarousel() {
    return (
        <section className="carousel" aria-label="Карусель товаров">
            {products.map((product) => (
                <ProductCard key={product.id} product={product} />
            ))}
        </section>
    );
}