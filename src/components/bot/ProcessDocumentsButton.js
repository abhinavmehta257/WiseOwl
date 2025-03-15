import { useState } from 'react';

export default function ProcessDocumentsButton({ onProcessingComplete }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleProcessAll = async () => {
    setError('');
    setIsProcessing(true);

    try {
      const response = await fetch('/api/documents/process-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to process documents');
      }

      const result = await response.json();
      
      // Show error summary if there were any processing errors
      if (result.errors.length > 0) {
        setError(`${result.errors.length} document(s) failed to process. Check the console for details.`);
        console.error('Processing errors:', result.errors);
      }

      // Call the callback function with the results
      if (onProcessingComplete) {
        onProcessingComplete(result);
      }
    } catch (error) {
      console.error('Process all error:', error);
      setError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mt-4">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      <button
        onClick={handleProcessAll}
        disabled={isProcessing}
        className="w-full px-4 py-2 bg-primary text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 flex items-center justify-center"
      >
        {isProcessing ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Processing Documents...
          </>
        ) : (
          'Process All Documents'
        )}
      </button>
    </div>
  );
}
