import type { CartItem } from '../../models/CartItem';
import type { Product } from '../../models/Product';

export type CartState = {
    items: CartItem[];
};

export type CartAction =
    | {
    type: 'ADD_PRODUCT';
    payload: Product;
}
    | {
    type: 'REMOVE_PRODUCT';
    payload: Product['id'];
}
    | {
    type: 'INCREASE_QUANTITY';
    payload: Product['id'];
}
    | {
    type: 'DECREASE_QUANTITY';
    payload: Product['id'];
}
    | {
    type: 'CLEAR_CART';
};

export const initialCartState: CartState = {
    items: [],
};

export function cartReducer(
    state: CartState,
    action: CartAction,
): CartState {
    switch (action.type) {
        case 'ADD_PRODUCT': {
            const existingItem = state.items.find(
                (item) => item.product.id === action.payload.id,
            );

            if (existingItem) {
                return {
                    ...state,
                    items: state.items.map((item) =>
                        item.product.id === action.payload.id
                            ? { ...item, quantity: item.quantity + 1 }
                            : item,
                    ),
                };
            }

            return {
                ...state,
                items: [
                    ...state.items,
                    {
                        product: action.payload,
                        quantity: 1,
                    },
                ],
            };
        }

        case 'REMOVE_PRODUCT': {
            return {
                ...state,
                items: state.items.filter(
                    (item) => item.product.id !== action.payload,
                ),
            };
        }

        case 'INCREASE_QUANTITY': {
            return {
                ...state,
                items: state.items.map((item) =>
                    item.product.id === action.payload
                        ? { ...item, quantity: item.quantity + 1 }
                        : item,
                ),
            };
        }

        case 'DECREASE_QUANTITY': {
            return {
                ...state,
                items: state.items
                    .map((item) =>
                        item.product.id === action.payload
                            ? { ...item, quantity: item.quantity - 1 }
                            : item,
                    )
                    .filter((item) => item.quantity > 0),
            };
        }

        case 'CLEAR_CART': {
            return initialCartState;
        }

        default: {
            return state;
        }
    }
}