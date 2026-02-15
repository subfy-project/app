const fallbackSiteUrl = "http://localhost:3000";

function normalizeSiteUrl(value: string | undefined): string {
  if (!value) return fallbackSiteUrl;
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export const SITE_NAME = "Subfy";
export const SITE_DESCRIPTION =
  "Subfy helps you launch and manage onchain subscription plans on Stellar.";
export const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
export const OG_IMAGE_PATH = "/header.png";
