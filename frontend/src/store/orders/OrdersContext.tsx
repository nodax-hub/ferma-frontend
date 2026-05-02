import {
    createContext,
    useContext,
    useEffect,
    useReducer,
    type ReactNode,
} from 'react';

import type { Order } from '../../models/Order';
import { StorageService } from '../../utils/storage';
import {
    initialOrdersState,
    ordersReducer,
    type OrdersState,
} from './ordersReducer';

const ORDERS_STORAGE_KEY = 'orders';

type OrdersContextValue = {
    state: OrdersState;
    createOrder: (order: Order) => void;
    cancelOrder: (orderId: Order['id']) => void;
    clearOrders: () => void;
};

const OrdersContext = createContext<OrdersContextValue | null>(null);

type OrdersProviderProps = {
    children: ReactNode;
};

export function OrdersProvider({ children }: OrdersProviderProps) {
    const [state, dispatch] = useReducer(
        ordersReducer,
        initialOrdersState,
        () => StorageService.getItem<OrdersState>(
            ORDERS_STORAGE_KEY,
            initialOrdersState,
        ),
    );

    useEffect(() => {
        StorageService.setItem(ORDERS_STORAGE_KEY, state);
    }, [state]);

    const value: OrdersContextValue = {
        state,

        createOrder: (order) => {
            dispatch({
                type: 'CREATE_ORDER',
                payload: order,
            });
        },

        cancelOrder: (orderId) => {
            dispatch({
                type: 'CANCEL_ORDER',
                payload: orderId,
            });
        },

        clearOrders: () => {
            dispatch({
                type: 'CLEAR_ORDERS',
            });
        },
    };

    return (
        <OrdersContext.Provider value={value}>
            {children}
        </OrdersContext.Provider>
    );
}

export function useOrders() {
    const context = useContext(OrdersContext);

    if (!context) {
        throw new Error('useOrders must be used inside OrdersProvider');
    }

    return context;
}