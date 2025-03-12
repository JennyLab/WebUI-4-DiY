function Settings({ isOpen, onClose, settings, onSettingsChange }) {
  if (!isOpen) return null;

  return (
    <div className="settings-modal">
      <div className="settings-content">
        <div className="settings-header">
          <i className="ri-settings-3-line"></i>
          SYSTEM SETTINGS
          <button className="close-button" onClick={onClose}>
            <i className="ri-close-line"></i>
          </button>
        </div>
        <div className="settings-options">
          <label className="settings-option">
            <span className="option-text">
              <i className="ri-spam-2-line"></i>
              PROFANITY FILTER
            </span>
            <div className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.profanityFilter}
                onChange={(e) => onSettingsChange({
                  ...settings,
                  profanityFilter: e.target.checked
                })}
              />
              <span className="toggle-slider"></span>
            </div>
          </label>

          <label className="settings-option">
            <span className="option-text">
              <i className="ri-contrast-2-line"></i>
              HIGH CONTRAST MODE
            </span>
            <div className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.highContrast}
                onChange={(e) => onSettingsChange({
                  ...settings,
                  highContrast: e.target.checked
                })}
              />
              <span className="toggle-slider"></span>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}