/* eslint-disable react-refresh/only-export-components */
import {
    createContext,
    useContext,
    useEffect,
    useReducer,
    type ReactNode,
} from 'react';

import type { Product } from '../../models/Product';
import type { ProductBatch } from '../../models/ProductBatch';
import { StorageService } from '../../utils/storage';
import {
    initialProductBatchesState,
    productBatchesReducer,
    type ProductBatchesState,
} from './productBatchesReducer';

const PRODUCT_BATCHES_STORAGE_KEY = 'product-batches';

type ProductBatchesContextValue = {
    state: ProductBatchesState;
    createBatch: (batch: ProductBatch) => void;
    deleteBatch: (batchId: ProductBatch['id']) => void;
    decreaseProductQuantity: (
        productId: Product['id'],
        quantity: number,
    ) => void;
    getProductQuantity: (productId: Product['id']) => number;
    getProductBatches: (productId: Product['id']) => ProductBatch[];
    clearBatches: () => void;
};

const ProductBatchesContext =
    createContext<ProductBatchesContextValue | null>(null);

type ProductBatchesProviderProps = {
    children: ReactNode;
};

export function ProductBatchesProvider({
    children,
}: ProductBatchesProviderProps) {
    const [state, dispatch] = useReducer(
        productBatchesReducer,
        initialProductBatchesState,
        () =>
            StorageService.getItem<ProductBatchesState>(
                PRODUCT_BATCHES_STORAGE_KEY,
                initialProductBatchesState,
            ),
    );

    useEffect(() => {
        StorageService.setItem(PRODUCT_BATCHES_STORAGE_KEY, state);
    }, [state]);

    const getProductBatches = (productId: Product['id']) =>
        state.batches.filter((batch) => batch.productId === productId);

    const getProductQuantity = (productId: Product['id']) =>
        getProductBatches(productId).reduce(
            (total, batch) => total + batch.quantity,
            0,
        );

    const value: ProductBatchesContextValue = {
        state,

        createBatch: (batch) => {
            dispatch({
                type: 'CREATE_BATCH',
                payload: batch,
            });
        },

        deleteBatch: (batchId) => {
            dispatch({
                type: 'DELETE_BATCH',
                payload: batchId,
            });
        },

        decreaseProductQuantity: (productId, quantity) => {
            dispatch({
                type: 'DECREASE_PRODUCT_QUANTITY',
                payload: {
                    productId,
                    quantity,
                },
            });
        },

        getProductQuantity,
        getProductBatches,

        clearBatches: () => {
            dispatch({
                type: 'CLEAR_BATCHES',
            });
        },
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
