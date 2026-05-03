import { useState, type ChangeEvent, type FormEvent } from 'react';

import type { MeasurementUnit, Product, ProductTag } from '../models/Product';
import { useAuth } from '../store/auth/AuthContext';
import { useProducts } from '../store/products/ProductsContext';

type ProductFormState = {
    name: string;
    tag: '' | ProductTag;
    weightValue: string;
    weightUnit: MeasurementUnit;
    price: string;
    oldPrice: string;
    expiryDays: string;
};

const initialFormState: ProductFormState = {
    name: '',
    tag: '',
    weightValue: '',
    weightUnit: 'г',
    price: '',
    oldPrice: '',
    expiryDays: '',
};

const PRODUCT_TAGS: ProductTag[] = ['Без сахара', 'Халяль', 'Без лактозы', 'Белковый', 'Сливочный'];
const MEASUREMENT_UNITS: MeasurementUnit[] = ['г', 'кг', 'мл', 'л', 'шт'];
const DECIMAL_PATTERN = /^\d+(?:[,.]\d{1,2})?$/;
const HTML_PATTERN = /<[^>]*>/;

type ProductCreateFormProps = {
    productToEdit?: Product | null;
    onCancelEdit?: () => void;
    onSaved?: () => void;
};

export function ProductCreateForm({
    productToEdit = null,
    onCancelEdit,
    onSaved,
}: ProductCreateFormProps) {
    const { user } = useAuth();
    const { createProduct, updateProduct } = useProducts();
    const isEditing = Boolean(productToEdit);

    const [formState, setFormState] =
        useState<ProductFormState>(() => createInitialFormState(productToEdit));

    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imageUrl, setImageUrl] = useState(productToEdit?.imageUrl ?? '');
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

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setError('');
        setSuccessMessage('');

        if (!user) {
            setError('Нужно войти в аккаунт продавца');
            return;
        }

        const price = Number(formState.price.replace(',', '.'));
        const hasOldPrice = formState.oldPrice.trim().length > 0;
        const oldPrice = hasOldPrice
            ? Number(formState.oldPrice.replace(',', '.'))
            : null;
        const hasWeight = formState.weightValue.trim().length > 0;
        const weightValue = Number(formState.weightValue.replace(',', '.'));
        const hasExpiryDays = formState.expiryDays.trim().length > 0;
        const expiryDays = hasExpiryDays ? Number(formState.expiryDays) : null;
        const trimmedName = formState.name.trim();

        if (trimmedName.length < 3 || trimmedName.length > 120 || HTML_PATTERN.test(trimmedName)) {
            setError('Название должно быть от 3 до 120 символов, без HTML');
            return;
        }

        if (!DECIMAL_PATTERN.test(formState.price.trim()) || !Number.isFinite(price) || price <= 0) {
            setError('Введите корректную цену больше 0, максимум 2 знака после запятой');
            return;
        }

        if (
            hasOldPrice &&
            (!DECIMAL_PATTERN.test(formState.oldPrice.trim()) ||
                !Number.isFinite(oldPrice) ||
                oldPrice === null ||
                oldPrice <= 0)
        ) {
            setError('Введите корректную старую цену, максимум 2 знака после запятой');
            return;
        }

        if (oldPrice !== null && oldPrice <= price) {
            setError('Старая цена должна быть больше текущей цены');
            return;
        }

        if (hasWeight && (!Number.isFinite(weightValue) || weightValue <= 0)) {
            setError('Введите корректный вес или объем');
            return;
        }

        if (
            hasExpiryDays &&
            (!Number.isInteger(expiryDays) || expiryDays === null || expiryDays <= 0)
        ) {
            setError('Срок годности должен быть целым числом дней больше 0');
            return;
        }

        const now = new Date().toISOString();
        const baseProduct = productToEdit ?? {
            id: crypto.randomUUID(),
            sellerId: String(user.id),
            createdAt: now,
        };

        const productPayload: Product = {
            ...baseProduct,
            name: trimmedName,
            tag: formState.tag || null,
            weight: hasWeight
                ? formatWeight(weightValue, formState.weightUnit)
                : null,
            price,
            oldPrice,
            expiryDays,
            imageUrl: imageUrl || null,
            isVerified: false,
            isPublished: false,
            status: 'pending_review',
            updatedAt: now,
        };

        setIsSubmitting(true);

        try {
            if (productToEdit) {
                await updateProduct(productPayload);
                onSaved?.();
                return;
            }

            await createProduct(productPayload);

            setFormState(initialFormState);
            setImageUrl('');
            setImageInputKey((current) => current + 1);
            setSuccessMessage('Товар создан');
        } catch (caughtError) {
            setError(
                caughtError instanceof Error
                    ? caughtError.message
                    : 'Не удалось сохранить товар',
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="seller-card">
            <div className="seller-form-header">
                <div>
                    <h2>{isEditing ? 'Редактировать товар' : 'Создать товар'}</h2>
                    {isEditing && (
                        <p className="seller-auth-hint">
                            После сохранения карточка снова уйдет на проверку.
                        </p>
                    )}
                </div>

                {isEditing && (
                    <button
                        className="seller-danger-btn"
                        type="button"
                        onClick={onCancelEdit}
                    >
                        Отмена
                    </button>
                )}
            </div>

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
                        minLength={3}
                        maxLength={120}
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
                    <span>Вес / объем</span>
                    <div className="form-inline">
                        <input
                            type="text"
                            inputMode="decimal"
                            value={formState.weightValue}
                            onChange={(event) =>
                                setFormState((current) => ({
                                    ...current,
                                    weightValue: event.target.value,
                                }))
                            }
                            placeholder="200"
                        />

                        <select
                            value={formState.weightUnit}
                            onChange={(event) =>
                                setFormState((current) => ({
                                    ...current,
                                    weightUnit: event.target.value as MeasurementUnit,
                                }))
                            }
                        >
                            {MEASUREMENT_UNITS.map((unit) => (
                                <option value={unit} key={unit}>
                                    {unit}
                                </option>
                            ))}
                        </select>
                    </div>
                </label>

                <label className="form-field">
                    <span>Тег</span>
                    <select
                        value={formState.tag}
                        onChange={(event) =>
                            setFormState((current) => ({
                                ...current,
                                tag: event.target.value as ProductFormState['tag'],
                            }))
                        }
                    >
                        <option value="">Без тега</option>
                        {PRODUCT_TAGS.map((tag) => (
                            <option value={tag} key={tag}>
                                {tag}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="form-field">
                    <span>Текущая цена</span>
                    <input
                        type="text"
                        inputMode="decimal"
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
                        inputMode="decimal"
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
                    <span>Срок годности, дней</span>
                    <input
                        type="text"
                        inputMode="numeric"
                        value={formState.expiryDays}
                        onChange={(event) =>
                            setFormState((current) => ({
                                ...current,
                                expiryDays: event.target.value,
                            }))
                        }
                        placeholder="Можно оставить пустым"
                    />
                </label>

                {error && <div className="form-error">{error}</div>}

                {successMessage && (
                    <div className="form-success">{successMessage}</div>
                )}

                <button
                    className="seller-submit-btn"
                    type="submit"
                    disabled={isSubmitting}
                >
                    {isSubmitting
                        ? 'Сохраняем...'
                        : isEditing
                          ? 'Отправить на модерацию'
                          : 'Создать карточку'}
                </button>
            </form>
        </section>
    );
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

function createInitialFormState(product: Product | null): ProductFormState {
    if (!product) {
        return initialFormState;
    }

    const weight = parseWeight(product.weight);

    return {
        name: product.name,
        tag: product.tag ?? '',
        weightValue: weight.value,
        weightUnit: weight.unit,
        price: formatInputNumber(product.price),
        oldPrice:
            product.oldPrice === undefined || product.oldPrice === null
                ? ''
                : formatInputNumber(product.oldPrice),
        expiryDays:
            product.expiryDays === undefined || product.expiryDays === null
                ? ''
                : String(product.expiryDays),
    };
}

function parseWeight(weight?: string | null): {
    value: string;
    unit: MeasurementUnit;
} {
    if (!weight) {
        return {
            value: '',
            unit: 'г',
        };
    }

    const match = weight.trim().match(/^(\d+(?:[,.]\d+)?)\s*(г|кг|мл|л|шт)$/);

    if (!match) {
        return {
            value: '',
            unit: 'г',
        };
    }

    return {
        value: match[1].replace(',', '.'),
        unit: match[2] as MeasurementUnit,
    };
}

function formatWeight(value: number, unit: MeasurementUnit): string {
    if (unit === 'г' && value >= 1000) {
        return `${formatNumber(value / 1000)} кг`;
    }

    if (unit === 'мл' && value >= 1000) {
        return `${formatNumber(value / 1000)} л`;
    }

    return `${formatNumber(value)} ${unit}`;
}

function formatNumber(value: number): string {
    return Number.isInteger(value)
        ? String(value)
        : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

function formatInputNumber(value: number): string {
    return String(value).replace(',', '.');
}
