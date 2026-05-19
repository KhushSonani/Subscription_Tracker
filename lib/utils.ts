import dayjs from "dayjs";
export const formatCurrency = (
    value: number,
    currency: string = "INR"
): string => {
    try {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency,
            currencyDisplay: "symbol",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
    } catch (error) {
        return `₹${value.toFixed(2)}`;
    }
};

export const formatSubscriptionDateTime = (value?: string): string => {
    if (!value) return "Not provided";
    const parsedDate = dayjs(value);
    return parsedDate.isValid() ? parsedDate.format("DD/MM/YYYY") : "Not provided";
};

export const formatStatusLabel = (value?: string): string => {
    if (!value) return "Unknown";
    return value.charAt(0).toUpperCase() + value.slice(1);
};