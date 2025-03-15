import { useState } from 'react';
import DocumentStatus from './DocumentStatus';

export default function LinksList({ links = [], documentId, onRefresh }) {
  const [savedUrls, setSavedUrls] = useState(new Set(
    links.filter(link => link.isSaved).map(link => link.url)
  ));
  const [error, setError] = useState('');

  const handleSaveUrl = async (link) => {
    try {
      const response = await fetch('/api/documents/save-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId,
          linkUrl: link.url,
          linkText: link.text
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to save URL');
      }

      await response.json();
      setSavedUrls(prev => new Set([...prev, link.url]));
      setError('');
      
      // Call the refresh callback if provided
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Save URL error:', error);
      setError(error.message);
    }
  };

  return (
    <div className="mt-4 bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Internal Links {links.length > 0 && `(${links.length})`}
      </h3>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
        {links.length === 0 ? (
          <p className="text-gray-500 text-sm">No links found</p>
        ) : (
          links.map((link, index) => (
            <div key={index} className="p-4 border rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-grow">
                  <p className="text-sm font-medium text-gray-900 break-all">
                    {link.url}
                  </p>
                  {link.text && link.text !== link.url && (
                    <p className="text-sm text-gray-500 break-all mt-1">
                      {link.text}
                    </p>
                  )}
                  {link.error && (
                    <p className="text-sm text-red-600 mt-1">
                      Error: {link.error}
                    </p>
                  )}
                </div>
                <div className="ml-4">
                  {savedUrls.has(link.url) ? (
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      Saved
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSaveUrl(link)}
                      className="px-3 py-1 text-sm bg-primary text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                      Save URL
                    </button>
                  )}
                </div>
                {link.documentId && (
                  <div className="mt-2">
                    <DocumentStatus document={{
                      status: link.processingStatus || 'pending',
                      error: link.error
                    }} />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
