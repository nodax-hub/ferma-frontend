import { useState, type ChangeEvent, type FormEvent } from 'react';

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
    const [imageUrl, setImageUrl] = useState('');
    const [imageInputKey, setImageInputKey] = useState(0);

    const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        setError('');
        setSuccessMessage('');

        if (!file) {
            setImageUrl('');
            return;
        }

        if (!file.type.startsWith('image/')) {
            setImageUrl('');
            setError('Выберите файл изображения');
            return;
        }

        try {
            const croppedImageUrl = await cropImageToSquare(file);
            setImageUrl(croppedImageUrl);
        } catch {
            setImageUrl('');
            setError('Не удалось загрузить изображение');
        }
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setError('');
        setSuccessMessage('');

        const price = Number(formState.price.replace(',', '.'));
        const hasOldPrice = formState.oldPrice.trim().length > 0;
        const oldPrice = hasOldPrice
            ? Number(formState.oldPrice.replace(',', '.'))
            : undefined;

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

        if (
            hasOldPrice &&
            (!Number.isFinite(oldPrice) || oldPrice === undefined || oldPrice <= 0)
        ) {
            setError('Введите корректную старую цену');
            return;
        }

        if (oldPrice !== undefined && oldPrice < price) {
            setError('Старая цена не должна быть меньше текущей цены');
            return;
        }

        const discount = formState.discount.trim();

        const newProduct: Product = {
            id: crypto.randomUUID(),
            name: formState.name.trim(),
            tag: formState.tag.trim(),
            discount:
                discount ||
                (oldPrice !== undefined ? calculateDiscount(price, oldPrice) : ''),
            price,
            status: 'pending_review',
            sellerId: CURRENT_SELLER_ID,
            createdAt: new Date().toISOString(),
        };

        if (oldPrice !== undefined) {
            newProduct.oldPrice = oldPrice;
        }

        if (imageUrl) {
            newProduct.imageUrl = imageUrl;
        }

        createProduct(newProduct);

        setFormState(initialFormState);
        setImageUrl('');
        setImageInputKey((current) => current + 1);
        setSuccessMessage('Товар создан');
    };

    return (
        <section className="seller-card">
            <h2>Создать товар</h2>

            <form className="seller-form" onSubmit={handleSubmit}>
                <label className="form-field">
                    <span>Изображение товара</span>
                    <input
                        key={imageInputKey}
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                    />
                </label>

                {imageUrl && (
                    <div className="product-image-preview">
                        <img src={imageUrl} alt="Предпросмотр товара" />

                        <button
                            className="seller-danger-btn"
                            type="button"
                            onClick={() => {
                                setImageUrl('');
                                setImageInputKey((current) => current + 1);
                            }}
                        >
                            Удалить изображение
                        </button>
                    </div>
                )}

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
                        placeholder="Можно оставить пустым"
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

function cropImageToSquare(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        const objectUrl = URL.createObjectURL(file);

        image.onload = () => {
            const size = Math.min(image.naturalWidth, image.naturalHeight);
            const sourceX = (image.naturalWidth - size) / 2;
            const sourceY = (image.naturalHeight - size) / 2;
            const outputSize = 512;

            const canvas = document.createElement('canvas');
            canvas.width = outputSize;
            canvas.height = outputSize;

            const context = canvas.getContext('2d');

            if (!context) {
                URL.revokeObjectURL(objectUrl);
                reject(new Error('Canvas is not available'));
                return;
            }

            context.drawImage(
                image,
                sourceX,
                sourceY,
                size,
                size,
                0,
                0,
                outputSize,
                outputSize,
            );

            URL.revokeObjectURL(objectUrl);
            resolve(canvas.toDataURL('image/jpeg', 0.9));
        };

        image.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Image loading failed'));
        };

        image.src = objectUrl;
    });
}
