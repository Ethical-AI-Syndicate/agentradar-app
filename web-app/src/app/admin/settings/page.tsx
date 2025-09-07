'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Settings, 
  Save,
  RefreshCw,
  Mail,
  Bell,
  Globe,
  Database,
  Loader2,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { apiClient } from '@/lib/auth';

interface SystemSetting {
  id: string;
  key: string;
  value: string;
  description?: string;
  category?: string;
}

interface GroupedSettings {
  [category: string]: SystemSetting[];
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<GroupedSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedSettings, setSavedSettings] = useState<Set<string>>(new Set());

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/admin/settings');
      setSettings(response.data);
    } catch (err: any) {
      console.error('Failed to fetch settings:', err);
      setError(err.response?.data?.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSetting = async (settingId: string, value: string) => {
    try {
      setSaving(settingId);
      await apiClient.put(`/admin/settings/${settingId}`, { value });
      
      // Update local state
      setSettings(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(category => {
          updated[category] = updated[category].map(setting => 
            setting.id === settingId ? { ...setting, value } : setting
          );
        });
        return updated;
      });

      // Show success indicator
      setSavedSettings(prev => new Set([...prev, settingId]));
      setTimeout(() => {
        setSavedSettings(prev => {
          const updated = new Set(prev);
          updated.delete(settingId);
          return updated;
        });
      }, 2000);

    } catch (err: any) {
      console.error('Failed to update setting:', err);
    } finally {
      setSaving(null);
    }
  };

  const handleSettingChange = (settingId: string, value: string) => {
    setSettings(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(category => {
        updated[category] = updated[category].map(setting => 
          setting.id === settingId ? { ...setting, value } : setting
        );
      });
      return updated;
    });
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      email: Mail,
      notifications: Bell,
      api: Globe,
      database: Database,
      general: Settings
    };
    return icons[category as keyof typeof icons] || Settings;
  };

  const getCategoryTitle = (category: string) => {
    const titles = {
      email: 'Email Settings',
      notifications: 'Notifications',
      api: 'API Configuration',
      database: 'Database Settings',
      general: 'General Settings'
    };
    return titles[category as keyof typeof titles] || category.charAt(0).toUpperCase() + category.slice(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-600">Loading system settings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load settings</h3>
        <p className="text-sm text-gray-600 mb-4">{error}</p>
        <Button onClick={fetchSettings} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Settings className="h-6 w-6 mr-2" />
            System Settings
          </h1>
          <p className="text-gray-600">Configure system-wide settings and preferences</p>
        </div>
        <Button onClick={fetchSettings} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Settings Categories */}
      <div className="space-y-6">
        {Object.entries(settings).map(([category, categorySettings]) => {
          const CategoryIcon = getCategoryIcon(category);
          
          return (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CategoryIcon className="h-5 w-5 mr-2" />
                  {getCategoryTitle(category)}
                </CardTitle>
                <CardDescription>
                  Configure {category} related settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {categorySettings.map((setting) => (
                  <div key={setting.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                    <div className="space-y-1">
                      <Label htmlFor={setting.id} className="font-medium">
                        {setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Label>
                      {setting.description && (
                        <p className="text-sm text-gray-500">{setting.description}</p>
                      )}
                    </div>
                    
                    <div className="md:col-span-2">
                      <div className="flex items-center space-x-2">
                        {setting.key.includes('description') || setting.value.length > 100 ? (
                          <Textarea
                            id={setting.id}
                            value={setting.value}
                            onChange={(e) => handleSettingChange(setting.id, e.target.value)}
                            className="min-h-[80px]"
                          />
                        ) : (
                          <Input
                            id={setting.id}
                            value={setting.value}
                            onChange={(e) => handleSettingChange(setting.id, e.target.value)}
                            type={
                              setting.key.includes('email') ? 'email' :
                              setting.key.includes('url') ? 'url' :
                              setting.key.includes('port') ? 'number' : 'text'
                            }
                          />
                        )}
                        
                        <Button
                          size="sm"
                          onClick={() => updateSetting(setting.id, setting.value)}
                          disabled={saving === setting.id}
                        >
                          {saving === setting.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : savedSettings.has(setting.id) ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Default Settings Template */}
      {Object.keys(settings).length === 0 && !loading && (
        <Card>
          <CardHeader>
            <CardTitle>No Settings Found</CardTitle>
            <CardDescription>
              No system settings have been configured yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              System settings will appear here once they are created in the database.
              Common settings include email configuration, API endpoints, and system preferences.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Example Email Settings</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• SMTP Server Configuration</li>
                  <li>• Default From Address</li>
                  <li>• Email Templates</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Example API Settings</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Rate Limiting</li>
                  <li>• External API Keys</li>
                  <li>• Webhook URLs</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}