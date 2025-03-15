import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function ThemeCustomizer({ onSave, initialColor = '#264653', initialName = '', botId = null }) {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [botName, setBotName] = useState(initialName);

  useEffect(() => {
    const fetchConfig = async () => {
      if (userId) {
        const response = await fetch(`/api/bot/get-theme?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.bot) {
            setBotName(data.bot.name);
            setPrimaryColor(data.bot.color);
          }
        }
      }
    };
    fetchConfig();
  }, [userId]);
  const [primaryColor, setPrimaryColor] = useState(initialColor);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!botName.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/bot/save-theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: botName,
          color: primaryColor.toLowerCase(),
          ...(botId && { botId }),
          ...(userId && { userId })
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save bot configuration');
      }
      onSave?.({ botName, primaryColor: primaryColor.toLowerCase() });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Bot Appearance</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Bot Name Input */}
        <div>
          <label htmlFor="bot-name" className="block text-sm font-medium text-gray-700 mb-1">
            Bot Name
          </label>
          <input
            type="text"
            id="bot-name"
            value={botName}
            onChange={(e) => setBotName(e.target.value)}
            placeholder="e.g., Support Assistant"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-input focus:outline-none focus:ring-primary focus:border-primary"
            required
          />
        </div>

        {/* Color Picker */}
        <div>
          <label htmlFor="primary-color" className="block text-sm font-medium text-gray-700 mb-1">
            Primary Color
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="color"
              id="primary-color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="h-10 w-20 rounded border border-gray-300 p-1 cursor-pointer"
            />
            <input
              type="text"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              placeholder="#000000"
              className="w-28 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-input focus:outline-none focus:ring-primary focus:border-primary"
              pattern="^#[0-9A-Fa-f]{6}$"
            />
          </div>
        </div>

        {/* Preview */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Preview</h3>
          <div className="border rounded-lg p-4">
            <div className="flex items-start space-x-4">
              {/* Bot Avatar */}
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium"
                style={{ backgroundColor: primaryColor }}
              >
                {botName ? botName.charAt(0).toUpperCase() : 'B'}
              </div>
              
              {/* Chat Preview */}
              <div className="flex-1">
                <div className="font-medium" style={{ color: primaryColor }}>
                  {botName || 'Bot Name'}
                </div>
                <div className="mt-1 inline-block rounded-lg py-2 px-3" style={{ backgroundColor: `${primaryColor}10` }}>
                  Hello! How can I help you today?
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving || !botName.trim()}
            className="px-4 py-2 bg-primary text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 flex items-center"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
