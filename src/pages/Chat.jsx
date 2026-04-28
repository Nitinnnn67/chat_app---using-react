import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import './Chat.css';

export default function Chat() {
  const { conversationId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState(null);
  const [otherUserName, setOtherUserName] = useState('User');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchMessages();
      const unsubscribe = subscribeToMessages();
      return unsubscribe;
    }
  }, [user, conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
      } else {
        setUser(user);
      }
    } catch (err) {
      console.error('Error getting user:', err);
      setError('Failed to get user');
      navigate('/');
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Get other user info
      const { data: convData, error: convError } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conversationId)
        .neq('user_id', user.id);

      if (convError) throw convError;

      if (convData && convData.length > 0) {
        const otherUserId = convData[0].user_id;
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', otherUserId)
            .single();
          
          if (profileData?.email) {
            setOtherUserName(profileData.email.split('@')[0]);
          }
        } catch (err) {
          console.error('Error fetching profile:', err);
          setOtherUserName(`User ${otherUserId.slice(0, 8)}`);
        }
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages');
    }
  };

  const subscribeToMessages = () => {
    const subscription = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log('New message received:', payload);
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      subscription.unsubscribe();
    };
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const { error } = await supabase.from('messages').insert([
        {
          conversation_id: conversationId,
          sender_id: user.id,
          content: newMessage.trim(),
        },
      ]);

      if (error) throw error;
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleBack = () => {
    navigate('/chats');
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <button className="back-btn" onClick={handleBack}>
          ← Back
        </button>
        <h2>{otherUserName || 'Chat'}</h2>
      </div>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      <div className="messages-list">
        {messages.length === 0 ? (
          <p className="no-messages">No messages yet. Start the conversation!</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`message ${msg.sender_id === user?.id ? 'sent' : 'received'}`}
            >
              <p>{msg.content}</p>
              <span className="timestamp">
                {new Date(msg.created_at).toLocaleTimeString()}
              </span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="message-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={!user}
        />
        <button type="submit" disabled={!newMessage.trim() || !user}>
          Send
        </button>
      </form>
    </div>
  );
}
