import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import WebsiteUrlInput from '../../components/bot/WebsiteUrlInput';
import DocumentUpload from '../../components/bot/DocumentUpload';
import DocumentList from '../../components/bot/DocumentList';
import ThemeCustomizer from '../../components/bot/ThemeCustomizer';
import IntegrationCode from '../../components/bot/IntegrationCode';
import ProcessDocumentsButton from '../../components/bot/ProcessDocumentsButton';

export default function Dashboard() {
  const { data: session } = useSession();
  const [refreshKey, setRefreshKey] = useState(0);
  const [botConfig, setBotConfig] = useState({
    url: '',
    primaryColor: '#264653',
    botName: '',
  });

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const handleSaveUrl = (url) => {
    setBotConfig(prev => ({ ...prev, url }));
    // TODO: Save to database
  };

  const handleSaveTheme = (theme) => {
    setBotConfig(prev => ({
      ...prev,
      primaryColor: theme.primaryColor,
      botName: theme.botName,
    }));
    // TODO: Save to database
  };

  // Temporary bot ID - This should come from your database
  const botId = session?.user?.id;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Bot Configuration</h1>
        
        {/* Website URL Section */}
        <WebsiteUrlInput 
          onSave={handleSaveUrl} 
          initialUrl={botConfig.url}
          onRefresh={handleRefresh}
        />

        {/* Document Management Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DocumentUpload onRefresh={handleRefresh} />
          <div className="space-y-4">
            <DocumentList key={refreshKey} />
            <ProcessDocumentsButton onProcessingComplete={handleRefresh} />
          </div>
        </div>

        {/* Theme Customization Section */}
        <ThemeCustomizer 
          onSave={handleSaveTheme}
          initialColor={botConfig.primaryColor}
          initialName={botConfig.botName}
        />

        {/* Integration Code Section */}
        <IntegrationCode
          botId={botId}
          primaryColor={botConfig.primaryColor}
        />
      </div>
    </DashboardLayout>
  );
}
