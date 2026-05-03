import type { Product, ProductStatus } from '../../models/Product';

export type ProductsState = {
    products: Product[];
};

export type ProductsAction =
    | {
    type: 'SET_PRODUCTS';
    payload: Product[];
}
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
    products: [],
};

export function productsReducer(
    state: ProductsState,
    action: ProductsAction,
): ProductsState {
    switch (action.type) {
        case 'SET_PRODUCTS': {
            return {
                ...state,
                products: action.payload,
            };
        }

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
