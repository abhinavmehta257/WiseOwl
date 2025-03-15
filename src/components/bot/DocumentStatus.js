import { useState, useEffect } from 'react';

export default function DocumentStatus({ document }) {
  const [statusColor, setStatusColor] = useState('');
  const [statusText, setStatusText] = useState('');

  useEffect(() => {
    switch (document.status) {
      case 'pending':
        setStatusColor('bg-yellow-100 text-yellow-800');
        setStatusText('Pending Processing');
        break;
      case 'processing':
        setStatusColor('bg-blue-100 text-blue-800');
        setStatusText('Processing...');
        break;
      case 'completed':
        setStatusColor('bg-green-100 text-green-800');
        setStatusText('Completed');
        break;
      case 'error':
        setStatusColor('bg-red-100 text-red-800');
        setStatusText('Error');
        break;
      default:
        setStatusColor('bg-gray-100 text-gray-800');
        setStatusText('Unknown');
    }
  }, [document.status]);

  return (
    <div className="flex items-center space-x-2">
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColor}`}>
        {statusText}
      </span>
      {document.error && (
        <div className="group relative">
          <svg 
            className="w-4 h-4 text-red-500 cursor-help" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="hidden group-hover:block absolute z-10 w-48 p-2 mt-1 text-sm bg-red-50 border border-red-200 rounded-md">
            {document.error}
          </div>
        </div>
      )}
    </div>
  );
}
