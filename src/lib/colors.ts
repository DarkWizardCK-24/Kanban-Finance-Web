// ── Dark Vault Palette ──────────────────────────────────────────────────────
export const AppColors = {
  darkBg: "#090E1A",
  darkSurface: "#111827",
  darkCard: "#141E30",
  darkCardAlt: "#1A2438",
  darkBorder: "#253450",
  darkDivider: "#1E2B42",

  textPrimary: "#F0F4FF",
  textSecondary: "#8B9DC3",
  textHint: "#4A5B7A",
  textMuted: "#2E3D5A",

  accentCyan: "#4FC3F7",
  accentGold: "#FFD54F",
  accentGreen: "#4ADE80",
  accentAmber: "#FBBF24",
  accentRed: "#F87171",
  accentPurple: "#A78BFA",
  primaryBlue: "#3B82F6",

  lightGreen: "#0A1F12",
  lightAmber: "#1F1508",
  lightCyan: "#091E2A",

  kanbanPending: "#1A1200",
  kanbanProcessing: "#001525",
  kanbanCompleted: "#001A0E",
  kanbanFailed: "#1A0606",

  success: "#4ADE80",
  warning: "#FBBF24",
  error: "#F87171",
  info: "#4FC3F7",
};

// ── Bank Brand Gradients ────────────────────────────────────────────────────
type Gradient = readonly [string, string];

export const BankGradients = {
  sbi:      ["#1565C0", "#42A5F5"] as Gradient,
  boi:      ["#0D47A1", "#1A237E"] as Gradient,
  hdfc:     ["#0D1B5E", "#991B1B"] as Gradient,
  kotak:    ["#7F1D1D", "#450A0A"] as Gradient,
  idfc:     ["#DC2626", "#991B1B"] as Gradient,
  axis:     ["#4C1D95", "#831843"] as Gradient,
  icici:    ["#991B1B", "#4C1D95"] as Gradient,
  pnb:      ["#14532D", "#134E4A"] as Gradient,
  canara:   ["#3730A3", "#1E1B4B"] as Gradient,
  union:    ["#134E4A", "#065F46"] as Gradient,
  yesBank:  ["#1D4ED8", "#1E3A8A"] as Gradient,
  indusInd: ["#5B21B6", "#3730A3"] as Gradient,
  postal:   ["#166534", "#365314"] as Gradient,
  rbl:      ["#B45309", "#7C2D12"] as Gradient,
  federal:  ["#1E40AF", "#1D4ED8"] as Gradient,
  bandhan:  ["#065F46", "#164E63"] as Gradient,
  bobalt:   ["#4E342E", "#1E3A8A"] as Gradient,
  citi:     ["#1E3A8A", "#164E63"] as Gradient,
  standard: ["#1C1917", "#292524"] as Gradient,
  dbs:      ["#7F1D1D", "#991B1B"] as Gradient,
} as const;

export const CategoryGradients = {
  savings:        ["#14532D", "#166534"] as Gradient,
  expenses:       ["#7C2D12", "#B45309"] as Gradient,
  fixed:          ["#134E4A", "#065F46"] as Gradient,
  current:        ["#1E3A8A", "#1D4ED8"] as Gradient,
  salary:         ["#1E1B4B", "#3730A3"] as Gradient,
  recurring:      ["#164E63", "#0C4A6E"] as Gradient,
  nri:            ["#4C1D95", "#5B21B6"] as Gradient,
  business:       ["#1C1917", "#292524"] as Gradient,
  postalSavings:  ["#166534", "#365314"] as Gradient,
} as const;

export function bankGradientFor(bankName: string): Gradient | null {
  const n = bankName.toLowerCase();
  if (n.includes("sbi") || n.includes("state bank")) return BankGradients.sbi;
  if (n.includes("boi") || (n.includes("bank of india") && !n.includes("baroda"))) return BankGradients.boi;
  if (n.includes("hdfc")) return BankGradients.hdfc;
  if (n.includes("kotak")) return BankGradients.kotak;
  if (n.includes("idfc")) return BankGradients.idfc;
  if (n.includes("axis")) return BankGradients.axis;
  if (n.includes("icici")) return BankGradients.icici;
  if (n.includes("pnb") || n.includes("punjab national")) return BankGradients.pnb;
  if (n.includes("canara")) return BankGradients.canara;
  if (n.includes("union bank")) return BankGradients.union;
  if (n.includes("yes bank") || n.includes("yesbank")) return BankGradients.yesBank;
  if (n.includes("indusind") || n.includes("indus ind")) return BankGradients.indusInd;
  if (
    n.includes("post office") || n.includes("postal") || n.includes("ippb") ||
    n.includes("india post") || n.includes("posb") ||
    (n.startsWith("post") && n.length < 20) ||
    (n.includes("post") && (n.includes("saving") || n.includes("bank") || n.includes("office")))
  ) return BankGradients.postal;
  if (n.includes("rbl")) return BankGradients.rbl;
  if (n.includes("federal")) return BankGradients.federal;
  if (n.includes("bandhan")) return BankGradients.bandhan;
  if (n.includes("baroda") || n.includes("bob")) return BankGradients.bobalt;
  if (n.includes("citi")) return BankGradients.citi;
  if (n.includes("standard") || n.includes("stanchart") || n.includes("chartered")) return BankGradients.standard;
  if (n.includes("dbs")) return BankGradients.dbs;
  return null;
}
