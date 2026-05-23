import { Inter, Outfit } from "next/font/google";

export const interHeading = Inter({
    subsets: ["latin"],
    variable: "--font-heading",
    weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const outfit = Outfit({
    subsets: ["latin"],
    variable: "--font-sans",
    weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});
