import companyData from "@data/global/company.json";

export const NAV_DRAWER_SOCIAL_KEYS = ["github", "linkedin", "instagram", "youtube", "facebook"] as const;

type SocialKey = (typeof NAV_DRAWER_SOCIAL_KEYS)[number];

const META: Record<SocialKey, { icon: string; label: string }> = {
	github: { icon: "ph ph-github-logo", label: "GitHub" },
	linkedin: { icon: "ph ph-linkedin-logo", label: "LinkedIn" },
	instagram: { icon: "ph ph-instagram-logo", label: "Instagram" },
	youtube: { icon: "ph ph-youtube-logo", label: "YouTube" },
	facebook: { icon: "ph ph-facebook-logo", label: "Facebook" },
};

export function getNavDrawerSocialLinks(): Array<{
	href: string;
	icon: string;
	label: string;
}> {
	const socials = companyData.socials as Record<string, string>;
	return NAV_DRAWER_SOCIAL_KEYS
		.filter((key) => socials[key]?.trim() && socials[key]?.trim() !== '#')
		.map((key) => ({
			href: socials[key]?.trim() || "#",
			icon: META[key].icon,
			label: META[key].label,
		}));
}
