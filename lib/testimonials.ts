export interface Testimonial {
  platform: "instagram" | "tiktok";
  embedUrl: string;
  handle: string;
  quote: string;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    platform: "instagram",
    embedUrl: "https://www.instagram.com/p/C10OL4Noh_x/",
    handle: "@skinmedspalaser",
    quote: "Before & after — glowing skin speaks for itself.",
  },
  {
    platform: "instagram",
    embedUrl: "https://www.instagram.com/reel/DHCyMMLoyZn/",
    handle: "@skinmedspalaser",
    quote: "Watch the glow-up live on Instagram.",
  },
  {
    platform: "instagram",
    embedUrl: "https://www.instagram.com/reel/C432KPIRPqt/",
    handle: "@skinmedspalaser",
    quote: "Real client results — see the transformation!",
  },
];
