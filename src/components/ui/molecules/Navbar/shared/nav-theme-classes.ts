export type NavTheme = "light" | "dark" | "transparent";

export const navThemeClasses: Record<NavTheme, string> = {
	transparent: "bg-black text-white",
	light:
		"border-b border-white/10 bg-black text-white shadow-lg shadow-black/40",
	dark: "border-b border-white/10 bg-black text-white shadow-lg shadow-black/40",
};
