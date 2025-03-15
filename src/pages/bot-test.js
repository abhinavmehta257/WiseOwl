import Head from 'next/head';
import Script from 'next/script';

export default function BotTest() {
  return (
    <>
      <Head>
        <title>WiseOwl Chatbot Test</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="p-8">
        <h1 className="text-2xl font-bold mb-4">WiseOwl Chatbot Test Page</h1>
        <p className="text-gray-600 mb-4">The chatbot should appear in the bottom-right corner.</p>
        
        {/* Config script must load before chatbot.js */}
        <Script
          id="wiseowl-config"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.wiseowlConfig = {
                botId: "bot_1740554106240",
                url: "${process.env.NEXT_PUBLIC_BASE_URL}",	
              };
            `
          }}
        />
        
        {/* Load chatbot script after config is set */}
        <Script
          src="http://localhost:3000/cdn/chatbot.js"
          strategy="afterInteractive"
        />
      </main>
    </>
  );
}
