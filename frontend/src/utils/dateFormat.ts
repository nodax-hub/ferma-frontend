const dateTimeFormatter = new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
});

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
});

export function formatDate(value?: string | null): string {
    const date = parseFiniteDate(value);

    return date ? dateTimeFormatter.format(date) : 'дата не указана';
}

export function formatDateOnly(value?: string | null): string {
    const date = parseFiniteDate(value);

    return date ? dateFormatter.format(date) : 'дата не указана';
}

export function addDaysToDate(value: string, days: number): Date | null {
    const date = parseFiniteDate(value);

    if (!date) {
        return null;
    }

    date.setDate(date.getDate() + days);

    return Number.isFinite(date.getTime()) ? date : null;
}

function parseFiniteDate(value?: string | null): Date | null {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    return Number.isFinite(date.getTime()) ? date : null;
}
