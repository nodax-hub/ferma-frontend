/* eslint-disable react-refresh/only-export-components */
import {
    createContext,
    useContext,
    useEffect,
    useReducer,
    type ReactNode,
} from 'react';

import {
    createProductBatchRequest,
    decreaseProductQuantityRequest,
    deleteProductBatchRequest,
    fetchProductBatches,
} from '../../api/client';
import type { Product } from '../../models/Product';
import type { ProductBatch } from '../../models/ProductBatch';
import { useAuth } from '../auth/AuthContext';
import {
    initialProductBatchesState,
    productBatchesReducer,
    type ProductBatchesState,
} from './productBatchesReducer';

type ProductBatchesContextValue = {
    state: ProductBatchesState;
    createBatch: (batch: ProductBatch) => Promise<ProductBatch>;
    deleteBatch: (batchId: ProductBatch['id']) => Promise<void>;
    decreaseProductQuantity: (
        productId: Product['id'],
        quantity: number,
    ) => Promise<void>;
    getProductQuantity: (productId: Product['id']) => number;
    getProductBatches: (productId: Product['id']) => ProductBatch[];
    reloadBatches: () => Promise<void>;
};

const ProductBatchesContext =
    createContext<ProductBatchesContextValue | null>(null);

type ProductBatchesProviderProps = {
    children: ReactNode;
};

export function ProductBatchesProvider({
    children,
}: ProductBatchesProviderProps) {
    const { token } = useAuth();
    const [state, dispatch] = useReducer(
        productBatchesReducer,
        initialProductBatchesState,
    );

    const reloadBatches = async () => {
        const batches = await fetchProductBatches();

        dispatch({
            type: 'SET_BATCHES',
            payload: batches,
        });
    };

    useEffect(() => {
        void reloadBatches();
    }, []);

    const getProductBatches = (productId: Product['id']) =>
        state.batches.filter((batch) => batch.productId === productId);

    const getProductQuantity = (productId: Product['id']) =>
        getProductBatches(productId).reduce(
            (total, batch) => total + batch.quantity,
            0,
        );

    const value: ProductBatchesContextValue = {
        state,

        createBatch: async (batch) => {
            if (!token) {
                throw new Error('Нужно войти в аккаунт продавца');
            }

            const createdBatch = await createProductBatchRequest(token, batch);

            dispatch({
                type: 'CREATE_BATCH',
                payload: createdBatch,
            });

            return createdBatch;
        },

        deleteBatch: async (batchId) => {
            if (!token) {
                throw new Error('Нужно войти в аккаунт продавца');
            }

            await deleteProductBatchRequest(token, batchId);

            dispatch({
                type: 'DELETE_BATCH',
                payload: batchId,
            });
        },

        decreaseProductQuantity: async (productId, quantity) => {
            const batches = await decreaseProductQuantityRequest(productId, quantity);

            dispatch({
                type: 'SET_BATCHES',
                payload: batches,
            });
        },

        getProductQuantity,
        getProductBatches,
        reloadBatches,
    };

    return (
        <ProductBatchesContext.Provider value={value}>
            {children}
        </ProductBatchesContext.Provider>
    );
}

export function useProductBatches() {
    const context = useContext(ProductBatchesContext);

    if (!context) {
        throw new Error(
            'useProductBatches must be used inside ProductBatchesProvider',
        );
    }

    return context;
}
