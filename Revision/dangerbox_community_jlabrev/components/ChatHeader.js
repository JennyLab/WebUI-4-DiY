function ChatHeader({ onOpenSettings, notifications, unreadCount, onNotificationClick }) {
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const hasUnreadNotifications = unreadCount > 0;

  useEffect(() => {
    async function checkIfCreator() {
      const creator = await window.websim.getCreatedBy();
      setIsCreator(creator.username === room.party.client.username);
    }
    checkIfCreator();
  }, []);

  return (
    <div className="chat-header">
      <i className="ri-terminal-box-line"></i>
      <span className="header-text">
        DCC - <span className="header-text-full">
          {window.location.pathname === '/updates' 
            ? 'UPDATES OF DANGERBOX' 
            : 'DANGERBOX COMMUNITY CENTER'}
        </span>
      </span>
      {!isCreator && (
        <div className="notification-container">
          <button 
            className={`notification-button ${hasUnreadNotifications ? 'has-notifications' : ''}`}
            onClick={() => setShowNotificationsPanel(!showNotificationsPanel)}
          >
            <i className="ri-notification-4-line"></i>
            {hasUnreadNotifications && <div className="notification-badge">{unreadCount}</div>}
          </button>
          {showNotificationsPanel && (
            <div className="notifications-panel">
              <div className="notifications-header">
                <i className="ri-notification-4-line"></i>
                NOTIFICATIONS
                <button 
                  className="close-button"
                  onClick={() => setShowNotificationsPanel(false)}
                >
                  <i className="ri-close-line"></i>
                </button>
              </div>
              <div className="notifications-list">
                {notifications.length > 0 ? (
                  notifications.map(notification => (
                    <div 
                      key={notification.id} 
                      className="notification-item"
                      onClick={() => {
                        onNotificationClick();
                        setShowNotificationsPanel(false);
                      }}
                    >
                      <div className="notification-time">
                        {new Date(notification.timestamp).toLocaleTimeString()}
                      </div>
                      <div className="notification-message">
                        {notification.content && (
                          <div className="notification-text">{notification.content}</div>
                        )}
                        {notification.imageUrl && (
                          <img 
                            src={notification.imageUrl} 
                            alt="Update preview" 
                            className="notification-image"
                          />
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-notifications">
                    NO NEW NOTIFICATIONS
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      <button className="settings-button" onClick={onOpenSettings}>
        <i className="ri-settings-3-line"></i>
      </button>
    </div>
  );
}