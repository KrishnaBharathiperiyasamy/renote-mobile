export function formatInvoiceID(rawId?: string | null): string {
    if (!rawId) return "";
    return String(rawId).trim();
}

export function formatEstimateID(rawId?: string | null): string {
    if (!rawId) return "";
    const str = String(rawId).trim();
    if (/^E\/\d{2}-\d{2}\/\d{4,}$/.test(str)) {
        return str;
    }
    const match = str.match(/^E(\d{2})(\d{2})(\d+)$/);
    if (match) {
        const [, yy, mm, seqStr] = match;
        const yearNum = 2000 + parseInt(yy, 10);
        const monthNum = parseInt(mm, 10);
        const startYear = monthNum >= 4 ? yearNum : yearNum - 1;
        const fyStr = `${String(startYear).slice(-2)}-${String(startYear + 1).slice(-2)}`;
        const seq = parseInt(seqStr, 10);
        return `E/${fyStr}/${String(seq).padStart(4, "0")}`;
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

export function getNextEstimateSequenceID(allEstimates: any[] = []): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const startYear = month >= 4 ? year : year - 1;
    const fyStr = `${String(startYear).slice(-2)}-${String(startYear + 1).slice(-2)}`;
    const prefix = `E/${fyStr}/`;

    let maxNum = 0;
    for (const est of allEstimates) {
        const raw = est?.estimateID || est?._id || (typeof est === "string" ? est : "");
        const formatted = formatEstimateID(raw);
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

export function numberToWords(num: number): string {
    if (isNaN(num) || num <= 0) return "Zero Rupees Only";
    const roundedTotal = Math.round(num);
    const rupees = Math.floor(roundedTotal);
    const paise = Math.round((num - Math.floor(num)) * 100);

    const a = [
        "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
        "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
    ];
    const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    function inWords(n: number): string {
        if (n < 20) return a[n];
        if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
        if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + inWords(n % 100) : "");
        if (n < 100000) return inWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + inWords(n % 1000) : "");
        if (n < 10000000) return inWords(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + inWords(n % 100000) : "");
        return inWords(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + inWords(n % 10000000) : "");
    }

    let result = inWords(rupees) + " Rupees";
    if (paise > 0) {
        result += " and " + inWords(paise) + " Paise";
    }
    return result + " Only";
}
