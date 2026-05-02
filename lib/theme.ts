import type { DebtStatus } from "@/types/hisaab";

export const colors = {
  ink: "#080C10",
  inkSoft: "#19120A",
  mist: "#F0EDE8",
  muted: "rgba(240,237,232,0.45)",
  glass: "rgba(255,255,255,0.06)",
  glassBorder: "rgba(255,255,255,0.12)",
  glassPanel: "rgba(25,18,10,0.4)",
  surface: "#19120A",
  surfaceLow: "#211A12",
  surfaceMid: "#261E16",
  surfaceHigh: "#312920",
  surfaceHighest: "#3C332A",
  outline: "#A08E7A",
  amber: "#F5A320",
  amberSoft: "#FFC57C",
  settled: "#4ADE80",
  danger: "#FFB4AB",
  forgiven: "#A78BFA",
} as const;

export const statusMeta: Record<DebtStatus, { label: string; color: string; icon: string }> = {
  pending: { label: "Baaki", color: colors.amber, icon: "clock" },
  overdue: { label: "Overdue", color: colors.danger, icon: "alert" },
  settled: { label: "Chukta", color: colors.settled, icon: "check" },
  forgiven: { label: "Maaf kiya", color: colors.forgiven, icon: "sparkle" },
};

export const radii = {
  card: 12,
  sheet: 32,
  pill: 999,
} as const;

export const fonts = {
  display: "Cinzel_700Bold",
  displaySemi: "Cinzel_600SemiBold",
  body: "Montserrat_400Regular",
  bodyMedium: "Montserrat_500Medium",
  bodySemi: "Montserrat_600SemiBold",
  bodyBold: "Montserrat_700Bold",
} as const;

export const stitchBackground =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC0xyn3icZsdMsQf13xiokcEBdCW2U8yKL4yzLJIBlzZbjy3icS7N-NSjr3wewg_1Q_WwjsSAf_7zTyHificduSJ44cELr_zf0lcQkTOSzy57YbBeBffSM7Noq9ybKhWYGhsiv6j6FYQ14rjqDRJsMTsHgRIRb7--DGEx7Y--a_jiHGyxqK_zWeAUtxCgLgk1dye4RA08DT3hL04noyz32lS8zmmbwtvYkH1q2672AZVHiezCnp-DpUPJhWuD5N1T5Zh1w8gnYtjQ";
