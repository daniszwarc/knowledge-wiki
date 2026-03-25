import "@/styles/globals.css";
import { Lora, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Layout from "@/components/Layout";
import { ChatProvider } from "@/contexts/ChatContext";

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export default function App({ Component, pageProps }) {
  return (
    <div className={`${lora.variable} ${inter.variable}`}>
      <ChatProvider>
        <Layout categories={pageProps.categories} currentConcept={pageProps.concept} searchIndex={pageProps.searchIndex}>
          <Component {...pageProps} />
        </Layout>
      </ChatProvider>
      <Analytics />
    </div>
  );
}
