export const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 0,
    }).format(amount);
};

export const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-CO", {
        day: "numeric",
        month: "short",
    });
};
