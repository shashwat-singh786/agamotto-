import DeployButton from "@/components/deploy-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import HeaderAuth from "@/components/header-auth";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Link from "next/link";
import HomeLink from "@/components/home-link";
import { HeaderNav } from "@/components/header-nav";
import { GeminiFooter } from "@/components/gemini-footer";
import { Suspense } from "react";
import "./globals.css";
import "nprogress/nprogress.css";
import { NavigationEvents } from "@/components/navigation-events";
import NProgress from "nprogress";

// Configure NProgress to complete instantly
NProgress.configure({
  showSpinner: false,
  trickleSpeed: 1,
  minimum: 0.99,
  easing: 'ease',
  speed: 1
});

const defaultUrl = process.env.VERCEL_URL
	? `https://${process.env.VERCEL_URL}`
	: "http://localhost:3000";

export const metadata = {
	metadataBase: new URL(defaultUrl),
	title: "Agamotto",
	description: "Real-time workplace safety monitoring and analysis",
};

const geistSans = Geist({
	display: "swap",
	subsets: ["latin"],
});

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className={geistSans.className} suppressHydrationWarning>
			<body className="bg-slate-50 text-slate-900" suppressHydrationWarning>
				<Suspense fallback={null}>
					<NavigationEvents />
				</Suspense>
					<ThemeProvider
						attribute="class"
						defaultTheme="light"
						disableTransitionOnChange
					>
					<main className="min-h-screen flex flex-col items-center">
						<div className="flex-1 w-full flex flex-col items-center">
							<nav className="w-full flex justify-center bg-white border-b border-slate-200 shadow-sm h-16">
								<div className="w-full max-w-7xl flex justify-between items-center p-3 px-5 text-sm">
									<div className="flex items-center gap-8">
										<HomeLink />
										<HeaderNav />
									</div>
									<HeaderAuth />
								</div>
							</nav>
							<div className="w-full">
								{children}
							</div>
							<footer className="w-full bg-white border-t border-slate-200 p-8 flex justify-center">
								<GeminiFooter />
							</footer>
						</div>
					</main>
				</ThemeProvider>
			</body>
		</html>
	);
}
