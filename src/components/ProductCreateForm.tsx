import { useState, type FormEvent } from 'react';

import type { Product } from '../models/Product';
import { useProducts } from '../store/products/ProductsContext';

type ProductFormState = {
    name: string;
    tag: string;
    discount: string;
    price: string;
    oldPrice: string;
};

const initialFormState: ProductFormState = {
    name: '',
    tag: '',
    discount: '',
    price: '',
    oldPrice: '',
};

const CURRENT_SELLER_ID = 'demo-seller';

export function ProductCreateForm() {
    const { createProduct } = useProducts();

    const [formState, setFormState] =
        useState<ProductFormState>(initialFormState);

    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setError('');
        setSuccessMessage('');

        const price = Number(formState.price.replace(',', '.'));
        const oldPrice = Number(formState.oldPrice.replace(',', '.'));

        if (!formState.name.trim()) {
            setError('Введите название товара');
            return;
        }

        if (!formState.tag.trim()) {
            setError('Введите тег товара');
            return;
        }

        if (!Number.isFinite(price) || price <= 0) {
            setError('Введите корректную цену');
            return;
        }

        if (!Number.isFinite(oldPrice) || oldPrice <= 0) {
            setError('Введите корректную старую цену');
            return;
        }

        if (oldPrice < price) {
            setError('Старая цена не должна быть меньше текущей цены');
            return;
        }

        const newProduct: Product = {
            id: crypto.randomUUID(),
            name: formState.name.trim(),
            tag: formState.tag.trim(),
            discount: formState.discount.trim() || calculateDiscount(price, oldPrice),
            price,
            oldPrice,
            sellerId: CURRENT_SELLER_ID,
            createdAt: new Date().toISOString(),
        };

        createProduct(newProduct);

        setFormState(initialFormState);
        setSuccessMessage('Товар создан');
    };

    return (
        <section className="seller-card">
            <h2>Создать товар</h2>

            <form className="seller-form" onSubmit={handleSubmit}>
                <label className="form-field">
                    <span>Название товара</span>
                    <input
                        type="text"
                        value={formState.name}
                        onChange={(event) =>
                            setFormState((current) => ({
                                ...current,
                                name: event.target.value,
                            }))
                        }
                        placeholder="Например: Молоко 1 л"
                    />
                </label>

                <label className="form-field">
                    <span>Тег</span>
                    <input
                        type="text"
                        value={formState.tag}
                        onChange={(event) =>
                            setFormState((current) => ({
                                ...current,
                                tag: event.target.value,
                            }))
                        }
                        placeholder="Например: 1 л • Без лактозы"
                    />
                </label>

                <label className="form-field">
                    <span>Текущая цена</span>
                    <input
                        type="text"
                        value={formState.price}
                        onChange={(event) =>
                            setFormState((current) => ({
                                ...current,
                                price: event.target.value,
                            }))
                        }
                        placeholder="179.99"
                    />
                </label>

                <label className="form-field">
                    <span>Старая цена</span>
                    <input
                        type="text"
                        value={formState.oldPrice}
                        onChange={(event) =>
                            setFormState((current) => ({
                                ...current,
                                oldPrice: event.target.value,
                            }))
                        }
                        placeholder="234.33"
                    />
                </label>

                <label className="form-field">
                    <span>Скидка</span>
                    <input
                        type="text"
                        value={formState.discount}
                        onChange={(event) =>
                            setFormState((current) => ({
                                ...current,
                                discount: event.target.value,
                            }))
                        }
                        placeholder="Можно оставить пустым"
                    />
                </label>

                {error && <div className="form-error">{error}</div>}

                {successMessage && (
                    <div className="form-success">{successMessage}</div>
                )}

                <button className="seller-submit-btn" type="submit">
                    Создать карточку
                </button>
            </form>
        </section>
    );
}

function calculateDiscount(price: number, oldPrice: number): string {
    if (oldPrice <= price) {
        return '0%';
    }

    const discount = Math.round(((oldPrice - price) / oldPrice) * 100);

    return `−${discount}%`;
}