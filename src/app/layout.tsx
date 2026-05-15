import type { Metadata, Viewport } from "next";
import { Geist_Mono, Vazirmatn } from "next/font/google";
import { PayLedgerProvider } from "@/components/pay-ledger-provider";
import { SessionProvider } from "@/components/session-provider";
import { RegisterServiceWorker } from "@/components/register-sw";
import { ThemeProvider } from "@/components/theme-provider";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

/** Vazirmatn — open font by the Vazir author; excellent Latin + Persian. */
const vazirmatn = Vazirmatn({
	subsets: ["arabic", "latin"],
	variable: "--font-vazir",
	display: "swap",
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	applicationName: "PayMay",
	title: {
		default: "PayMay",
		template: "%s · PayMay",
	},
	description:
		"Track daily payments, debts, and pending money with contacts and tags.",
	appleWebApp: {
		capable: true,
		title: "PayMay",
		statusBarStyle: "default",
	},
	formatDetection: {
		telephone: false,
	},
	icons: {
		icon: [{ url: "/paymay-icon.svg", type: "image/svg+xml" }],
		apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
	},
};

export const viewport: Viewport = {
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#fafafa" },
		{ media: "(prefers-color-scheme: dark)", color: "#09090b" },
	],
	width: "device-width",
	initialScale: 1,
	userScalable: false,
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			suppressHydrationWarning
			className={`${vazirmatn.variable} ${geistMono.variable} h-full antialiased`}
		>
			<body className="min-h-full flex flex-col bg-gradient-to-b from-zinc-50 to-zinc-100/80 text-foreground dark:from-zinc-950 dark:to-zinc-900">
				<ThemeProvider>
					<Analytics />
					<RegisterServiceWorker />
					<SessionProvider>
						<PayLedgerProvider>{children}</PayLedgerProvider>
					</SessionProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
