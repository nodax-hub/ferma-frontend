import { useProducts } from '../store/products/ProductsContext';
import { useProductBatches } from '../store/productBatches/ProductBatchesContext';
import { ProductCard } from './ProductCard';

export function ProductCarousel() {
    const { state } = useProducts();
    const { getProductQuantity } = useProductBatches();
    const approvedProducts = state.products.filter(
        (product) =>
            (product.status ?? 'approved') === 'approved' &&
            (product.isPublished ?? true) &&
            getProductQuantity(product.id) > 0,
    );

    return (
        <section className="carousel" aria-label="Карусель товаров">
            {approvedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
            ))}
        </section>
    );
}
