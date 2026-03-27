export interface Testimonial {
  platform: "instagram" | "tiktok";
  embedUrl: string;
  handle: string;
  quote: string;
}

// Replace these with real URLs from the clinic's social media
export const TESTIMONIALS: Testimonial[] = [
  {
    platform: "instagram",
    embedUrl: "https://www.instagram.com/reel/REPLACE_WITH_REAL_ID/",
    handle: "@skinmedspa_client1",
    quote: "My skin has never looked better after the HydraFacial!",
  },
  {
    platform: "tiktok",
    embedUrl: "https://www.tiktok.com/@REPLACE_WITH_REAL_HANDLE/video/REPLACE_WITH_REAL_ID",
    handle: "@skinmedspa_client2",
    quote: "Best facial experience in McKinney, hands down.",
  },
  {
    platform: "instagram",
    embedUrl: "https://www.instagram.com/reel/REPLACE_WITH_REAL_ID/",
    handle: "@skinmedspa_client3",
    quote: "Total transformation in just one session!",
  },
];
