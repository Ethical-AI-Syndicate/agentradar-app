'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { 
  Shield,
  Plus,
  Edit3,
  Trash2,
  Users,
  Settings,
  Activity,
  CheckCircle,
  XCircle,
  Eye,
  Copy,
  TestTube,
  Building,
  Key,
  Globe
} from 'lucide-react'

interface SSOProvider {
  id: string
  name: string
  type: 'SAML' | 'OAUTH2' | 'OIDC'
  domain: string
  entityId?: string
  ssoUrl?: string
  sloUrl?: string
  certificate?: string
  clientId?: string
  clientSecret?: string
  authUrl?: string
  tokenUrl?: string
  userInfoUrl?: string
  scopes: string[]
  attributeMapping?: {
    email: string
    firstName: string
    lastName: string
    displayName: string
  }
  isActive: boolean
  autoProvision: boolean
  defaultRole: 'USER' | 'ADMIN'
  defaultTier: string
  organizationId?: string
  createdAt: string
  updatedAt: string
  userCount: number
  sessionCount: number
  activeUsers: number
}

interface SSOUser {
  id: string
  email: string
  firstName?: string
  lastName?: string
  lastLogin?: string
  provider: {
    name: string
    type: string
  }
}

export default function SSOAdminPage() {
  const [providers, setProviders] = useState<SSOProvider[]>([])
  const [users, setUsers] = useState<SSOUser[]>([])
  const [activeTab, setActiveTab] = useState('providers')
  const [isCreateProviderOpen, setIsCreateProviderOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<SSOProvider | null>(null)
  const [isEditProviderOpen, setIsEditProviderOpen] = useState(false)
  const [isTestingProvider, setIsTestingProvider] = useState<string | null>(null)

  useEffect(() => {
    fetchProviders()
    fetchSSOUsers()
  }, [])

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/sso/admin/providers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setProviders(data.data)
      }
    } catch (error) {
      console.error('Error fetching SSO providers:', error)
      // Fallback to mock data
      const mockProviders: SSOProvider[] = [
        {
          id: '1',
          name: 'Remax Corporate SAML',
          type: 'SAML',
          domain: 'remax.com',
          entityId: 'urn:agentradar:saml:remax',
          ssoUrl: 'https://sso.remax.com/saml/sso',
          sloUrl: 'https://sso.remax.com/saml/slo',
          certificate: '***',
          scopes: [],
          isActive: true,
          autoProvision: true,
          defaultRole: 'USER',
          defaultTier: 'TEAM_ENTERPRISE',
          createdAt: '2024-09-01',
          updatedAt: '2024-09-08',
          userCount: 156,
          sessionCount: 423,
          activeUsers: 89
        },
        {
          id: '2',
          name: 'Century 21 Azure AD',
          type: 'OAUTH2',
          domain: 'century21.com',
          clientId: 'c21-agentradar-client',
          clientSecret: '***',
          authUrl: 'https://login.microsoftonline.com/tenant/oauth2/v2.0/authorize',
          tokenUrl: 'https://login.microsoftonline.com/tenant/oauth2/v2.0/token',
          userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
          scopes: ['openid', 'profile', 'email'],
          attributeMapping: {
            email: 'mail',
            firstName: 'givenName',
            lastName: 'surname',
            displayName: 'displayName'
          },
          isActive: true,
          autoProvision: true,
          defaultRole: 'USER',
          defaultTier: 'PROFESSIONAL',
          createdAt: '2024-08-15',
          updatedAt: '2024-09-05',
          userCount: 203,
          sessionCount: 567,
          activeUsers: 142
        }
      ]
      setProviders(mockProviders)
    }
  }

  const fetchSSOUsers = async () => {
    try {
      const response = await fetch('/api/admin/users?sso=true', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setUsers(data.data.users)
      }
    } catch (error) {
      console.error('Error fetching SSO users:', error)
      // Fallback to mock data
      const mockUsers: SSOUser[] = [
        {
          id: '1',
          email: 'john.smith@remax.com',
          firstName: 'John',
          lastName: 'Smith',
          lastLogin: '2024-09-09',
          provider: { name: 'Remax Corporate SAML', type: 'SAML' }
        },
        {
          id: '2',
          email: 'sarah.johnson@century21.com',
          firstName: 'Sarah',
          lastName: 'Johnson',
          lastLogin: '2024-09-08',
          provider: { name: 'Century 21 Azure AD', type: 'OAUTH2' }
        }
      ]
      setUsers(mockUsers)
    }
  }

  const handleCreateProvider = async (providerData: any) => {
    try {
      const response = await fetch('/api/sso/admin/providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(providerData)
      })
      const data = await response.json()
      if (data.success) {
        setProviders([...providers, data.data])
        setIsCreateProviderOpen(false)
      } else {
        console.error('Error creating provider:', data.error)
      }
    } catch (error) {
      console.error('Error creating provider:', error)
    }
  }

  const handleDeleteProvider = async (providerId: string) => {
    if (!confirm('Are you sure you want to delete this SSO provider? This will affect user access.')) {
      return
    }

    try {
      const response = await fetch(`/api/sso/admin/providers/${providerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setProviders(providers.filter(p => p.id !== providerId))
      } else {
        console.error('Error deleting provider:', data.error)
      }
    } catch (error) {
      console.error('Error deleting provider:', error)
    }
  }

  const handleTestProvider = async (providerId: string) => {
    setIsTestingProvider(providerId)
    try {
      const response = await fetch(`/api/sso/admin/providers/${providerId}/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      })
      const data = await response.json()
      if (data.success) {
        alert(`Test successful! Provider configuration is valid.`)
      } else {
        alert(`Test failed: ${data.error}`)
      }
    } catch (error) {
      alert(`Test failed: ${error.message}`)
    } finally {
      setIsTestingProvider(null)
    }
  }

  const toggleProviderStatus = async (providerId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/sso/admin/providers/${providerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ isActive })
      })
      const data = await response.json()
      if (data.success) {
        setProviders(providers.map(p => 
          p.id === providerId ? { ...p, isActive } : p
        ))
      }
    } catch (error) {
      console.error('Error updating provider status:', error)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Single Sign-On (SSO)</h1>
          <p className="text-gray-600 mt-1">Configure and manage SSO providers for enterprise accounts</p>
        </div>
        <Dialog open={isCreateProviderOpen} onOpenChange={setIsCreateProviderOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add SSO Provider
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add SSO Provider</DialogTitle>
            </DialogHeader>
            <SSOProviderForm onSubmit={handleCreateProvider} onCancel={() => setIsCreateProviderOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Providers</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{providers.filter(p => p.isActive).length}</div>
            <p className="text-xs text-muted-foreground">
              {providers.length} total configured
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SSO Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{providers.reduce((sum, p) => sum + p.userCount, 0)}</div>
            <p className="text-xs text-muted-foreground">
              {providers.reduce((sum, p) => sum + p.activeUsers, 0)} active this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{providers.reduce((sum, p) => sum + p.sessionCount, 0)}</div>
            <p className="text-xs text-muted-foreground">
              All time SSO sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Domains</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(providers.map(p => p.domain)).size}</div>
            <p className="text-xs text-muted-foreground">
              Unique organizations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="users">SSO Users</TabsTrigger>
          <TabsTrigger value="logs">Activity Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {providers.map((provider) => (
              <Card key={provider.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${
                        provider.type === 'SAML' ? 'bg-blue-100 text-blue-600' :
                        provider.type === 'OAUTH2' ? 'bg-green-100 text-green-600' :
                        'bg-purple-100 text-purple-600'
                      }`}>
                        {provider.type === 'SAML' && <Shield className="w-4 h-4" />}
                        {provider.type === 'OAUTH2' && <Key className="w-4 h-4" />}
                        {provider.type === 'OIDC' && <Globe className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-semibold">{provider.name}</h3>
                          <Badge variant={provider.isActive ? "default" : "secondary"}>
                            {provider.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="outline">{provider.type}</Badge>
                        </div>
                        <p className="text-sm text-gray-600">{provider.domain}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleTestProvider(provider.id)}
                        disabled={isTestingProvider === provider.id}
                      >
                        <TestTube className="w-4 h-4 mr-1" />
                        {isTestingProvider === provider.id ? 'Testing...' : 'Test'}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedProvider(provider)
                          setIsEditProviderOpen(true)
                        }}
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDeleteProvider(provider.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Users</p>
                      <p className="text-lg font-semibold">{provider.userCount}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Users</p>
                      <p className="text-lg font-semibold">{provider.activeUsers}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Sessions</p>
                      <p className="text-lg font-semibold">{provider.sessionCount}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Default Tier</p>
                      <p className="text-lg font-semibold">{provider.defaultTier.replace('_', ' ')}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Switch 
                          checked={provider.isActive}
                          onCheckedChange={(checked) => toggleProviderStatus(provider.id, checked)}
                        />
                        <span className="text-sm">Provider Active</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {provider.autoProvision ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-sm">Auto Provision</span>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-500">
                      Updated {new Date(provider.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SSO Provider
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Login
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.provider.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="outline">{user.provider.type}</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SSO Activity Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">Recent SSO authentication events and provider activity</p>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                  <p className="text-gray-500">Activity logs will be implemented with production SSO usage</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Provider Dialog */}
      <Dialog open={isEditProviderOpen} onOpenChange={setIsEditProviderOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit SSO Provider</DialogTitle>
          </DialogHeader>
          {selectedProvider && (
            <SSOProviderForm 
              provider={selectedProvider}
              onSubmit={handleCreateProvider}
              onCancel={() => setIsEditProviderOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// SSO Provider Form Component
function SSOProviderForm({ provider, onSubmit, onCancel }: { 
  provider?: SSOProvider; 
  onSubmit: (data: any) => void; 
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: provider?.name || '',
    type: provider?.type || 'SAML',
    domain: provider?.domain || '',
    entityId: provider?.entityId || '',
    ssoUrl: provider?.ssoUrl || '',
    sloUrl: provider?.sloUrl || '',
    certificate: provider?.certificate || '',
    clientId: provider?.clientId || '',
    clientSecret: provider?.clientSecret || '',
    authUrl: provider?.authUrl || '',
    tokenUrl: provider?.tokenUrl || '',
    userInfoUrl: provider?.userInfoUrl || '',
    scopes: provider?.scopes?.join(', ') || '',
    autoProvision: provider?.autoProvision ?? true,
    defaultRole: provider?.defaultRole || 'USER',
    defaultTier: provider?.defaultTier || 'PROFESSIONAL'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const submitData = {
      ...formData,
      scopes: formData.scopes.split(',').map(s => s.trim()).filter(s => s.length > 0),
      attributeMapping: {
        email: 'email',
        firstName: 'given_name',
        lastName: 'family_name',
        displayName: 'name'
      }
    }
    
    onSubmit(submitData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Basic Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Provider Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="e.g., Remax Corporate SAML"
              required
            />
          </div>
          <div>
            <Label htmlFor="domain">Domain</Label>
            <Input
              id="domain"
              value={formData.domain}
              onChange={(e) => setFormData({...formData, domain: e.target.value})}
              placeholder="e.g., remax.com"
              required
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="type">SSO Type</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value as any})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SAML">SAML 2.0</SelectItem>
              <SelectItem value="OAUTH2">OAuth 2.0</SelectItem>
              <SelectItem value="OIDC">OpenID Connect</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* SAML Configuration */}
      {formData.type === 'SAML' && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">SAML Configuration</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="entityId">Entity ID</Label>
              <Input
                id="entityId"
                value={formData.entityId}
                onChange={(e) => setFormData({...formData, entityId: e.target.value})}
                placeholder="urn:agentradar:saml:provider"
              />
            </div>
            <div>
              <Label htmlFor="ssoUrl">SSO URL</Label>
              <Input
                id="ssoUrl"
                value={formData.ssoUrl}
                onChange={(e) => setFormData({...formData, ssoUrl: e.target.value})}
                placeholder="https://sso.provider.com/saml/sso"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="sloUrl">Single Logout URL (Optional)</Label>
            <Input
              id="sloUrl"
              value={formData.sloUrl}
              onChange={(e) => setFormData({...formData, sloUrl: e.target.value})}
              placeholder="https://sso.provider.com/saml/slo"
            />
          </div>
          <div>
            <Label htmlFor="certificate">X.509 Certificate</Label>
            <Textarea
              id="certificate"
              value={formData.certificate}
              onChange={(e) => setFormData({...formData, certificate: e.target.value})}
              placeholder="-----BEGIN CERTIFICATE-----..."
              rows={4}
            />
          </div>
        </div>
      )}

      {/* OAuth2/OIDC Configuration */}
      {(formData.type === 'OAUTH2' || formData.type === 'OIDC') && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">OAuth 2.0 Configuration</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clientId">Client ID</Label>
              <Input
                id="clientId"
                value={formData.clientId}
                onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                placeholder="your-client-id"
              />
            </div>
            <div>
              <Label htmlFor="clientSecret">Client Secret</Label>
              <Input
                id="clientSecret"
                type="password"
                value={formData.clientSecret}
                onChange={(e) => setFormData({...formData, clientSecret: e.target.value})}
                placeholder="your-client-secret"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="authUrl">Authorization URL</Label>
              <Input
                id="authUrl"
                value={formData.authUrl}
                onChange={(e) => setFormData({...formData, authUrl: e.target.value})}
                placeholder="https://provider.com/oauth2/authorize"
              />
            </div>
            <div>
              <Label htmlFor="tokenUrl">Token URL</Label>
              <Input
                id="tokenUrl"
                value={formData.tokenUrl}
                onChange={(e) => setFormData({...formData, tokenUrl: e.target.value})}
                placeholder="https://provider.com/oauth2/token"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="userInfoUrl">User Info URL</Label>
            <Input
              id="userInfoUrl"
              value={formData.userInfoUrl}
              onChange={(e) => setFormData({...formData, userInfoUrl: e.target.value})}
              placeholder="https://provider.com/oauth2/userinfo"
            />
          </div>
          <div>
            <Label htmlFor="scopes">Scopes (comma-separated)</Label>
            <Input
              id="scopes"
              value={formData.scopes}
              onChange={(e) => setFormData({...formData, scopes: e.target.value})}
              placeholder="openid, profile, email"
            />
          </div>
        </div>
      )}

      {/* User Provisioning */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">User Provisioning</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="defaultRole">Default Role</Label>
            <Select value={formData.defaultRole} onValueChange={(value) => setFormData({...formData, defaultRole: value as any})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">User</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="defaultTier">Default Subscription Tier</Label>
            <Select value={formData.defaultTier} onValueChange={(value) => setFormData({...formData, defaultTier: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PROFESSIONAL">Professional</SelectItem>
                <SelectItem value="TEAM_ENTERPRISE">Team Enterprise</SelectItem>
                <SelectItem value="WHITE_LABEL">White Label</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch 
            checked={formData.autoProvision}
            onCheckedChange={(checked) => setFormData({...formData, autoProvision: checked})}
          />
          <Label>Auto-provision new users</Label>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {provider ? 'Update Provider' : 'Create Provider'}
        </Button>
      </div>
    </form>
  )
}