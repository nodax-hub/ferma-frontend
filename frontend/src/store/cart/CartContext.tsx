/* eslint-disable react-refresh/only-export-components */
import {
    createContext,
    useContext,
    useMemo,
    useReducer,
    type ReactNode,
} from 'react';

import type { Product } from '../../models/Product';
import {
    cartReducer,
    initialCartState,
    type CartState,
} from './cartReducer';

type CartContextValue = {
    state: CartState;
    addProduct: (product: Product, maxQuantity: number) => void;
    removeProduct: (productId: Product['id']) => void;
    increaseQuantity: (
        productId: Product['id'],
        maxQuantity: number,
    ) => void;
    decreaseQuantity: (productId: Product['id']) => void;
    clearCart: () => void;
    getProductQuantity: (productId: Product['id']) => number;
    totalPrice: number;
    totalQuantity: number;
};

const CartContext = createContext<CartContextValue | null>(null);

type CartProviderProps = {
    children: ReactNode;
};

export function CartProvider({ children }: CartProviderProps) {
    const [state, dispatch] = useReducer(
        cartReducer,
        initialCartState,
    );

    const totalPrice = useMemo(() => {
        return state.items.reduce((sum, item) => {
            return sum + item.product.price * item.quantity;
        }, 0);
    }, [state.items]);

    const totalQuantity = useMemo(() => {
        return state.items.reduce((sum, item) => {
            return sum + item.quantity;
        }, 0);
    }, [state.items]);

    const getProductQuantity = (productId: Product['id']) => {
        const item = state.items.find((cartItem) => {
            return cartItem.product.id === productId;
        });

        return item?.quantity ?? 0;
    };

    const value: CartContextValue = {
        state,

        addProduct: (product, maxQuantity) => {
            dispatch({
                type: 'ADD_PRODUCT',
                payload: {
                    product,
                    maxQuantity,
                },
            });
        },

        removeProduct: (productId) => {
            dispatch({
                type: 'REMOVE_PRODUCT',
                payload: productId,
            });
        },

        increaseQuantity: (productId, maxQuantity) => {
            dispatch({
                type: 'INCREASE_QUANTITY',
                payload: {
                    productId,
                    maxQuantity,
                },
            });
        },

        decreaseQuantity: (productId) => {
            dispatch({
                type: 'DECREASE_QUANTITY',
                payload: productId,
            });
        },

        clearCart: () => {
            dispatch({
                type: 'CLEAR_CART',
            });
        },

        getProductQuantity,
        totalPrice,
        totalQuantity,
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);

    if (!context) {
        throw new Error('useCart must be used inside CartProvider');
    }

    return context;
}
