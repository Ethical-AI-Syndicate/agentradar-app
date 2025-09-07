'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search,
  Filter,
  MapPin,
  Calendar,
  DollarSign,
  Home,
  Bed,
  Bath,
  Square,
  TrendingUp,
  Heart,
  ExternalLink,
  SlidersHorizontal,
  X,
  Loader2,
  ArrowUpDown,
  Grid3x3,
  List
} from 'lucide-react';
import { 
  searchApi, 
  propertiesApi,
  formatCurrency, 
  formatDate,
  type PropertySearchParams,
  type PropertySearchResult 
} from '@/lib/api';
import Link from 'next/link';

const searchSchema = z.object({
  query: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  propertyType: z.string().optional(),
  bedrooms: z.number().min(0).optional(),
  bathrooms: z.number().min(0).optional(),
  radius: z.number().min(1).max(100).optional(),
  sortBy: z.enum(['price', 'date', 'relevance']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
}).refine((data) => {
  if (data.minPrice && data.maxPrice && data.minPrice >= data.maxPrice) {
    return false;
  }
  return true;
}, {
  message: "Maximum price must be greater than minimum price",
  path: ["maxPrice"],
});

type SearchFormData = z.infer<typeof searchSchema>;

function SearchPageContent() {
  const searchParams = useSearchParams();
  const [results, setResults] = useState<PropertySearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [savedProperties, setSavedProperties] = useState<Set<string>>(new Set());
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      sortBy: 'relevance',
      sortOrder: 'desc',
      radius: 25
    },
  });

  const watchedValues = watch();

  // Initialize form from URL params
  useEffect(() => {
    const query = searchParams.get('q');
    const city = searchParams.get('city');
    const type = searchParams.get('type');
    
    if (query) setValue('query', query);
    if (city) setValue('city', city);
    if (type) setValue('propertyType', type);
    
    // Trigger initial search if we have params
    if (query || city || type) {
      handleSearch({
        query: query || undefined,
        city: city || undefined,
        propertyType: type || undefined,
        ...watchedValues
      });
    }
  }, [searchParams, setValue]);

  const handleSearch = useCallback(async (searchData: SearchFormData, page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params: PropertySearchParams = {
        ...searchData,
        page,
        limit: pagination.limit
      };

      const response = await searchApi.searchProperties(params);
      
      if (response.success) {
        setResults(response.data);
        setPagination(response.pagination);
      } else {
        setError('Search failed. Please try again.');
        setResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('An error occurred while searching. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.limit]);

  const onSubmit = (data: SearchFormData) => {
    handleSearch(data, 1);
  };

  const handleSaveProperty = async (property: PropertySearchResult) => {
    try {
      const propertyData = {
        address: property.address,
        city: property.city,
        province: property.province,
        postalCode: property.postalCode,
        propertyType: property.propertyType,
        price: property.price,
        estimatedValue: property.estimatedValue,
        notes: '',
        tags: [],
        isFavorite: false
      };

      const response = await propertiesApi.saveProperty(propertyData);
      if (response.success) {
        setSavedProperties(prev => new Set(prev.add(property.id)));
      }
    } catch (error) {
      console.error('Failed to save property:', error);
    }
  };

  const clearFilters = () => {
    reset({
      sortBy: 'relevance',
      sortOrder: 'desc',
      radius: 25
    });
    setResults([]);
  };

  const propertyTypes = [
    'House', 'Condo', 'Townhouse', 'Apartment', 'Duplex', 'Commercial', 'Land'
  ];

  const provinces = [
    'ON', 'BC', 'AB', 'SK', 'MB', 'QC', 'NB', 'NS', 'PE', 'NL', 'NT', 'NU', 'YT'
  ];

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
                <h1 className="text-xl font-semibold text-gray-900">Property Search</h1>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
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
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Search Bar */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      {...register('query')}
                      placeholder="Search by address, neighborhood, or keyword..."
                      className="pl-10"
                      disabled={loading}
                    />
                  </div>
                  <div className="w-48">
                    <Input
                      {...register('city')}
                      placeholder="City"
                      disabled={loading}
                    />
                  </div>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Advanced Filters */}
                {showFilters && (
                  <div className="pt-4 border-t space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      <div>
                        <Label htmlFor="province">Province</Label>
                        <Select
                          onValueChange={(value) => setValue('province', value === 'all' ? undefined : value)}
                          disabled={loading}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Any" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Any Province</SelectItem>
                            {provinces.map((province) => (
                              <SelectItem key={province} value={province}>
                                {province}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="propertyType">Property Type</Label>
                        <Select
                          onValueChange={(value) => setValue('propertyType', value === 'all' ? undefined : value)}
                          disabled={loading}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Any" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Any Type</SelectItem>
                            {propertyTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="minPrice">Min Price</Label>
                        <Input
                          {...register('minPrice', { valueAsNumber: true })}
                          type="number"
                          placeholder="0"
                          className="mt-1"
                          disabled={loading}
                        />
                      </div>

                      <div>
                        <Label htmlFor="maxPrice">Max Price</Label>
                        <Input
                          {...register('maxPrice', { valueAsNumber: true })}
                          type="number"
                          placeholder="No limit"
                          className="mt-1"
                          disabled={loading}
                        />
                      </div>

                      <div>
                        <Label htmlFor="bedrooms">Bedrooms</Label>
                        <Select
                          onValueChange={(value) => setValue('bedrooms', value === 'all' ? undefined : parseInt(value))}
                          disabled={loading}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Any" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Any</SelectItem>
                            {[1, 2, 3, 4, 5].map((num) => (
                              <SelectItem key={num} value={num.toString()}>
                                {num}+ bed{num > 1 ? 's' : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="bathrooms">Bathrooms</Label>
                        <Select
                          onValueChange={(value) => setValue('bathrooms', value === 'all' ? undefined : parseInt(value))}
                          disabled={loading}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Any" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Any</SelectItem>
                            {[1, 2, 3, 4, 5].map((num) => (
                              <SelectItem key={num} value={num.toString()}>
                                {num}+ bath{num > 1 ? 's' : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Label htmlFor="sortBy" className="text-sm">Sort by:</Label>
                          <Select
                            onValueChange={(value) => setValue('sortBy', value as any)}
                            defaultValue="relevance"
                            disabled={loading}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="relevance">Relevance</SelectItem>
                              <SelectItem value="price">Price</SelectItem>
                              <SelectItem value="date">Date Listed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setValue('sortOrder', watchedValues.sortOrder === 'asc' ? 'desc' : 'asc')}
                        >
                          <ArrowUpDown className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={clearFilters}
                      >
                        Clear Filters
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Results */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {results.length > 0 && (
            <div className="mb-4 flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Showing {results.length} of {pagination.total} results
              </p>
              <div className="text-sm text-gray-500">
                Page {pagination.page} of {pagination.pages}
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
              <p className="mt-2 text-gray-600">Searching properties...</p>
            </div>
          ) : results.length === 0 ? (
            !watchedValues.query && !watchedValues.city ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Start Your Search</h3>
                  <p className="text-gray-500 mb-4">
                    Enter a location, address, or keyword to find properties
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Found</h3>
                  <p className="text-gray-500 mb-4">
                    Try adjusting your search criteria or filters
                  </p>
                  <Button onClick={clearFilters} variant="outline">
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            )
          ) : (
            <div className={
              viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }>
              {results.map((property) => (
                <Card key={property.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className={viewMode === 'grid' ? 'p-0' : 'p-6'}>
                    {viewMode === 'grid' ? (
                      <>
                        {property.images && property.images.length > 0 ? (
                          <div className="aspect-video bg-gray-200 rounded-t-lg">
                            <img
                              src={property.images[0]}
                              alt={property.address}
                              className="w-full h-full object-cover rounded-t-lg"
                            />
                          </div>
                        ) : (
                          <div className="aspect-video bg-gray-200 rounded-t-lg flex items-center justify-center">
                            <Home className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              {property.price && (
                                <div className="text-2xl font-bold text-gray-900 mb-1">
                                  {formatCurrency(property.price)}
                                </div>
                              )}
                              <div className="text-gray-600 text-sm mb-1">
                                {property.address}
                              </div>
                              <div className="text-gray-500 text-sm">
                                {property.city}, {property.province}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSaveProperty(property)}
                              disabled={savedProperties.has(property.id)}
                            >
                              <Heart className={`h-4 w-4 ${
                                savedProperties.has(property.id) 
                                  ? 'fill-red-500 text-red-500' 
                                  : 'text-gray-400'
                              }`} />
                            </Button>
                          </div>
                          
                          {(property.bedrooms || property.bathrooms || property.squareFeet) && (
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                              {property.bedrooms && (
                                <div className="flex items-center">
                                  <Bed className="h-4 w-4 mr-1" />
                                  {property.bedrooms}
                                </div>
                              )}
                              {property.bathrooms && (
                                <div className="flex items-center">
                                  <Bath className="h-4 w-4 mr-1" />
                                  {property.bathrooms}
                                </div>
                              )}
                              {property.squareFeet && (
                                <div className="flex items-center">
                                  <Square className="h-4 w-4 mr-1" />
                                  {property.squareFeet.toLocaleString()} sq ft
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex justify-between items-center">
                            <div className="text-xs text-gray-500">
                              {property.listingDate && `Listed ${formatDate(property.listingDate)}`}
                            </div>
                            {property.sourceUrl && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={property.sourceUrl} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex space-x-4">
                        {property.images && property.images.length > 0 ? (
                          <div className="w-48 h-32 bg-gray-200 rounded-lg flex-shrink-0">
                            <img
                              src={property.images[0]}
                              alt={property.address}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          </div>
                        ) : (
                          <div className="w-48 h-32 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Home className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                        
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              {property.price && (
                                <div className="text-2xl font-bold text-gray-900 mb-1">
                                  {formatCurrency(property.price)}
                                </div>
                              )}
                              <div className="text-lg font-medium text-gray-800 mb-1">
                                {property.address}
                              </div>
                              <div className="text-gray-600">
                                {property.city}, {property.province}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSaveProperty(property)}
                              disabled={savedProperties.has(property.id)}
                            >
                              <Heart className={`h-4 w-4 ${
                                savedProperties.has(property.id) 
                                  ? 'fill-red-500 text-red-500' 
                                  : 'text-gray-400'
                              }`} />
                            </Button>
                          </div>

                          {(property.bedrooms || property.bathrooms || property.squareFeet) && (
                            <div className="flex items-center space-x-6 text-sm text-gray-500 mb-3">
                              {property.bedrooms && (
                                <div className="flex items-center">
                                  <Bed className="h-4 w-4 mr-1" />
                                  {property.bedrooms} bed{property.bedrooms > 1 ? 's' : ''}
                                </div>
                              )}
                              {property.bathrooms && (
                                <div className="flex items-center">
                                  <Bath className="h-4 w-4 mr-1" />
                                  {property.bathrooms} bath{property.bathrooms > 1 ? 's' : ''}
                                </div>
                              )}
                              {property.squareFeet && (
                                <div className="flex items-center">
                                  <Square className="h-4 w-4 mr-1" />
                                  {property.squareFeet.toLocaleString()} sq ft
                                </div>
                              )}
                            </div>
                          )}

                          {property.description && (
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                              {property.description}
                            </p>
                          )}

                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              {property.listingDate && (
                                <span>Listed {formatDate(property.listingDate)}</span>
                              )}
                              {property.propertyType && (
                                <Badge variant="outline">{property.propertyType}</Badge>
                              )}
                            </div>
                            {property.sourceUrl && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={property.sourceUrl} target="_blank" rel="noopener noreferrer">
                                  View Details
                                  <ExternalLink className="h-3 w-3 ml-2" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-8 flex justify-center">
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => handleSearch(watchedValues, pagination.page - 1)}
                  disabled={pagination.page <= 1 || loading}
                >
                  Previous
                </Button>
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={page === pagination.page ? 'default' : 'outline'}
                      onClick={() => handleSearch(watchedValues, page)}
                      disabled={loading}
                    >
                      {page}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  onClick={() => handleSearch(watchedValues, pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}