import type { Order } from '../../models/Order';

export type OrdersState = {
    orders: Order[];
};

export type OrdersAction =
    | {
    type: 'CREATE_ORDER';
    payload: Order;
}
    | {
    type: 'CANCEL_ORDER';
    payload: Order['id'];
}
    | {
    type: 'CLEAR_ORDERS';
};

export const initialOrdersState: OrdersState = {
    orders: [],
};

export function ordersReducer(
    state: OrdersState,
    action: OrdersAction,
): OrdersState {
    switch (action.type) {
        case 'CREATE_ORDER': {
            return {
                ...state,
                orders: [action.payload, ...state.orders],
            };
        }

        case 'CANCEL_ORDER': {
            return {
                ...state,
                orders: state.orders.map((order) =>
                    order.id === action.payload
                        ? {
                            ...order,
                            status: 'cancelled',
                        }
                        : order,
                ),
            };
        }

        case 'CLEAR_ORDERS': {
            return initialOrdersState;
        }

        default: {
            return state;
        }
    }
}