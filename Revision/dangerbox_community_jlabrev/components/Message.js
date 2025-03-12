function Message({ message, reactions, onReaction, activeEmojiPicker, onToggleEmojiPicker, settings, onDelete, type }) {
  const [filteredContent, setFilteredContent] = React.useState(message.content);
  const [showDeletePrompt, setShowDeletePrompt] = React.useState(false);
  const [showProfilePrompt, setShowProfilePrompt] = React.useState(false);
  const [isCreator, setIsCreator] = React.useState(false);

  // Get unique views by username, excluding the owner
  const messageViews = React.useSyncExternalStore(
    room.collection('message_views')
      .filter({ message_id: message.id })
      .subscribe,
    () => room.collection('message_views')
      .filter({ message_id: message.id })
      .getList() || []
  );

  // Process views once we have them and the creator status
  const processedViews = React.useMemo(() => {
    if (!messageViews || !isCreator) return [];
    
    // Get unique views (only count one view per username)
    const uniqueViews = Array.from(new Set(messageViews.map(v => v.username)))
      .map(username => messageViews.find(v => v.username === username));

    // Filter out the owner's view
    return uniqueViews.filter(view => view.username !== message.username);
  }, [messageViews, isCreator, message.username]);

  React.useEffect(() => {
    async function checkIfCreator() {
      const creator = await window.websim.getCreatedBy();
      setIsCreator(message.username === creator.username);
    }
    checkIfCreator();
  }, [message.username]);

  React.useEffect(() => {
    async function filterContent() {
      if (settings.profanityFilter && message.content) {
        try {
          const response = await fetch('/api/ai_completion', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({
              prompt: `Check if this message contains any profanity or offensive language. If it does, return the message with profanity replaced with asterisks (*). If it doesn't contain profanity, return the original message unchanged.
              
              interface Response {
                filteredText: string;
              }
              
              example: 
              {
                "filteredText": "This **** is really ******* annoying"
              }`,
              data: message.content
            }),
          });
          const data = await response.json();
          setFilteredContent(data.filteredText);
        } catch (error) {
          console.error('Error filtering content:', error);
          setFilteredContent(message.content);
        }
      } else {
        setFilteredContent(message.content);
      }
    }
    filterContent();
  }, [message.content, settings.profanityFilter]);

  const canDelete = message.username === room.party.client.username;

  const handleDoubleClick = () => {
    if (canDelete) {
      setShowDeletePrompt(true);
    }
  };

  const handleAvatarClick = (e) => {
    e.stopPropagation();
    setShowProfilePrompt(true);
  };

  const handleViewProfile = () => {
    window.open(`https://websim.ai/@${message.username}`, '_blank');
    setShowProfilePrompt(false);
  };

  const viewsDisplay = type === 'updates' && isCreator && (
    <div className="message-views">
      {processedViews.length === 0 ? (
        <span className="no-views">No views yet</span>
      ) : processedViews.length === 1 ? (
        <span className="single-view">{processedViews[0].username} has seen your update</span>
      ) : (
        <span className="multiple-views">{processedViews.length} people have seen your update</span>
      )}
    </div>
  );

  return (
    <div 
      key={message.id} 
      className="message"
      onDoubleClick={handleDoubleClick}
    >
      <img 
        className="message-avatar" 
        src={`https://images.websim.ai/avatar/${message.username}`}
        alt={message.username} 
        onClick={handleAvatarClick}
      />
      <div className="message-content">
        <div className="message-header">
          {isCreator && <div className="owner-badge">OWNER</div>}
          <span className="message-author">{message.username}</span>
          <span className="message-time">
            {new Date(message.created_at).toLocaleTimeString()}
          </span>
        </div>
        {filteredContent && <div className="message-text">{filteredContent}</div>}
        {message.imageUrl && (
          <img 
            className="message-image" 
            src={message.imageUrl} 
            alt="Uploaded content"
            onClick={() => window.open(message.imageUrl, '_blank')}
          />
        )}
        {viewsDisplay}
        <MessageReactions 
          messageId={message.id}
          reactions={reactions}
          onReaction={onReaction}
          activeEmojiPicker={activeEmojiPicker}
          onToggleEmojiPicker={onToggleEmojiPicker}
        />
      </div>
      {showProfilePrompt && (
        <div className="profile-prompt">
          <div className="profile-prompt-content">
            <div className="profile-prompt-header">
              <i className="ri-user-line"></i>
              VIEW PROFILE?
            </div>
            <div className="profile-content">
              <img 
                src={`https://images.websim.ai/avatar/${message.username}`}
                alt={message.username}
                className="profile-preview"
              />
              <div className="profile-name">@{message.username}</div>
            </div>
            <div className="profile-prompt-buttons">
              <button onClick={handleViewProfile}>
                YES
              </button>
              <button onClick={() => setShowProfilePrompt(false)}>
                NO
              </button>
            </div>
          </div>
        </div>
      )}
      {showDeletePrompt && (
        <div className="delete-prompt">
          <div className="delete-prompt-content">
            <div className="delete-prompt-header">
              <i className="ri-delete-bin-line"></i>
              DELETE MESSAGE?
            </div>
            <div className="delete-prompt-buttons">
              <button onClick={() => onDelete(message.id)}>
                DELETE
              </button>
              <button onClick={() => setShowDeletePrompt(false)}>
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}