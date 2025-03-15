import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import DocumentStatus from './DocumentStatus';

export default function DocumentList({ onRefresh }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [filter, setFilter] = useState({ type: '', status: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteDocument = async (documentId) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/documents/delete?documentId=${documentId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      // Remove the document from the list
      setDocuments(prev => prev.filter(doc => doc._id !== documentId));
      setError('');
      
      // Call the refresh callback if provided
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      setError('Failed to delete document');
      console.error('Delete error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchDocuments = async (pageNum = 1) => {
    try {
      const params = new URLSearchParams({
        page: pageNum,
        limit: 10,
        ...filter
      });

      const response = await fetch(`/api/documents/list?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      const data = await response.json();
      
      if (pageNum === 1) {
        setDocuments(data.documents);
      } else {
        setDocuments(prev => [...prev, ...data.documents]);
      }
      
      setHasMore(data.pagination.hasMore);
      setError('');
    } catch (err) {
      setError('Failed to load documents');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchDocuments(1);
  }, [filter]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchDocuments(nextPage);
  };

  const getTypeIcon = (type) => {
    if (type === 'file') {
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    }
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Documents</h2>
        
        {/* Filters */}
        <div className="flex gap-4">
          <select
            value={filter.type}
            onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value }))}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All Types</option>
            <option value="file">Files</option>
            <option value="website">Websites</option>
          </select>
          
          <select
            value={filter.status}
            onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="error">Error</option>
          </select>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && documents.length === 0 ? (
        <div className="text-center py-12">
          <svg className="animate-spin h-8 w-8 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No documents found</p>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-gray-200">
            {documents.map((doc) => (
              <li key={doc._id} className="py-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 text-gray-400">
                    {getTypeIcon(doc.type)}
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{doc.title}</p>
                      <div className="flex items-center space-x-4">
                        <DocumentStatus document={doc} />
                        <button
                          onClick={() => deleteDocument(doc._id)}
                          disabled={isDeleting}
                          className="text-sm text-gray-400 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="mt-1 text-sm text-gray-500 flex items-center gap-4">
                      <span>Added {format(new Date(doc.createdAt), 'MMM d, yyyy')}</span>
                      {doc.type === 'website' && doc.originalUrl && (
                        <a 
                          href={doc.originalUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          View Source
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Load more button */}
          {hasMore && (
            <div className="mt-6">
              <button
                onClick={loadMore}
                className="w-full px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Load More
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
