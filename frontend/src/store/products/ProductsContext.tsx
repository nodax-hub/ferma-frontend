import {
    createContext,
    useContext,
    useEffect,
    useReducer,
    type ReactNode,
} from 'react';

import type { Product, ProductStatus } from '../../models/Product';
import { StorageService } from '../../utils/storage';
import {
    initialProductsState,
    productsReducer,
    type ProductsState,
} from './productsReducer';

const PRODUCTS_STORAGE_KEY = 'products';

type ProductsContextValue = {
    state: ProductsState;
    createProduct: (product: Product) => void;
    updateProduct: (product: Product) => void;
    deleteProduct: (productId: Product['id']) => void;
    updateProductStatus: (
        productId: Product['id'],
        status: ProductStatus,
    ) => void;
    clearProducts: () => void;
};

const ProductsContext = createContext<ProductsContextValue | null>(null);

type ProductsProviderProps = {
    children: ReactNode;
};

export function ProductsProvider({ children }: ProductsProviderProps) {
    const [state, dispatch] = useReducer(
        productsReducer,
        initialProductsState,
        () =>
            StorageService.getItem<ProductsState>(
                PRODUCTS_STORAGE_KEY,
                initialProductsState,
            ),
    );

    useEffect(() => {
        StorageService.setItem(PRODUCTS_STORAGE_KEY, state);
    }, [state]);

    const value: ProductsContextValue = {
        state,

        createProduct: (product) => {
            dispatch({
                type: 'CREATE_PRODUCT',
                payload: product,
            });
        },

        updateProduct: (product) => {
            dispatch({
                type: 'UPDATE_PRODUCT',
                payload: product,
            });
        },

        deleteProduct: (productId) => {
            dispatch({
                type: 'DELETE_PRODUCT',
                payload: productId,
            });
        },

        updateProductStatus: (productId, status) => {
            dispatch({
                type: 'UPDATE_PRODUCT_STATUS',
                payload: {
                    productId,
                    status,
                },
            });
        },

        clearProducts: () => {
            dispatch({
                type: 'CLEAR_PRODUCTS',
            });
        },
    };

    return (
        <ProductsContext.Provider value={value}>
            {children}
        </ProductsContext.Provider>
    );
}

export function useProducts() {
    const context = useContext(ProductsContext);

    if (!context) {
        throw new Error('useProducts must be used inside ProductsProvider');
    }

    return context;
}
