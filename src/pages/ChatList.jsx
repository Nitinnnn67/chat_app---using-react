import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import NewChatModal from '../components/NewChatModal';
import './ChatList.css';

export default function ChatList() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getUser();
  }, []);

  const getUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
      } else {
        setUser(user);
        fetchConversations(user.id);
      }
    } catch (err) {
      console.error('Error getting user:', err);
      navigate('/');
    }
  };

  const fetchConversations = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(
          `
          id,
          created_at,
          conversation_participants (
            user_id
          ),
          messages (
            content,
            created_at
          )
        `
        )
        .order('created_at', { referencedTable: 'messages', ascending: false });

      if (error) throw error;

      // Filter conversations where user is a participant
      const userConversations = data.filter((conv) =>
        conv.conversation_participants.some((p) => p.user_id === userId)
      );

      // Get last message and other participant info
      const enriched = await Promise.all(
        userConversations.map(async (conv) => {
          const otherUserId = conv.conversation_participants.find(
            (p) => p.user_id !== userId
          )?.user_id;

          let otherUserName = 'Unknown';
          if (otherUserId) {
            try {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('email')
                .eq('id', otherUserId)
                .single();
              otherUserName = profileData?.email?.split('@')[0] || 'Unknown';
            } catch {
              otherUserName = `User ${otherUserId.slice(0, 8)}`;
            }
          }

          const lastMessage = conv.messages[0]?.content || 'No messages yet';
          const lastMessageTime = conv.messages[0]?.created_at;
          
          return {
            ...conv,
            otherUserName,
            otherUserId,
            lastMessage,
            lastMessageTime,
          };
        })
      );

      setConversations(enriched);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  const handleOpenChat = (conversationId) => {
    navigate(`/chat/${conversationId}`);
  };

  const handleChatCreated = (conversationId) => {
    setShowNewChatModal(false);
    fetchConversations(user.id);
    navigate(`/chat/${conversationId}`);
  };

  if (loading) {
    return <div className="chat-list-container"><p>Loading...</p></div>;
  }

  return (
    <div className="chat-list-container">
      <div className="chat-list-header">
        <h1>Conversations</h1>
        <div className="header-actions">
          <button className="new-chat-btn" onClick={() => setShowNewChatModal(true)}>
            ➕ New Chat
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="conversations-list">
        {conversations.length === 0 ? (
          <p className="no-conversations">No conversations yet. Start a new chat!</p>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              className="conversation-row"
              onClick={() => handleOpenChat(conv.id)}
            >
              <div className="user-avatar-small">{conv.otherUserName?.[0]?.toUpperCase()}</div>
              <div className="conversation-info">
                <h3>{conv.otherUserName}</h3>
                <p>{conv.lastMessage}</p>
              </div>
              {conv.lastMessageTime && (
                <span className="timestamp">
                  {new Date(conv.lastMessageTime).toLocaleDateString([], { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </span>
              )}
            </div>
          ))
        )}
      </div>

      {showNewChatModal && (
        <NewChatModal
          user={user}
          onClose={() => setShowNewChatModal(false)}
          onChatCreated={handleChatCreated}
        />
      )}
    </div>
  );
}
