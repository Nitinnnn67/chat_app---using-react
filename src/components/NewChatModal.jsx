import { useState } from 'react';
import { supabase } from '../utils/supabase';
import './NewChatModal.css';

export default function NewChatModal({ user, onClose, onChatCreated }) {
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (email) => {
    setSearchEmail(email);
    setError('');
    setSelectedUser(null);

    if (!email.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const { data, error: searchError } = await supabase
        .rpc('search_users', { search_email: email });

      if (searchError) throw searchError;

      // Filter out current user
      const filteredResults = (data || []).filter(u => u.id !== user.id);
      
      setSearchResults(filteredResults);
      if (filteredResults && filteredResults.length === 0) {
        setError(`No users found with email containing "${email}"`);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Error searching for users. Check console for details.');
    } finally {
      setSearching(false);
    }
  };

  const handleCreateChat = async () => {
    if (!selectedUser) {
      setError('Please select a user to chat with');
      return;
    }

    setCreating(true);
    setError('');

    try {
      // Check if conversation already exists with this user
      const { data: existingConvs } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', selectedUser.id);

      let conversation = null;

      if (existingConvs && existingConvs.length > 0) {
        // Check if we're both in same conversation
        for (const participant of existingConvs) {
          const { data: convParticipants } = await supabase
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', participant.conversation_id);

          const userIds = convParticipants.map(p => p.user_id);
          if (userIds.includes(user.id)) {
            conversation = { id: participant.conversation_id };
            break;
          }
        }
      }

      // Create new conversation if doesn't exist
      if (!conversation) {
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert([{}])
          .select()
          .single();

        if (convError) throw convError;
        conversation = newConv;

        // Add current user
        const { error: p1Error } = await supabase
          .from('conversation_participants')
          .insert([{ conversation_id: conversation.id, user_id: user.id }]);

        if (p1Error) throw p1Error;

        // Add selected user
        const { error: p2Error } = await supabase
          .from('conversation_participants')
          .insert([{ conversation_id: conversation.id, user_id: selectedUser.id }]);

        if (p2Error) throw p2Error;
      }

      onChatCreated(conversation.id);
      onClose();
    } catch (err) {
      console.error('Create chat error:', err);
      setError(err.message || 'Failed to create chat');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Start a New Chat</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="search-section">
          <input
            type="email"
            value={searchEmail}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by email (e.g., john@example.com)"
            className="search-input"
            disabled={creating}
          />
          {searching && <p className="searching">Searching...</p>}
        </div>

        {searchResults.length > 0 && (
          <div className="results-section">
            <p className="section-title">Found Users:</p>
            <div className="users-list">
              {searchResults.map((u) => (
                <button
                  key={u.id}
                  className={`user-item ${selectedUser?.id === u.id ? 'selected' : ''}`}
                  onClick={() => setSelectedUser(u)}
                  disabled={creating}
                >
                  <div className="user-avatar">{u.email[0].toUpperCase()}</div>
                  <div className="user-info">
                    <p className="user-email">{u.email}</p>
                  </div>
                  {selectedUser?.id === u.id && <span className="checkmark">✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && <p className="error">{error}</p>}

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose} disabled={creating}>
            Cancel
          </button>
          <button
            className="start-chat-btn"
            onClick={handleCreateChat}
            disabled={!selectedUser || creating}
          >
            {creating ? 'Creating...' : 'Start Chat'}
          </button>
        </div>
      </div>
    </div>
  );
}
