const room = new WebsimSocket();
const { useState, useEffect } = React;

function App() {
  const [activeTab, setActiveTab] = useState('main');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState({
    profanityFilter: false,
    highContrast: false
  });
  const [notifications, setNotifications] = useState([]);
  const [activeNotifications, setActiveNotifications] = useState([]);
  const [lastSeenUpdates, setLastSeenUpdates] = useState(null);
  const [lastSeenMain, setLastSeenMain] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMainMessages, setUnreadMainMessages] = useState(0);
  const [isCreator, setIsCreator] = useState(false);

  const getThemeClass = () => {
    let classes = [activeTab + '-theme'];
    if (settings.highContrast) {
      classes.push('high-contrast');
    }
    return classes.join(' ');
  };

  useEffect(() => {
    async function checkIfCreator() {
      const creator = await window.websim.getCreatedBy();
      setIsCreator(creator.username === room.party.client.username);
    }
    checkIfCreator();
  }, []);

  const updateMessages = React.useSyncExternalStore(
    room.collection('message_updates').subscribe,
    () => room.collection('message_updates').getList() || []
  );

  const mainMessages = React.useSyncExternalStore(
    room.collection('message_main').subscribe,
    () => room.collection('message_main').getList() || []
  );

  useEffect(() => {
    if (!isCreator && updateMessages.length > 0) {
      const newMessages = updateMessages.filter(msg => 
        msg.id !== lastSeenUpdates &&
        msg.username !== room.party.client.username &&
        (!lastSeenUpdates || new Date(msg.created_at) > new Date(lastSeenUpdates))
      );

      if (newMessages.length > 0) {
        setLastSeenUpdates(newMessages[newMessages.length - 1].id);
        
        const newNotifications = newMessages.map(message => ({
          id: message.id,
          type: 'update',
          content: message.content,
          imageUrl: message.imageUrl,
          timestamp: new Date(message.created_at),
          read: false
        }));

        setNotifications(prev => [...newNotifications, ...prev]);
        setActiveNotifications(prev => [...prev, ...newNotifications]);
        setUnreadNotifications(prev => prev + newMessages.length);

        newNotifications.forEach(notification => {
          setTimeout(() => {
            setActiveNotifications(prev => 
              prev.filter(n => n.id !== notification.id)
            );
          }, 5000);
        });
      }
    }
  }, [updateMessages, isCreator, lastSeenUpdates]);

  useEffect(() => {
    if (mainMessages.length > 0 && activeTab !== 'main') {
      const newMessages = mainMessages.filter(msg => 
        msg.id !== lastSeenMain &&
        msg.username !== room.party.client.username &&
        (!lastSeenMain || new Date(msg.created_at) > new Date(lastSeenMain))
      );

      if (newMessages.length > 0) {
        setLastSeenMain(newMessages[newMessages.length - 1].id);
        setUnreadMainMessages(prev => prev + newMessages.length);
      }
    }
  }, [mainMessages, activeTab, lastSeenMain]);

  const handleNotificationClick = (type) => {
    if (type === 'update') {
      setActiveTab('updates');
      setUnreadNotifications(0);
    } else if (type === 'main') {
      setActiveTab('main');
      setUnreadMainMessages(0);
    }
    setActiveNotifications([]);
    setNotifications(notifications.map(notif => ({...notif, read: true})));
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'updates') {
      if (updateMessages.length > 0) {
        setLastSeenUpdates(updateMessages[updateMessages.length - 1].id);
      }
      setUnreadNotifications(0);
      setNotifications(prev => prev.map(n => 
        n.type === 'update' ? {...n, read: true} : n
      ));
    } else if (tab === 'main') {
      if (mainMessages.length > 0) {
        setLastSeenMain(mainMessages[mainMessages.length - 1].id);
      }
      setUnreadMainMessages(0);
      setNotifications(prev => prev.map(n => 
        n.type === 'main' ? {...n, read: true} : n
      ));
    }
  };

  return (
    <div className={`app ${getThemeClass()}`}>
      <div className="notifications-stack">
        {activeNotifications.map((notification) => (
          <div 
            key={notification.id} 
            className="notification" 
            onClick={() => handleNotificationClick(notification.type)}
          >
            <div className="notification-content">
              <i className="ri-notification-4-line"></i>
              <span>
                {notification.type === 'update' 
                  ? 'NEW UPDATE POSTED!' 
                  : 'NEW MESSAGE IN MAIN CHAT!'}
              </span>
              <button 
                className="notification-close" 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveNotifications(prev => 
                    prev.filter(n => n.id !== notification.id)
                  );
                }}
              >
                <i className="ri-close-line"></i>
              </button>
            </div>
          </div>
        ))}
      </div>
      <ChatHeader 
        onOpenSettings={() => setSettingsOpen(true)}
        notifications={notifications.filter(n => !n.read)}
        unreadCount={unreadNotifications + unreadMainMessages}
        onNotificationClick={() => {
          if (unreadNotifications > 0) {
            handleNotificationClick('update');
          } else if (unreadMainMessages > 0) {
            handleNotificationClick('main');
          }
        }}
      />
      <div className="chat-tabs">
        <button 
          className={`tab ${activeTab === 'main' ? 'active' : ''}`}
          onClick={() => handleTabChange('main')}
        >
          <i className="ri-chat-1-line"></i> 
          MAIN CHAT
          {unreadMainMessages > 0 && activeTab !== 'main' && (
            <span className="tab-badge">{unreadMainMessages}</span>
          )}
        </button>
        <button 
          className={`tab ${activeTab === 'fanart' ? 'active' : ''}`}
          onClick={() => handleTabChange('fanart')}
        >
          <i className="ri-image-line"></i> FANART
        </button>
        <button 
          className={`tab ${activeTab === 'updates' ? 'active' : ''}`}
          onClick={() => handleTabChange('updates')}
        >
          <i className="ri-newspaper-line"></i> UPDATES
        </button>
      </div>
      <div className="chat-container">
        {activeTab === 'main' && (
          <ChatSection type="main" imageRequired={false} settings={settings} />
        )}
        {activeTab === 'fanart' && (
          <ChatSection type="fanart" imageRequired={true} settings={settings} />
        )}
        {activeTab === 'updates' && (
          <ChatSection type="updates" imageRequired={false} settings={settings} ownerOnly={true} />
        )}
      </div>
      <Settings
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSettingsChange={setSettings}
      />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);