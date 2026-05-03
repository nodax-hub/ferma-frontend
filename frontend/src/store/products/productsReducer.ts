import type { Product, ProductStatus } from '../../models/Product';
import { initialProducts } from '../../data/products';

export type ProductsState = {
    products: Product[];
};

export type ProductsAction =
    | {
    type: 'CREATE_PRODUCT';
    payload: Product;
}
    | {
    type: 'UPDATE_PRODUCT';
    payload: Product;
}
    | {
    type: 'DELETE_PRODUCT';
    payload: Product['id'];
}
    | {
    type: 'UPDATE_PRODUCT_STATUS';
    payload: {
        productId: Product['id'];
        status: ProductStatus;
    };
}
    | {
    type: 'CLEAR_PRODUCTS';
};

export const initialProductsState: ProductsState = {
    products: initialProducts,
};

export function productsReducer(
    state: ProductsState,
    action: ProductsAction,
): ProductsState {
    switch (action.type) {
        case 'CREATE_PRODUCT': {
            return {
                ...state,
                products: [action.payload, ...state.products],
            };
        }

        case 'UPDATE_PRODUCT': {
            return {
                ...state,
                products: state.products.map((product) =>
                    product.id === action.payload.id ? action.payload : product,
                ),
            };
        }

        case 'DELETE_PRODUCT': {
            return {
                ...state,
                products: state.products.filter(
                    (product) => product.id !== action.payload,
                ),
            };
        }

        case 'UPDATE_PRODUCT_STATUS': {
            return {
                ...state,
                products: state.products.map((product) =>
                    product.id === action.payload.productId
                        ? {
                            ...product,
                            status: action.payload.status,
                            isVerified: action.payload.status === 'approved',
                            isPublished: action.payload.status === 'approved',
                            updatedAt: new Date().toISOString(),
                        }
                        : product,
                ),
            };
        }

        case 'CLEAR_PRODUCTS': {
            return initialProductsState;
        }

        default: {
            return state;
        }
    }
}
