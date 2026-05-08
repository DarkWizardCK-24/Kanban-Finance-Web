const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

export const Formatters = {
  currency(amount: number): string {
    return inrFormatter.format(amount);
  },

  compactCurrency(amount: number): string {
    const n = Math.abs(amount);
    const sign = amount < 0 ? "-" : "";
    if (n >= 10_000_000) return `${sign}₹${(n / 10_000_000).toFixed(2)} Cr`;
    if (n >= 100_000)    return `${sign}₹${(n / 100_000).toFixed(2)} L`;
    if (n >= 1000)       return `${sign}₹${(n / 1000).toFixed(2)} K`;
    return inrFormatter.format(amount);
  },

  date(date: Date): string {
    return date.toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    });
  },

  monthYear(date: Date): string {
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = String(date.getFullYear()).slice(-2);
    return `${m}/${y}`;
  },

  dateTimeIST(date: Date): string {
    const ist = new Date(date.getTime() + (5.5 * 60 - date.getTimezoneOffset()) * 60_000);
    const day = String(ist.getDate()).padStart(2, "0");
    const month = ist.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
    const year = ist.getFullYear();
    let hours = ist.getHours();
    const minutes = String(ist.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${day} ${month} ${year} • ${String(hours).padStart(2, "0")}:${minutes} ${ampm} IST`;
  },

  timeAgo(date: Date): string {
    const diff = Date.now() - date.getTime();
    const sec = Math.floor(diff / 1000);
    const min = Math.floor(sec / 60);
    const hr = Math.floor(min / 60);
    const day = Math.floor(hr / 24);
    const mo = Math.floor(day / 30);
    const yr = Math.floor(day / 365);
    if (yr > 0) return `${yr}y ago`;
    if (mo > 0) return `${mo}mo ago`;
    if (day > 0) return `${day}d ago`;
    if (hr > 0) return `${hr}h ago`;
    if (min > 0) return `${min}m ago`;
    return "Just now";
  },
};
