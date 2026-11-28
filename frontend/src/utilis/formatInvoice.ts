export function formatInvoiceID(rawId?: string | null): string {
    if (!rawId) return "";
    const str = String(rawId).trim();

    // Already in new format I/26-27/0001
    if (/^I\/\d{2}-\d{2}\/\d{4,}$/.test(str)) {
        return str;
    }

    // Specific user legacy mappings
    const legacyMap: Record<string, string> = {
        "I2604002": "I/26-27/0001",
        "I2605001": "I/26-27/0002",
        "I2608001": "I/26-27/0003",
        "I2608002": "I/26-27/0004",
    };

    if (legacyMap[str]) {
        return legacyMap[str];
    }

    // Match old pattern like I2604002
    const match = str.match(/^I(\d{2})(\d{2})(\d+)$/);
    if (match) {
        const [, yy, mm, seqStr] = match;
        const yearNum = 2000 + parseInt(yy, 10);
        const monthNum = parseInt(mm, 10);
        const startYear = monthNum >= 4 ? yearNum : yearNum - 1;
        const fyStr = `${String(startYear).slice(-2)}-${String(startYear + 1).slice(-2)}`;
        const seq = parseInt(seqStr, 10);
        return `I/${fyStr}/${String(seq).padStart(4, "0")}`;
    }

    return str;
}

export function getNextInvoiceSequenceID(allInvoices: any[] = []): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const startYear = month >= 4 ? year : year - 1;
    const fyStr = `${String(startYear).slice(-2)}-${String(startYear + 1).slice(-2)}`;
    const prefix = `I/${fyStr}/`;

    let maxNum = 0;
    for (const inv of allInvoices) {
        const raw = inv?.invoiceID || inv?.invoiceLocalId || (typeof inv === "string" ? inv : "");
        const formatted = formatInvoiceID(raw);
        if (formatted.startsWith(prefix)) {
            const parts = formatted.split("/");
            const num = parseInt(parts[2], 10);
            if (!isNaN(num) && num > maxNum) {
                maxNum = num;
            }
        }
    }

    const nextNum = maxNum + 1;
    return `${prefix}${String(nextNum).padStart(4, "0")}`;
}
