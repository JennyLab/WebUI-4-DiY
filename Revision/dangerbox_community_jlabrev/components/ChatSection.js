function ChatSection({ type, imageRequired, settings, ownerOnly = false }) {
  const { useState, useEffect, useRef } = React;
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    async function checkIfCreator() {
      const creator = await window.websim.getCreatedBy();
      setIsCreator(creator.username === room.party.client.username);
    }
    checkIfCreator();
  }, []);

  const messages = React.useSyncExternalStore(
    room.collection(`message_${type}`).subscribe,
    () => room.collection(`message_${type}`).getList() || []
  );

  const reactions = React.useSyncExternalStore(
    room.collection('reaction').subscribe,
    () => room.collection('reaction').getList() || []
  );

  const [newMessage, setNewMessage] = useState('');
  const [activeEmojiPicker, setActiveEmojiPicker] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState(null);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const emojiPickers = document.querySelectorAll('.emoji-picker');
      let clickedInside = false;
      emojiPickers.forEach(picker => {
        if (picker.contains(event.target)) clickedInside = true;
      });
      if (!clickedInside) setActiveEmojiPicker(null);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sortedMessages = [...messages].sort((a, b) => 
    new Date(a.created_at) - new Date(b.created_at)
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    // Record view when messages are loaded and user is not the creator
    if (type === 'updates' && !isCreator && messages.length > 0) {
      const recordViews = async () => {
        for (const message of messages) {
          // Skip if the user is the message creator
          if (message.username === room.party.client.username) continue;

          // Check if user has already viewed this message
          const existingViews = room.collection('message_views')
            .filter({ 
              message_id: message.id, 
              username: room.party.client.username 
            })
            .getList();

          // Only create a view if user hasn't seen it before
          if (!existingViews || existingViews.length === 0) {
            await room.collection('message_views').create({
              message_id: message.id,
              username: room.party.client.username
            });
          }
        }
      };
      recordViews();
    }
  }, [messages, type, isCreator]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    // Allow owner to post without image in fanart section
    if (imageRequired && !isCreator && !selectedImage) {
      alert('Please select an image for the fanart section');
      return;
    }
    
    // Only allow sending if there's either a message or an image (or both)
    if (!newMessage.trim() && !selectedImage) return;

    try {
      let imageUrl = null;
      if (selectedImage) {
        setUploadingImage(true);
        imageUrl = await websim.upload(selectedImage);
      }

      await room.collection(`message_${type}`).create({
        content: newMessage.trim() || null, // Allow null for image-only posts
        imageUrl: imageUrl
      });

      setNewMessage('');
      setSelectedImage(null);
      setSelectedImagePreview(null);
      setUploadingImage(false);
    } catch (error) {
      console.error('Error sending message:', error);
      setUploadingImage(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setSelectedImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleAddReaction = async (messageId, emoji, event) => {
    event.preventDefault();
    event.stopPropagation();
    
    try {
      const existingReaction = reactions.find(
        r => r.message_id === messageId && 
             r.emoji === emoji && 
             r.username === room.party.client.username
      );

      if (existingReaction) {
        await room.collection('reaction').delete(existingReaction.id);
      } else {
        await room.collection('reaction').create({
          message_id: messageId,
          emoji: emoji
        });
      }
    } catch (error) {
      console.error('Error managing reaction:', error);
    }
    setActiveEmojiPicker(null);
  };

  const getMessageReactions = (messageId) => {
    const messageReactions = reactions.filter(r => r.message_id === messageId);
    return messageReactions.reduce((acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = {
          count: 0,
          users: [],
          hasReacted: false
        };
      }
      acc[reaction.emoji].count++;
      acc[reaction.emoji].users.push(reaction.username);
      if (reaction.username === room.party.client.username) {
        acc[reaction.emoji].hasReacted = true;
      }
      return acc;
    }, {});
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await room.collection(`message_${type}`).delete(messageId);
      // Also delete any reactions associated with this message
      const messageReactions = reactions.filter(r => r.message_id === messageId);
      for (const reaction of messageReactions) {
        if (reaction.username === room.party.client.username) {
          await room.collection('reaction').delete(reaction.id);
        }
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  return (
    <>
      <div className="chat-messages">
        {sortedMessages.map(message => (
          <Message
            key={message.id}
            message={message}
            reactions={getMessageReactions(message.id)}
            onReaction={handleAddReaction}
            activeEmojiPicker={activeEmojiPicker}
            onToggleEmojiPicker={(messageId, e) => {
              e.preventDefault();
              e.stopPropagation();
              setActiveEmojiPicker(activeEmojiPicker === messageId ? null : messageId);
            }}
            settings={settings}
            onDelete={handleDeleteMessage}
            type={type}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
      {(!ownerOnly || isCreator) && (
        <ChatInput
          newMessage={newMessage}
          onMessageChange={setNewMessage}
          onSubmit={handleSendMessage}
          onFileSelect={handleFileSelect}
          uploadingImage={uploadingImage}
          selectedImagePreview={selectedImagePreview}
          onRemoveImage={() => {
            setSelectedImage(null);
            setSelectedImagePreview(null);
            fileInputRef.current.value = '';
          }}
          fileInputRef={fileInputRef}
          placeholder={
            type === 'fanart' 
              ? "Describe your fanart..."
              : type === 'updates'
                ? "Post an update..."
                : "Send a message"
          }
        />
      )}
    </>
  );
}