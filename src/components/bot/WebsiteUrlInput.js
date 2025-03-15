import { useState } from 'react';;

export default function WebsiteUrlInput({ initialUrl = '' }) {
  const [url, setUrl] = useState(initialUrl);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');

  const handleSaveUrl = async () => {
    setError('');

    if (!url) {
      setError('Website URL is required');
      return;
    }

    try {
      new URL(url);
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    setIsValidating(true);
    try {
      const response = await fetch('/api/documents/save-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to save website URL');
      }

      const { document } = await response.json();
      setError('');
      setUrl('');
    } catch (error) {
      console.error('Scraping error:', error);
      setError(error.message);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Website URL</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="website-url" className="block text-sm font-medium text-gray-700 mb-1">
              Enter your website URL
            </label>
            <input
              type="text"
              id="website-url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-input focus:outline-none focus:ring-primary focus:border-primary"
              disabled={isValidating}
            />
            {error && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleSaveUrl}
              disabled={!url || isValidating}
              className="px-4 py-2 bg-primary text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 flex items-center"
            >
              {isValidating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </>
              ) : (
                'Save URL'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
