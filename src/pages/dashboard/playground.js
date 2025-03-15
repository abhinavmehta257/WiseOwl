import React from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Playground from '../../components/layout/Playground';
import { useEffect, useState } from 'react';
import axios from 'axios';

const PlaygroundPage = () => {
  const [botId, setBotId] = useState(null);

  useEffect(() => {
    const fetchBotId = async () => {
      try {
        const response = await axios.get('/api/bot/get-info');
        console.log(response.data);
        
        setBotId(response.data.bot._id.toString());
      } catch (error) {
        console.error('Failed to fetch botId:', error);
      }
    };

    fetchBotId();
  }, []);

  return botId ? (
    <DashboardLayout>
      <div className="space-y-6">
        <Playground botId={botId} />
      </div>
    </DashboardLayout>
  ) : (
    <div>Loading...</div>
  );
};

export default PlaygroundPage;
