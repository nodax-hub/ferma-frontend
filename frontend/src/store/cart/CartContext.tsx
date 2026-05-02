import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useReducer,
    type ReactNode,
} from 'react';

import type { Product } from '../../models/Product';
import { StorageService } from '../../utils/storage';
import {
    cartReducer,
    initialCartState,
    type CartState,
} from './cartReducer';

const CART_STORAGE_KEY = 'cart';

type CartContextValue = {
    state: CartState;
    addProduct: (product: Product) => void;
    removeProduct: (productId: Product['id']) => void;
    increaseQuantity: (productId: Product['id']) => void;
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
        () => StorageService.getItem<CartState>(
            CART_STORAGE_KEY,
            initialCartState,
        ),
    );

    useEffect(() => {
        StorageService.setItem(CART_STORAGE_KEY, state);
    }, [state]);

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

        addProduct: (product) => {
            dispatch({
                type: 'ADD_PRODUCT',
                payload: product,
            });
        },

        removeProduct: (productId) => {
            dispatch({
                type: 'REMOVE_PRODUCT',
                payload: productId,
            });
        },

        increaseQuantity: (productId) => {
            dispatch({
                type: 'INCREASE_QUANTITY',
                payload: productId,
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