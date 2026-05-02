export class StorageService {
    static getItem<T>(key: string, fallbackValue: T): T {
        try {
            const rawValue = localStorage.getItem(key);

            if (!rawValue) {
                return fallbackValue;
            }

            return JSON.parse(rawValue) as T;
        } catch {
            return fallbackValue;
        }
    }

    static setItem<T>(key: string, value: T): void {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch {
            // Пока ничего не делаем.
            // Например, localStorage может быть недоступен в приватном режиме.
        }
    }

    static removeItem(key: string): void {
        try {
            localStorage.removeItem(key);
        } catch {
            // Пока ничего не делаем.
        }
    }
}