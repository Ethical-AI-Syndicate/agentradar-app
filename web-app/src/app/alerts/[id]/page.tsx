'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft,
  MapPin,
  Calendar,
  DollarSign,
  ExternalLink,
  Edit3,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  Globe,
  Phone,
  Mail,
  Loader2
} from 'lucide-react';
import { 
  alertsApi, 
  formatCurrency, 
  formatDate, 
  formatRelativeTime,
  type Alert as AlertType 
} from '@/lib/api';
import Link from 'next/link';

export default function AlertDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [alert, setAlert] = useState<AlertType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const alertId = params.id as string;

  useEffect(() => {
    const loadAlert = async () => {
      if (!alertId) return;

      try {
        setLoading(true);
        setError(null);

        const response = await alertsApi.getAlert(alertId);
        
        if (response.success && response.data) {
          setAlert(response.data);
        } else {
          setError('Alert not found');
        }
      } catch (error) {
        console.error('Alert loading error:', error);
        setError('Failed to load alert details');
      } finally {
        setLoading(false);
      }
    };

    loadAlert();
  }, [alertId]);

  const handleResolveAlert = async () => {
    if (!alert) return;

    try {
      setActionLoading('resolve');
      const response = await alertsApi.resolveAlert(alert.id);
      if (response.success && response.data) {
        setAlert(response.data);
      }
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteAlert = async () => {
    if (!alert || !confirm('Are you sure you want to delete this alert?')) return;

    try {
      setActionLoading('delete');
      const response = await alertsApi.deleteAlert(alert.id);
      if (response.success) {
        router.push('/alerts');
      }
    } catch (error) {
      console.error('Failed to delete alert:', error);
      setActionLoading(null);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-200';
      case 'URGENT': return 'bg-red-200 text-red-900 border-red-300';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-blue-100 text-blue-800';
      case 'RESOLVED': return 'bg-green-100 text-green-800';
      case 'PAUSED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'POWER_OF_SALE': return <AlertTriangle className="h-6 w-6" />;
      case 'FORECLOSURE': return <AlertTriangle className="h-6 w-6" />;
      case 'ESTATE_SALE': return <Clock className="h-6 w-6" />;
      case 'TAX_SALE': return <DollarSign className="h-6 w-6" />;
      default: return <AlertTriangle className="h-6 w-6" />;
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
            <p className="mt-2 text-gray-600">Loading alert details...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !alert) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center h-16">
                <Link href="/alerts" className="flex items-center text-gray-500 hover:text-gray-700">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Alerts
                </Link>
              </div>
            </div>
          </header>
          <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <Alert variant="destructive">
              <AlertDescription>{error || 'Alert not found'}</AlertDescription>
            </Alert>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Link href="/alerts" className="flex items-center text-gray-500 hover:text-gray-700">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Alerts
                </Link>
                <h1 className="ml-4 text-xl font-semibold text-gray-900">Alert Details</h1>
              </div>
              <div className="flex items-center space-x-3">
                <Link href={`/alerts/${alert.id}/edit`}>
                  <Button variant="outline" size="sm">
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </Link>
                {alert.status === 'ACTIVE' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResolveAlert}
                    disabled={actionLoading === 'resolve'}
                  >
                    {actionLoading === 'resolve' ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Resolve
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteAlert}
                  disabled={actionLoading === 'delete'}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  {actionLoading === 'delete' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Alert Header */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-gray-100 rounded-lg">
                      {getAlertIcon(alert.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h1 className="text-2xl font-bold text-gray-900">{alert.title}</h1>
                        <Badge className={getPriorityColor(alert.priority)}>
                          {alert.priority}
                        </Badge>
                        <Badge className={getStatusColor(alert.status)}>
                          {alert.status}
                        </Badge>
                      </div>
                      <div className="flex items-center text-gray-600 mb-2">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>{alert.address}, {alert.city}, {alert.province}</span>
                        {alert.postalCode && <span className="ml-1">{alert.postalCode}</span>}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>Created {formatRelativeTime(alert.createdAt)}</span>
                        </div>
                        <span className="capitalize">
                          {alert.type.replace('_', ' ').toLowerCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Property Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Property Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Location Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Address:</span>
                          <span className="font-medium">{alert.address}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">City:</span>
                          <span className="font-medium">{alert.city}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Province:</span>
                          <span className="font-medium">{alert.province}</span>
                        </div>
                        {alert.postalCode && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Postal Code:</span>
                            <span className="font-medium">{alert.postalCode}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Financial Information</h4>
                      <div className="space-y-2 text-sm">
                        {alert.price && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Listed Price:</span>
                            <span className="font-medium">{formatCurrency(alert.price)}</span>
                          </div>
                        )}
                        {alert.estimatedValue && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Estimated Value:</span>
                            <span className="font-medium">{formatCurrency(alert.estimatedValue)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-500">Alert Type:</span>
                          <span className="font-medium capitalize">
                            {alert.type.replace('_', ' ').toLowerCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {alert.description && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {alert.description}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Legal Information */}
              {(alert.caseNumber || alert.saleDate || alert.sourceUrl) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      Legal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {alert.caseNumber && (
                        <div>
                          <span className="text-gray-500 text-sm">Case Number:</span>
                          <p className="font-medium">{alert.caseNumber}</p>
                        </div>
                      )}
                      {alert.saleDate && (
                        <div>
                          <span className="text-gray-500 text-sm">Sale Date:</span>
                          <p className="font-medium">{formatDate(alert.saleDate)}</p>
                        </div>
                      )}
                    </div>
                    {alert.sourceUrl && (
                      <div>
                        <span className="text-gray-500 text-sm">Source:</span>
                        <div className="mt-1">
                          <a
                            href={alert.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-indigo-600 hover:text-indigo-500"
                          >
                            <Globe className="h-4 w-4 mr-2" />
                            View Source Document
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Alert Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-700">Alert Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Status:</span>
                    <Badge className={getStatusColor(alert.status)}>
                      {alert.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Priority:</span>
                    <Badge className={getPriorityColor(alert.priority)}>
                      {alert.priority}
                    </Badge>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>Created: {formatDate(alert.createdAt)}</p>
                      <p>Updated: {formatDate(alert.updatedAt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-700">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full" size="sm">
                    <Phone className="h-4 w-4 mr-2" />
                    Contact Agent
                  </Button>
                  <Button variant="outline" className="w-full" size="sm">
                    <Mail className="h-4 w-4 mr-2" />
                    Share Alert
                  </Button>
                  {alert.sourceUrl && (
                    <Button variant="outline" className="w-full" size="sm" asChild>
                      <a href={alert.sourceUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Listing
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Related Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-700">Related Alerts</CardTitle>
                  <CardDescription className="text-xs">
                    Similar properties in {alert.city}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-500 text-center py-4">
                    No related alerts found
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}