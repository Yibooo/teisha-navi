import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { NavBar } from "@/components/NavBar";
import { ClerkProvider } from "@clerk/nextjs";
import { PostHogProvider } from "@/components/providers/PostHogProvider";
import { jaJP } from "@clerk/localizations";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "定借ナビ｜定期借地権マンションの資産価値を数値で確認",
  description:
    "定期借地権マンションの残存年数別の資産価値推移を、実際の取引データに基づいてグラフで可視化。将来価値シミュレーターで売り時もわかります。",
  openGraph: {
    title: "定借ナビ",
    description: "定期借地権マンションの資産価値を第三者視点で可視化",
    locale: "ja_JP",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      localization={jaJP}
      signInUrl="/sign-in"
      afterSignInUrl="/analytics"
      afterSignUpUrl="/analytics"
    >
      <html lang="ja" className={geist.variable}>
        <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
          <PostHogProvider>
            <ConvexClientProvider>
              <NavBar />
              <main>{children}</main>
              <footer className="border-t bg-white mt-16 py-8 text-center text-sm text-slate-400">
                <p>© 2025 定借ナビ｜掲載データは参考情報です。投資判断は専門家にご相談ください。</p>
              </footer>
            </ConvexClientProvider>
          </PostHogProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
