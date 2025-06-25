// src/app/dashboard/conversations/[id]/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useConversations, ConversationMessage } from '@/lib/conversations';
import { useAuth } from '@/lib/auth';

export default function ConversationDetailPage() {
  const params = useParams();
  const conversationId = params.id as string;
  const router = useRouter();
  
  const { user, loading: authLoading } = useAuth();
  const { fetchConversationById, getConversationAudioUrl, downloadConversationAudio } = useConversations(); // Changed to getConversationAudioUrl
  
  const [conversation, setConversation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  
  useEffect(() => {
    if (user && !authLoading && conversationId) {
      loadConversation();
    }
  }, [user, authLoading, conversationId]);
  
  const loadConversation = async () => {
    setLoading(true);
    try {
      console.log('Loading conversation with ID:', conversationId);
      
      // Generate mock data for testing if the ID is "unknown"
      if (conversationId === 'unknown') {
        console.log('Generating mock data for unknown ID');
        setConversation({
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
        });
        setError('');
        setLoading(false);
        return;
      }
      
      const data = await fetchConversationById(conversationId);
      setConversation(data);
      setError('');
    } catch (err: any) {
      console.error('Error loading conversation:', err);
      
      // Provide more helpful error messages based on status codes
      if (err.message && err.message.includes('404')) {
        setError('Conversation not found. The conversation may have been deleted or you may not have permission to view it.');
      } else {
        setError(err.message || 'Failed to load conversation');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handlePlayAudio = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault(); // Prevent default button behavior (e.g., form submission or navigation)
    try {
      if (!audioRef.current) return;
      
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        return;
      }
      
      // For mock data, create a sample audio URL
      if (conversationId === 'unknown' || conversationId === 'mock-conversation') {
        console.log('Playing mock audio.');
        audioRef.current.src = 'https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav'; // A generic sample audio
        audioRef.current.play( )
          .then(() => {
            setIsPlaying(true);
          })
          .catch((error) => {
            console.error('Error playing sample audio:', error);
            setError('Failed to play sample audio');
            setIsPlaying(false);
          });
        return;
      }
      
      // For real data, use the API
      console.log('Attempting to stream real audio for conversationId:', conversationId);
      const audioStreamInfo = await getConversationAudioUrl(conversationId); // Get URL and headers
      console.log('Received audio stream info:', audioStreamInfo); // Check this log!
      
      // Fetch the audio as a Blob
      const response = await fetch(audioStreamInfo.url, {
        method: 'GET',
        headers: audioStreamInfo.headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.status} ${response.statusText}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      audioRef.current.src = audioUrl;
      
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((error) => {
          console.error('Error playing audio:', error);
          setError('Failed to play audio: ' + error.message);
          setIsPlaying(false);
        });
      
      // Clean up the Object URL when audio ends
      audioRef.current.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setIsPlaying(false);
      };
    } catch (err: any) {
      console.error('Error streaming audio:', err);
      setError(err.message || 'Failed to stream audio');
      setIsPlaying(false);
    }
  };
  
  const handleDownloadAudio = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault(); // Prevent default button behavior
    setIsDownloading(true);
    try {
      await downloadConversationAudio(
        conversationId, 
        `conversation-${conversation?.title || conversationId}.mp3`
      );
    } catch (err: any) {
      console.error('Error downloading audio:', err);
      setError(err.message || 'Failed to download audio');
    } finally {
      setIsDownloading(false);
    }
  };
  
  const handleGoBack = () => {
    router.push('/dashboard/conversations');
  };
  
  if (authLoading || loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <button
          onClick={handleGoBack}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Back to Conversations
        </button>
      </div>
    );
  }
  
  if (!conversation) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-xl text-gray-600">Conversation not found</p>
          <button
            onClick={handleGoBack}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Conversations
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={handleGoBack}
          className="text-blue-600 hover:text-blue-800"
        >
          &larr; Back to Conversations
        </button>
      </div>
      
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{conversation.title}</h1>
        <div className="text-gray-500">
          {conversation.date}
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-gray-600">
              Participants: {conversation.participants.join(', ')}
            </p>
            <p className="text-gray-600">
              Duration: {Math.floor(conversation.duration / 60)}:{(conversation.duration % 60).toString().padStart(2, '0')}
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handlePlayAudio}
              className={`px-4 py-2 ${isPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-md`}
            >
              {isPlaying ? 'Pause' : 'Play Audio'}
            </button>
            <button
              onClick={handleDownloadAudio}
              disabled={isDownloading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300"
            >
              {isDownloading ? 'Downloading...' : 'Download Audio'}
            </button>
          </div>
        </div>
        
        <audio ref={audioRef} className="hidden" />
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Conversation Transcript</h2>
        <div className="space-y-4">
          {conversation.messages && conversation.messages.length > 0 ? (
            conversation.messages.map((message: ConversationMessage) => (
              <div 
                key={message.id} 
                className={`flex ${message.sender === 'User' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-3/4 p-4 rounded-lg ${
                    message.sender === 'User' 
                      ? 'bg-blue-100 text-blue-900' 
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="font-semibold mb-1">
                    {message.sender === 'User' ? 'You' : message.sender}
                  </div>
                  <div>{message.text}</div>
                  <div className="text-xs text-gray-500 mt-1 text-right">
                    {message.timestamp}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">No messages in this conversation</p>
          )}
        </div>
      </div>
    </div>
  );
}
