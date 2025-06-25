// src/lib/conversations.ts
import { useAuth } from './auth';
import { useApiKeyManagement } from './apiKeys';

export interface Conversation {
  id: string;
  title: string;
  date: string;
  duration: number;
  participants: string[];
  messages?: ConversationMessage[];
}

export interface ConversationMessage {
  id: string;
  text: string;
  sender: string;
  timestamp: string;
}

export const useConversations = () => {
  const { user } = useAuth(); // Get the authenticated user from AuthContext
  const { getApiKey } = useApiKeyManagement();

  // Fetch all conversations for the current user
  // The agentId parameter here will now primarily come from the logged-in user's profile
  const fetchConversations = async (agentIdFromUser?: string, page = 1, limit = 10, searchQuery = '') => {
    try {
      console.log('Fetching conversations with params:', { agentIdFromUser, page, limit, searchQuery });
      
      // Get the API key for the current user
      const apiKeyData = await getApiKey(user?.uid || '');
      console.log('API key retrieved:', apiKeyData ? 'Yes (length: ' + apiKeyData.decryptedKey?.length + ')' : 'No');
      
      if (!apiKeyData || !apiKeyData.decryptedKey) {
        console.error('API key not found or could not be decrypted');
        throw new Error('API key not found or invalid');
      }

      // Construct the API URL
      let url = `https://api.elevenlabs.io/v1/convai/conversations`;
      
      // Use the agentIdFromUser if provided, otherwise the one from the user's profile
      const effectiveAgentId = agentIdFromUser || user?.elevenLabsAgentId;

      if (effectiveAgentId ) {
        url += `?agent_id=${encodeURIComponent(effectiveAgentId)}`;
      }
      
      console.log('Fetching from URL:', url);

      // Make the API request
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'xi-api-key': apiKeyData.decryptedKey
        }
      });

      console.log('API response status:', response.status);
      
      // Log the raw response for debugging
      const responseText = await response.text();
      console.log('Raw API response (list):', responseText);
      
      // Parse the response as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse API response as JSON:', e);
        throw new Error('Invalid API response format');
      }
      
      console.log('API response data structure (list):', Object.keys(data));

      if (!response.ok) {
        throw new Error(`Failed to fetch conversations: ${response.status} ${response.statusText}`);
      }

      // Process the conversations data
      const rawConversations = Array.isArray(data.conversations) ? data.conversations : [];

      const conversations = rawConversations.map((conv: any) => ({
        id: conv.conversation_id, // Map to conversation_id
        title: conv.agent_name || 'Untitled Conversation', // Use agent_name as title
        date: conv.start_time_unix_secs ? new Date(conv.start_time_unix_secs * 1000).toLocaleString() : new Date().toLocaleString(), // Convert Unix timestamp to Date
        duration: conv.call_duration_secs || 0, // Map to call_duration_secs
        participants: conv.agent_name ? ['User', conv.agent_name] : ['User', 'AI Agent'] // Infer participants
      }));

      return {
        conversations,
        totalCount: data.total_count || conversations.length,
        page: page,
        limit: limit
      };
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  };

  // Fetch a single conversation by ID
  const fetchConversationById = async (conversationId: string) => {
    try {
      console.log('Fetching conversation with ID:', conversationId);
      
      // Generate mock data for testing if the ID is "unknown"
      if (conversationId === 'unknown') {
        console.log('Generating mock data for unknown ID');
        return {
          id: 'mock-conversation',
          title: 'Sample Conversation',
          date: new Date().toLocaleString(),
          duration: 120, // 2 minutes
          participants: ['User', 'AI Assistant'],
          messages: [
            {
              id: 'msg1',
              text: 'Hello, how can I help you today?',
              sender: 'AI Assistant',
              timestamp: new Date(Date.now() - 60000).toLocaleString()
            },
            {
              id: 'msg2',
              text: 'I need information about your services.',
              sender: 'User',
              timestamp: new Date(Date.now() - 45000).toLocaleString()
            },
            {
              id: 'msg3',
              text: 'I\'d be happy to tell you about our services. We offer...',
              sender: 'AI Assistant',
              timestamp: new Date(Date.now() - 30000).toLocaleString()
            }
          ]
        };
      }
      
      // Get the API key for the current user
      const apiKeyData = await getApiKey(user?.uid || '');
      if (!apiKeyData || !apiKeyData.decryptedKey) {
        throw new Error('API key not found');
      }

      // Make the API request
      const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`, {
        method: 'GET',
        headers: {
          'xi-api-key': apiKeyData.decryptedKey
        }
      } );

      console.log('API response status (detail):', response.status);
      const responseText = await response.text();
      console.log('Raw API response (detail):', responseText);

      if (!response.ok) {
        throw new Error(`Failed to fetch conversation: ${response.status} ${response.statusText}`);
      }

      const data = JSON.parse(responseText);
      
      // Process the conversation data from the detailed API response
      const messages: ConversationMessage[] = (data.transcript || [])
        .filter((t: any) => t.message !== null) // Filter out messages with null content (e.g., tool calls)
        .map((t: any, index: number) => ({
          id: `msg-${index}-${t.time_in_call_secs}`, // Unique ID for each message
          text: t.message,
          sender: t.role === 'agent' ? (data.agent_name || 'AI Assistant') : 'User', // Map role to sender
          timestamp: t.time_in_call_secs ? new Date(data.metadata.start_time_unix_secs * 1000 + t.time_in_call_secs * 1000).toLocaleString() : new Date().toLocaleString() // Calculate timestamp
        }));

      return {
        id: data.conversation_id,
        title: data.agent_name || 'Untitled Conversation', // Use agent_name for title
        date: data.metadata?.start_time_unix_secs ? new Date(data.metadata.start_time_unix_secs * 1000).toLocaleString() : new Date().toLocaleString(),
        duration: data.metadata?.call_duration_secs || 0,
        participants: data.agent_name ? ['User', data.agent_name] : ['User', 'AI Agent'],
        messages: messages
      };
    } catch (error) {
      console.error('Error fetching conversation:', error);
      throw error;
    }
  };

  // Get the URL for streaming audio of a conversation
  const getConversationAudioUrl = async (conversationId: string) => {
    try {
      // Get the API key for the current user
      const apiKeyData = await getApiKey(user?.uid || '');
      if (!apiKeyData || !apiKeyData.decryptedKey) {
        throw new Error('API key not found');
      }

      // Return the URL and headers needed for streaming
      return {
        url: `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}/audio`,
        headers: {
          'xi-api-key': apiKeyData.decryptedKey
        }
      };
    } catch (error ) {
      console.error('Error getting audio URL:', error);
      throw error;
    }
  };

  // Stream audio for a conversation
  const streamConversationAudio = async (conversationId: string) => {
    try {
      return await getConversationAudioUrl(conversationId);
    } catch (error) {
      console.error('Error streaming audio:', error);
      throw error;
    }
  };

  // Download audio for a conversation
  const downloadConversationAudio = async (conversationId: string, fileName?: string) => {
    try {
      // Get the API key for the current user
      const apiKeyData = await getApiKey(user?.uid || '');
      if (!apiKeyData || !apiKeyData.decryptedKey) {
        throw new Error('API key not found');
      }

      // Make the API request
      const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${conversationId}/audio`, {
        method: 'GET',
        headers: {
          'xi-api-key': apiKeyData.decryptedKey
        }
      } );

      if (!response.ok) {
        throw new Error(`Failed to download audio: ${response.statusText}`);
      }

      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName || `conversation-${conversationId}.mp3`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading audio:', error);
      throw error;
    }
  };

  return {
    fetchConversations,
    fetchConversationById,
    getConversationAudioUrl,
    streamConversationAudio,
    downloadConversationAudio
  };
};
