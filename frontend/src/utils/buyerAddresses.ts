export type BuyerAddress = {
    id: string;
    label: string;
    value: string;
    isSelected: boolean;
};

const BUYER_ADDRESSES_STORAGE_KEY = 'buyer-addresses';

export function loadBuyerAddresses(): BuyerAddress[] {
    const rawValue = localStorage.getItem(BUYER_ADDRESSES_STORAGE_KEY);

    if (!rawValue) {
        return [];
    }

    try {
        const parsed = JSON.parse(rawValue);

        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed.filter(isBuyerAddress);
    } catch {
        return [];
    }
}

export function saveBuyerAddresses(addresses: BuyerAddress[]): void {
    localStorage.setItem(BUYER_ADDRESSES_STORAGE_KEY, JSON.stringify(addresses));
}

export function getSelectedBuyerAddress(): BuyerAddress | null {
    return loadBuyerAddresses().find((address) => address.isSelected) ?? null;
}

function isBuyerAddress(value: unknown): value is BuyerAddress {
    if (typeof value !== 'object' || value === null) {
        return false;
    }

    const address = value as BuyerAddress;

    return (
        typeof address.id === 'string' &&
        typeof address.label === 'string' &&
        typeof address.value === 'string' &&
        typeof address.isSelected === 'boolean'
    );
}
