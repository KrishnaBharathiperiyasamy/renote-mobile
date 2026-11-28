export function formatInvoiceID(rawId) {
    if (!rawId) return "";
    return String(rawId).trim();
}

export function getNextInvoiceSequenceID(allInvoices = []) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const startYear = month >= 4 ? year : year - 1;
    const fyStr = `${String(startYear).slice(-2)}-${String(startYear + 1).slice(-2)}`;
    const prefix = `I/${fyStr}/`;

    let maxNum = 0;
    for (const inv of allInvoices) {
        const raw = inv?.invoiceID || inv?.invoiceLocalId || (typeof inv === "string" ? inv : "");
        if (raw && raw.startsWith(prefix)) {
            const parts = raw.split("/");
            const num = parseInt(parts[2], 10);
            if (!isNaN(num) && num > maxNum) {
                maxNum = num;
            }
        }
    }

    const nextNum = maxNum + 1;
    return `${prefix}${String(nextNum).padStart(4, "0")}`;
}
