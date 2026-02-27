/**
 * Utility for handling dates in Asia/Jakarta timezone
 */

const JAKARTA_TZ = 'Asia/Jakarta';

export function getJakartaDate(): Date {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: JAKARTA_TZ,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });

    const parts = formatter.formatToParts(now);
    const findPart = (type: string) => parts.find(p => p.type === type)?.value;

    const year = parseInt(findPart('year')!);
    const month = parseInt(findPart('month')!) - 1;
    const day = parseInt(findPart('day')!);
    const hour = parseInt(findPart('hour')!);
    const minute = parseInt(findPart('minute')!);
    const second = parseInt(findPart('second')!);

    return new Date(year, month, day, hour, minute, second);
}

export function formatJakarta(date: Date, type: 'full' | 'date' | 'yymmdd' = 'full'): string {
    const options: Intl.DateTimeFormatOptions = {
        timeZone: JAKARTA_TZ,
        hour12: false
    };

    if (type === 'full') {
        const formatter = new Intl.DateTimeFormat('en-GB', {
            ...options,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
        const parts = formatter.formatToParts(date);
        const f = (t: string) => parts.find(p => p.type === t)?.value;
        return `${f('year')}-${f('month')}-${f('day')} ${f('hour')}:${f('minute')}:${f('second')}`;
    }

    if (type === 'date') {
        const formatter = new Intl.DateTimeFormat('en-GB', {
            ...options,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
        const parts = formatter.formatToParts(date);
        const f = (t: string) => parts.find(p => p.type === t)?.value;
        return `${f('year')}-${f('month')}-${f('day')}`;
    }

    if (type === 'yymmdd') {
        const formatter = new Intl.DateTimeFormat('en-GB', {
            ...options,
            year: '2-digit',
            month: '2-digit',
            day: '2-digit',
        });
        const parts = formatter.formatToParts(date);
        const f = (t: string) => parts.find(p => p.type === t)?.value;
        return `${f('year')}${f('month')}${f('day')}`;
    }

    return date.toISOString();
}

/**
 * Returns current time in Jakarta as "YYYY-MM-DD HH:mm:ss"
 */
export function nowJakartaFull(): string {
    return formatJakarta(new Date(), 'full');
}

/**
 * Returns current date in Jakarta as "YYYY-MM-DD"
 */
export function nowJakartaDate(): string {
    return formatJakarta(new Date(), 'date');
}

/**
 * Returns current date in Jakarta as "YYMMDD"
 */
export function nowJakartaYYMMDD(): string {
    const d = getJakartaDate();
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yy}${mm}${dd}`;
}

/**
 * Formats a given Date into the e-Nome UI format (e.g. 14 Agu 2026 • 14:05 WIB) in Jakarta time
 */
export function formatJakartaUI(date: Date): string {
    return new Intl.DateTimeFormat("id-ID", {
        timeZone: JAKARTA_TZ,
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    }).format(date).replace(',', ' •') + " WIB";
}
