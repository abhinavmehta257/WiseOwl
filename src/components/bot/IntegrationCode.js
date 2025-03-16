import { useState } from 'react';

export default function IntegrationCode({ botId, primaryColor }) {
  const [copied, setCopied] = useState(false);

  const integrationCode = `<script>
      window.wiseowlConfig = {
        botId: "${botId}",
        primaryColor: "${primaryColor}"
      };
    </script>
    <script src="${process.env.NEXT_PUBLIC_CDN_URL}chatbot.js" async></script>`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(integrationCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };



  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Integration Code</h2>
      <p className="text-gray-600 mb-4">
        Add the following code to your website's HTML, just before the closing {'</body>'} tag:
      </p>
      
      {/* Code block */}
      <div className="relative">
        <pre className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
          <code className="text-sm text-gray-800">{integrationCode}</code>
        </pre>
        
        {/* Copy button */}
        <button
          onClick={copyToClipboard}
          className="absolute top-2 right-2 px-3 py-1 text-sm bg-primary text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* Preview section */}
      {/* <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Preview</h3>
        <div className="border rounded-lg p-4 relative h-96">
          <div className="absolute bottom-4 right-4">
            <div
              className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity"
              style={{ backgroundColor: primaryColor }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
            </div>
          </div>
        </div>
      </div> */}

      {/* Instructions */}
      {/* <div className="mt-6 space-y-4">
        <h3 className="text-sm font-medium text-gray-700">Important Notes:</h3>
        <ul className="list-disc pl-5 text-sm text-gray-600 space-y-2">
          <li>Make sure to add the code just before the closing body tag for optimal loading.</li>
          <li>The chat widget will appear in the bottom-right corner of your website.</li>
          <li>The widget is responsive and works on both desktop and mobile devices.</li>
          <li>You can customize the appearance by modifying the primaryColor in the configuration.</li>
        </ul>
      </div> */}
    </div>
  );
}
