import {
    createContext,
    useContext,
    useEffect,
    useReducer,
    type ReactNode,
} from 'react';

import {
    cancelOrderRequest,
    clearOrdersRequest,
    createOrderRequest,
    fetchOrders,
} from '../../api/client';
import type { Order } from '../../models/Order';
import {
    initialOrdersState,
    ordersReducer,
    type OrdersState,
} from './ordersReducer';

type OrdersContextValue = {
    state: OrdersState;
    createOrder: (order: Order) => Promise<Order>;
    cancelOrder: (orderId: Order['id']) => Promise<Order>;
    clearOrders: () => Promise<void>;
    reloadOrders: () => Promise<void>;
};

const OrdersContext = createContext<OrdersContextValue | null>(null);

type OrdersProviderProps = {
    children: ReactNode;
};

export function OrdersProvider({ children }: OrdersProviderProps) {
    const [state, dispatch] = useReducer(
        ordersReducer,
        initialOrdersState,
    );

    const reloadOrders = async () => {
        const orders = await fetchOrders();

        dispatch({
            type: 'SET_ORDERS',
            payload: orders,
        });
    };

    useEffect(() => {
        void reloadOrders();
    }, []);

    const value: OrdersContextValue = {
        state,

        createOrder: async (order) => {
            const createdOrder = await createOrderRequest(order);

            dispatch({
                type: 'CREATE_ORDER',
                payload: createdOrder,
            });

            return createdOrder;
        },

        cancelOrder: async (orderId) => {
            const updatedOrder = await cancelOrderRequest(orderId);

            dispatch({
                type: 'CANCEL_ORDER',
                payload: updatedOrder.id,
            });

            return updatedOrder;
        },

        clearOrders: async () => {
            await clearOrdersRequest();

            dispatch({
                type: 'CLEAR_ORDERS',
            });
        },

        reloadOrders,
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
