// src/app/dashboard/conversations/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useConversations, Conversation } from '@/lib/conversations';
import { useAuth } from '@/lib/auth';
import { useApiKeyManagement } from '@/lib/apiKeys';

const CONVERSATIONS_PER_PAGE = 12; // Define the number of conversations per page

export default function ConversationsPage() {
  const { user, loading: authLoading } = useAuth();
  const { fetchConversations } = useConversations();
  const { getApiKey } = useApiKeyManagement();
  const router = useRouter();

  const [allConversations, setAllConversations] = useState<Conversation[]>([]); // Stores all fetched conversations
  const [displayedConversations, setDisplayedConversations] = useState<Conversation[]>([]); // Conversations for the current page
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [agentId, setAgentId] = useState('');
  const [apiKeyStatus, setApiKeyStatus] = useState<string | null>(null);

  // Effect to fetch all conversations from the API
  useEffect(() => {
    if (user && !authLoading) {
      checkApiKeyAndFetchConversations();
    }
  }, [user, authLoading]); // Re-fetch only when user or auth state changes

  // Effect to apply filtering and pagination whenever relevant states change
  useEffect(() => {
    applyPaginationAndFiltering();
  }, [page, searchQuery, agentId, allConversations]); // Re-apply when page, filters, or the full list of conversations changes

  const checkApiKeyAndFetchConversations = async () => {
    setLoading(true);
    setError('');
    setApiKeyStatus(null);
    try {
      const apiKeyData = await getApiKey(user?.uid || '');
      if (!apiKeyData || !apiKeyData.decryptedKey) {
        setApiKeyStatus('No ElevenLabs API key found. Please add it in your profile to view conversations.');
        setLoading(false);
        return;
      } else {
        setApiKeyStatus('API key found');
      }

      // Fetch ALL conversations from the API (as ElevenLabs API doesn't support server-side pagination for this endpoint)
      const data = await fetchConversations(agentId, 1, 1000, searchQuery); // Fetch a sufficiently large number
      setAllConversations(data.conversations); // Store all conversations
      
    } catch (err: any) {
      console.error('Error fetching conversations:', err);
      setError(err.message || 'Failed to fetch conversations. Please check your API key and try again.');
      setAllConversations([]); // Clear conversations on error
    } finally {
      setLoading(false);
    }
  };

  const applyPaginationAndFiltering = () => {
    let filtered = allConversations;

    // Apply search query filtering
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(conv => 
        (conv.title && conv.title.toLowerCase().includes(lowerCaseQuery)) ||
        (conv.participants && conv.participants.some(p => p.toLowerCase().includes(lowerCaseQuery)))
      );
    }

    // Apply agent ID filtering (assuming agentId is part of title or participants for now)
    if (agentId) {
      const lowerCaseAgentId = agentId.toLowerCase();
      filtered = filtered.filter(conv => 
        (conv.title && conv.title.toLowerCase().includes(lowerCaseAgentId)) ||
        (conv.participants && conv.participants.some(p => p.toLowerCase().includes(lowerCaseAgentId)))
      );
    }

    const totalFilteredConversations = filtered.length;
    const calculatedTotalPages = Math.ceil(totalFilteredConversations / CONVERSATIONS_PER_PAGE);
    setTotalPages(calculatedTotalPages > 0 ? calculatedTotalPages : 1); // Ensure at least 1 page

    // Adjust current page if it's out of bounds after filtering
    if (page > calculatedTotalPages && calculatedTotalPages > 0) {
      setPage(calculatedTotalPages);
    } else if (page === 0 && calculatedTotalPages > 0) {
      setPage(1); // Reset to page 1 if page becomes 0
    }

    const startIndex = (page - 1) * CONVERSATIONS_PER_PAGE;
    const endIndex = startIndex + CONVERSATIONS_PER_PAGE;
    setDisplayedConversations(filtered.slice(startIndex, endIndex));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page on new search/filter
    // The applyPaginationAndFiltering effect will be triggered by the state changes
  };

  const handleViewConversation = (id: string) => {
    router.push(`/dashboard/conversations/${id}`);
  };

  // Test API Connection function (for debugging) - Keep this as is
  const testDirectApiCall = async () => {
    try {
      const apiKeyData = await getApiKey(user?.uid || '');
      if (!apiKeyData || !apiKeyData.decryptedKey) {
        console.error('No API key found for testing');
        setError('No API key found for testing');
        return;
      }
      
      console.log('Testing ElevenLabs API connection...');
      const response = await fetch('https://api.elevenlabs.io/v1/user', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'xi-api-key': apiKeyData.decryptedKey
        }
      } );
      
      console.log('Test API call status (user endpoint):', response.status);
      const userData = await response.json();
      console.log('Test API call response (user endpoint):', userData);
      
      if (response.ok) {
        console.log('User endpoint successful. Now testing conversations endpoint...');
        const convResponse = await fetch('https://api.elevenlabs.io/v1/convai/conversations', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'xi-api-key': apiKeyData.decryptedKey
          }
        } );
        
        console.log('Conversations API call status:', convResponse.status);
        const convText = await convResponse.text();
        console.log('Raw conversations API response:', convText);
        
        try {
          const convData = JSON.parse(convText);
          console.log('Parsed conversations data:', convData);
          if (convData.conversations && convData.conversations.length > 0) {
            setError('API connection successful. Conversations found in raw response.');
          } else {
            setError('API connection successful, but no conversations found in response.');
          }
        } catch (e) {
          console.error('Failed to parse conversations response as JSON:', e);
          setError('API connection successful, but conversations response is not valid JSON.');
        }
      } else {
        setError(`Failed to connect to ElevenLabs API (user endpoint): ${response.status} ${response.statusText}`);
      }
    } catch (err: any) {
      console.error('Test API call error:', err);
      setError(`Error during API test: ${err.message || 'Unknown error'}`);
    }
  };


  if (authLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading authentication...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Your Conversations</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <form onSubmit={handleSearchSubmit} className="flex-grow flex">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 flex-grow"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
            >
              Search
            </button>
          </form>
          <input
            type="text"
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            placeholder="Filter by Agent ID (optional)"
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={testDirectApiCall}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Test API Connection
          </button>
        </div>
      </div>

      {apiKeyStatus && apiKeyStatus !== 'API key found' && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          {apiKeyStatus}
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4">
          {[...Array(CONVERSATIONS_PER_PAGE)].map((_, i) => ( // Show skeleton loaders for CONVERSATIONS_PER_PAGE
            <div key={i} className="bg-white p-6 rounded-lg shadow-md animate-pulse h-24"></div>
          ))}
        </div>
      ) : (
        <>
          {displayedConversations.length > 0 ? ( // Use displayedConversations here
            <div className="grid grid-cols-1 gap-4">
              {displayedConversations.map((conversation) => ( // Use displayedConversations here
                <div
                  key={conversation.id} 
                  className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleViewConversation(conversation.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-semibold mb-2">{conversation.title}</h2>
                      <p className="text-gray-600 mb-1">
                        Participants: {conversation.participants.join(', ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500">{conversation.date}</p>
                      <p className="text-gray-500">
                        {Math.floor(conversation.duration / 60)}:{(conversation.duration % 60).toString().padStart(2, '0')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <p className="text-xl text-gray-600">No conversations found</p>
              {searchQuery && (
                <p className="mt-2 text-gray-500">
                  Try adjusting your search query or agent filter
                </p>
              )}
              {!searchQuery && !error && (
                <p className="mt-2 text-gray-500">
                  Make sure your ElevenLabs API key is correct and you have conversations in your account
                </p>
              )}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <nav className="inline-flex rounded-md shadow">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-l-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <div className="px-4 py-2 border-t border-b border-gray-300 bg-white text-gray-700">
                  Page {page} of {totalPages}

                  Page {page} of {totalPages}
                </div>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-r-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </>
      )}
    </div> // <-- Closing the main container div
  );
}
