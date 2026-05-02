import type { Product } from '../../models/Product';
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
    type: 'DELETE_PRODUCT';
    payload: Product['id'];
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

        case 'DELETE_PRODUCT': {
            return {
                ...state,
                products: state.products.filter(
                    (product) => product.id !== action.payload,
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