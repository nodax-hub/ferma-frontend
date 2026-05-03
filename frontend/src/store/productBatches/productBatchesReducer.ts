import type { ProductBatch } from '../../models/ProductBatch';
import type { Product } from '../../models/Product';

export type ProductBatchesState = {
    batches: ProductBatch[];
};

export type ProductBatchesAction =
    | {
    type: 'SET_BATCHES';
    payload: ProductBatch[];
}
    | {
    type: 'CREATE_BATCH';
    payload: ProductBatch;
}
    | {
    type: 'DELETE_BATCH';
    payload: ProductBatch['id'];
}
    | {
    type: 'DECREASE_PRODUCT_QUANTITY';
    payload: {
        productId: Product['id'];
        quantity: number;
    };
}
    | {
    type: 'CLEAR_BATCHES';
};

export const initialProductBatchesState: ProductBatchesState = {
    batches: [],
};

export function productBatchesReducer(
    state: ProductBatchesState,
    action: ProductBatchesAction,
): ProductBatchesState {
    switch (action.type) {
        case 'SET_BATCHES': {
            return {
                ...state,
                batches: action.payload,
            };
        }

        case 'CREATE_BATCH': {
            return {
                ...state,
                batches: [action.payload, ...state.batches],
            };
        }

        case 'DELETE_BATCH': {
            return {
                ...state,
                batches: state.batches.filter((batch) => batch.id !== action.payload),
            };
        }

        case 'DECREASE_PRODUCT_QUANTITY': {
            let quantityToWriteOff = action.payload.quantity;
            const now = new Date().toISOString();
            const sortedBatchIds = state.batches
                .filter(
                    (batch) =>
                        batch.productId === action.payload.productId &&
                        batch.quantity > 0,
                )
                .sort((firstBatch, secondBatch) =>
                    firstBatch.manufacturedAt.localeCompare(secondBatch.manufacturedAt),
                )
                .map((batch) => batch.id);

            return {
                ...state,
                batches: state.batches.map((batch) => {
                    if (
                        quantityToWriteOff <= 0 ||
                        !sortedBatchIds.includes(batch.id)
                    ) {
                        return batch;
                    }

                    const decreaseBy = Math.min(batch.quantity, quantityToWriteOff);
                    quantityToWriteOff -= decreaseBy;

                    return {
                        ...batch,
                        quantity: batch.quantity - decreaseBy,
                        updatedAt: now,
                    };
                }),
            };
        }

        case 'CLEAR_BATCHES': {
            return initialProductBatchesState;
        }

        default: {
            return state;
        }
    }
}
