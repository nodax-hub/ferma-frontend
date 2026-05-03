import {
    createContext,
    useContext,
    useEffect,
    useReducer,
    type ReactNode,
} from 'react';

import {
    createProductRequest,
    deleteProductRequest,
    fetchProducts,
    updateProductRequest,
    updateProductStatusRequest,
} from '../../api/client';
import type { Product, ProductStatus } from '../../models/Product';
import { useAuth } from '../auth/AuthContext';
import {
    initialProductsState,
    productsReducer,
    type ProductsState,
} from './productsReducer';

type ProductsContextValue = {
    state: ProductsState;
    createProduct: (product: Product) => Promise<Product>;
    updateProduct: (product: Product) => Promise<Product>;
    deleteProduct: (productId: Product['id']) => Promise<void>;
    updateProductStatus: (
        productId: Product['id'],
        status: ProductStatus,
    ) => Promise<Product>;
    reloadProducts: () => Promise<void>;
};

const ProductsContext = createContext<ProductsContextValue | null>(null);

type ProductsProviderProps = {
    children: ReactNode;
};

export function ProductsProvider({ children }: ProductsProviderProps) {
    const { token } = useAuth();
    const [state, dispatch] = useReducer(
        productsReducer,
        initialProductsState,
    );

    const reloadProducts = async () => {
        const products = await fetchProducts();

        dispatch({
            type: 'SET_PRODUCTS',
            payload: products,
        });
    };

    useEffect(() => {
        void reloadProducts();
    }, []);

    const value: ProductsContextValue = {
        state,

        createProduct: async (product) => {
            if (!token) {
                throw new Error('Нужно войти в аккаунт продавца');
            }

            const createdProduct = await createProductRequest(token, product);

            dispatch({
                type: 'CREATE_PRODUCT',
                payload: createdProduct,
            });

            return createdProduct;
        },

        updateProduct: async (product) => {
            if (!token) {
                throw new Error('Нужно войти в аккаунт продавца');
            }

            const updatedProduct = await updateProductRequest(
                token,
                product.id,
                product,
            );

            dispatch({
                type: 'UPDATE_PRODUCT',
                payload: updatedProduct,
            });

            return updatedProduct;
        },

        deleteProduct: async (productId) => {
            if (!token) {
                throw new Error('Нужно войти в аккаунт продавца');
            }

            await deleteProductRequest(token, productId);

            dispatch({
                type: 'DELETE_PRODUCT',
                payload: productId,
            });
        },

        updateProductStatus: async (productId, status) => {
            if (!token) {
                throw new Error('Нужно войти в аккаунт администратора');
            }

            const updatedProduct = await updateProductStatusRequest(
                token,
                productId,
                status,
            );

            dispatch({
                type: 'UPDATE_PRODUCT',
                payload: updatedProduct,
            });

            return updatedProduct;
        },

        reloadProducts,
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
