function ChatInput({ 
  newMessage, 
  onMessageChange, 
  onSubmit,
  onFileSelect,
  uploadingImage,
  selectedImagePreview,
  onRemoveImage,
  fileInputRef,
  placeholder
}) {
  return (
    <>
      <form className="chat-input" onSubmit={onSubmit}>
        <input
          type="text"
          placeholder={placeholder}
          value={newMessage}
          onChange={(e) => onMessageChange(e.target.value)}
        />
        <input
          type="file"
          accept="image/*"
          onChange={onFileSelect}
          style={{ display: 'none' }}
          ref={fileInputRef}
        />
        <button 
          type="button" 
          className="upload-button"
          onClick={() => fileInputRef.current.click()}
        >
          <i className="ri-image-line"></i>
        </button>
        <button type="submit" className="upload-button">
          {uploadingImage ? (
            <div className="loading-indicator" title="Uploading image...">
              <span className="sr-only">Uploading image...</span>
            </div>
          ) : (
            <i className="ri-send-plane-fill"></i>
          )}
        </button>
      </form>
      {selectedImagePreview && (
        <div className="image-upload-preview">
          <img src={selectedImagePreview} alt="Upload preview" />
          <span className="remove-image" onClick={onRemoveImage}>
            <i className="ri-close-line"></i>
          </span>
        </div>
      )}
    </>
  );
}