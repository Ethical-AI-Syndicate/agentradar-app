'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search,
  Filter,
  Heart,
  MapPin,
  Calendar,
  DollarSign,
  Home,
  Edit3,
  Trash2,
  Tag,
  Plus,
  Star,
  TrendingUp,
  ExternalLink,
  Loader2,
  Grid3x3,
  List
} from 'lucide-react';
import { 
  propertiesApi, 
  formatCurrency, 
  formatRelativeTime,
  type SavedProperty 
} from '@/lib/api';
import Link from 'next/link';

export default function PropertiesPage() {
  const [properties, setProperties] = useState<SavedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const loadProperties = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await propertiesApi.getSavedProperties({ limit: 50 });
        
        if (response.success) {
          setProperties(response.data);
        } else {
          setError('Failed to load properties');
          setProperties([]);
        }
      } catch (error) {
        console.error('Properties loading error:', error);
        setError('Failed to load properties');
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    loadProperties();
  }, []);

  const handleToggleFavorite = async (propertyId: string) => {
    try {
      setActionLoading(propertyId);
      const response = await propertiesApi.toggleFavorite(propertyId);
      if (response.success && response.data) {
        setProperties(properties.map(prop => 
          prop.id === propertyId 
            ? response.data!
            : prop
        ));
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm('Are you sure you want to remove this property from your saved list?')) return;

    try {
      setActionLoading(propertyId);
      const response = await propertiesApi.deleteProperty(propertyId);
      if (response.success) {
        setProperties(properties.filter(prop => prop.id !== propertyId));
      }
    } catch (error) {
      console.error('Failed to delete property:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredProperties = properties.filter(property => {
    const matchesFilter = filter === 'all' || 
      (filter === 'favorites' && property.isFavorite) ||
      (filter === 'recent' && new Date(property.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    
    const matchesSearch = searchQuery === '' || 
      property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: properties.length,
    favorites: properties.filter(p => p.isFavorite).length,
    totalValue: properties.reduce((sum, p) => sum + (p.price || 0), 0),
    avgValue: properties.length > 0 ? properties.reduce((sum, p) => sum + (p.price || 0), 0) / properties.length : 0
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                  ← Dashboard
                </Link>
                <h1 className="text-xl font-semibold text-gray-900">Saved Properties</h1>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search properties..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <div className="flex border rounded-lg">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-r-none"
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-l-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
                <Link href="/search">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Property
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
                <Home className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Favorites</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.favorites}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.avgValue)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filter Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {[
                  { key: 'all', label: 'All Properties' },
                  { key: 'favorites', label: 'Favorites' },
                  { key: 'recent', label: 'Recently Added' }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      filter === tab.key
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Properties List */}
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
              <p className="mt-2 text-gray-600">Loading properties...</p>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : filteredProperties.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery ? 'No properties match your search' : 'No saved properties yet'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery 
                    ? 'Try adjusting your search terms'
                    : 'Start building your property portfolio by saving properties you\'re interested in'
                  }
                </p>
                {!searchQuery && (
                  <Link href="/search">
                    <Button>
                      <Search className="h-4 w-4 mr-2" />
                      Search Properties
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className={
              viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }>
              {filteredProperties.map((property) => (
                <Card key={property.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className={viewMode === 'grid' ? 'p-4' : 'p-6'}>
                    {viewMode === 'grid' ? (
                      <>
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            {property.price && (
                              <div className="text-xl font-bold text-gray-900 mb-1">
                                {formatCurrency(property.price)}
                              </div>
                            )}
                            <div className="text-gray-800 font-medium mb-1">
                              {property.address}
                            </div>
                            <div className="text-gray-600 text-sm">
                              {property.city}, {property.province}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleFavorite(property.id)}
                            disabled={actionLoading === property.id}
                          >
                            {actionLoading === property.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Heart className={`h-4 w-4 ${
                                property.isFavorite 
                                  ? 'fill-red-500 text-red-500' 
                                  : 'text-gray-400'
                              }`} />
                            )}
                          </Button>
                        </div>

                        {property.propertyType && (
                          <Badge variant="outline" className="mb-3">
                            {property.propertyType}
                          </Badge>
                        )}

                        {property.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {property.tags.slice(0, 3).map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {property.tags.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{property.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}

                        {property.notes && (
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {property.notes}
                          </p>
                        )}

                        <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
                          <span>Saved {formatRelativeTime(property.createdAt)}</span>
                          {property.estimatedValue && property.price && (
                            <span className={`font-medium ${
                              property.estimatedValue > property.price ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {property.estimatedValue > property.price ? '+' : ''}
                              {formatCurrency(property.estimatedValue - property.price)}
                            </span>
                          )}
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex space-x-1">
                            <Button variant="outline" size="sm">
                              <Edit3 className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Tag className="h-3 w-3" />
                            </Button>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteProperty(property.id)}
                            disabled={actionLoading === property.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            {property.price && (
                              <div className="text-xl font-bold text-gray-900">
                                {formatCurrency(property.price)}
                              </div>
                            )}
                            {property.isFavorite && (
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            )}
                          </div>
                          
                          <div className="flex items-center text-gray-600 mb-2">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span className="font-medium">{property.address}</span>
                            <span className="mx-2">•</span>
                            <span>{property.city}, {property.province}</span>
                          </div>

                          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              <span>Saved {formatRelativeTime(property.createdAt)}</span>
                            </div>
                            {property.propertyType && (
                              <Badge variant="outline">{property.propertyType}</Badge>
                            )}
                          </div>

                          {property.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {property.tags.map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {property.notes && (
                            <p className="text-gray-600 text-sm mb-3">
                              {property.notes}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleFavorite(property.id)}
                            disabled={actionLoading === property.id}
                          >
                            {actionLoading === property.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Heart className={`h-4 w-4 ${
                                property.isFavorite 
                                  ? 'fill-red-500 text-red-500' 
                                  : 'text-gray-400'
                              }`} />
                            )}
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Tag className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteProperty(property.id)}
                            disabled={actionLoading === property.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}