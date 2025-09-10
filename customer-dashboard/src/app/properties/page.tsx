'use client';

import React, { useState, useEffect } from 'react';
import { useRequireAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/DashboardLayout';
import { apiClient } from '@/lib/auth';

interface Property {
  id: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
  propertyType: string;
  listingDate: string;
  daysOnMarket: number;
  mlsNumber: string;
  description: string;
  features: string[];
  images: string[];
  opportunityScore?: number;
  isBookmarked?: boolean;
}

interface SearchFilters {
  city: string;
  propertyType: string;
  minPrice: number;
  maxPrice: number;
  minBedrooms: number;
  maxBedrooms: number;
  minBathrooms: number;
  maxBathrooms: number;
  minSquareFootage: number;
  maxSquareFootage: number;
  maxDaysOnMarket: number;
}

export default function PropertiesPage() {
  const auth = useRequireAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchPerformed, setSearchPerformed] = useState(false);
  
  const [filters, setFilters] = useState<SearchFilters>({
    city: '',
    propertyType: '',
    minPrice: 0,
    maxPrice: 5000000,
    minBedrooms: 1,
    maxBedrooms: 10,
    minBathrooms: 1,
    maxBathrooms: 8,
    minSquareFootage: 500,
    maxSquareFootage: 10000,
    maxDaysOnMarket: 365
  });

  const searchProperties = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
      
      const response = await apiClient.get(`/api/health?action=search-properties&${params.toString()}`);
      
      if (response.data.success) {
        setProperties(response.data.properties || []);
      } else {
        setError(response.data.error || 'Search failed');
      }
      setSearchPerformed(true);
    } catch (err) {
      setError('Network error occurred');
      console.error('Property search error:', err);
      
      // Mock data for development
      setProperties([
        {
          id: '1',
          address: '123 Main Street',
          city: 'Toronto',
          province: 'ON',
          postalCode: 'M1A 1A1',
          price: 1250000,
          bedrooms: 4,
          bathrooms: 3,
          squareFootage: 2500,
          propertyType: 'Detached',
          listingDate: '2025-01-01',
          daysOnMarket: 15,
          mlsNumber: 'N7654321',
          description: 'Beautiful family home in prime location with modern updates throughout.',
          features: ['Hardwood Floors', 'Updated Kitchen', 'Finished Basement', 'Garage'],
          images: ['/api/placeholder/400/300'],
          opportunityScore: 85,
          isBookmarked: false
        },
        {
          id: '2',
          address: '456 Oak Avenue',
          city: 'Vaughan',
          province: 'ON',
          postalCode: 'L4J 2B2',
          price: 950000,
          bedrooms: 3,
          bathrooms: 2,
          squareFootage: 1800,
          propertyType: 'Semi-Detached',
          listingDate: '2024-12-28',
          daysOnMarket: 22,
          mlsNumber: 'N8765432',
          description: 'Charming semi-detached home with large backyard and close to schools.',
          features: ['Renovated Kitchen', 'Large Backyard', 'Close to Schools', 'Updated Bathrooms'],
          images: ['/api/placeholder/400/300'],
          opportunityScore: 72,
          isBookmarked: true
        },
        {
          id: '3',
          address: '789 Pine Street',
          city: 'Mississauga',
          province: 'ON',
          postalCode: 'L5B 3C3',
          price: 2100000,
          bedrooms: 5,
          bathrooms: 4,
          squareFootage: 3200,
          propertyType: 'Detached',
          listingDate: '2024-12-20',
          daysOnMarket: 30,
          mlsNumber: 'N9876543',
          description: 'Executive home with luxury finishes and premium location.',
          features: ['Luxury Finishes', 'Home Theater', 'Wine Cellar', 'Triple Garage'],
          images: ['/api/placeholder/400/300'],
          opportunityScore: 92,
          isBookmarked: false
        }
      ]);
      setSearchPerformed(true);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBookmark = async (propertyId: string, isBookmarked: boolean) => {
    try {
      const action = isBookmarked ? 'remove-property-bookmark' : 'add-property-bookmark';
      await apiClient.post(`/api/health?action=${action}`, { propertyId });
      
      setProperties(prev => prev.map(property => 
        property.id === propertyId ? { ...property, isBookmarked: !isBookmarked } : property
      ));
    } catch (error) {
      console.error('Bookmark error:', error);
      
      // Mock update for development
      setProperties(prev => prev.map(property => 
        property.id === propertyId ? { ...property, isBookmarked: !isBookmarked } : property
      ));
    }
  };

  const getOpportunityScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const resetFilters = () => {
    setFilters({
      city: '',
      propertyType: '',
      minPrice: 0,
      maxPrice: 5000000,
      minBedrooms: 1,
      maxBedrooms: 10,
      minBathrooms: 1,
      maxBathrooms: 8,
      minSquareFootage: 500,
      maxSquareFootage: 10000,
      maxDaysOnMarket: 365
    });
    setProperties([]);
    setSearchPerformed(false);
  };

  if (auth.isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Property Search</h1>
            <p className="text-gray-600 mt-1">Find and analyze properties with AI insights</p>
          </div>
        </div>

        {/* Search Filters */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Search Filters</h2>
            <button
              onClick={resetFilters}
              className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
            >
              Reset Filters
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
              <select 
                value={filters.city} 
                onChange={(e) => handleFilterChange('city', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Cities</option>
                <option value="Toronto">Toronto</option>
                <option value="Mississauga">Mississauga</option>
                <option value="Brampton">Brampton</option>
                <option value="Vaughan">Vaughan</option>
                <option value="Markham">Markham</option>
                <option value="Richmond Hill">Richmond Hill</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
              <select 
                value={filters.propertyType} 
                onChange={(e) => handleFilterChange('propertyType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="Detached">Detached</option>
                <option value="Semi-Detached">Semi-Detached</option>
                <option value="Townhouse">Townhouse</option>
                <option value="Condo">Condominium</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Min Price</label>
              <input
                type="number"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Min Price"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Price</label>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Max Price"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={filters.minBedrooms}
                  onChange={(e) => handleFilterChange('minBedrooms', parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Min"
                />
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={filters.maxBedrooms}
                  onChange={(e) => handleFilterChange('maxBedrooms', parseInt(e.target.value) || 10)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Max"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={filters.minBathrooms}
                  onChange={(e) => handleFilterChange('minBathrooms', parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Min"
                />
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={filters.maxBathrooms}
                  onChange={(e) => handleFilterChange('maxBathrooms', parseInt(e.target.value) || 8)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Max"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Square Footage</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={filters.minSquareFootage}
                  onChange={(e) => handleFilterChange('minSquareFootage', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Min sqft"
                />
                <input
                  type="number"
                  value={filters.maxSquareFootage}
                  onChange={(e) => handleFilterChange('maxSquareFootage', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Max sqft"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Days on Market</label>
              <input
                type="number"
                value={filters.maxDaysOnMarket}
                onChange={(e) => handleFilterChange('maxDaysOnMarket', parseInt(e.target.value) || 365)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Max days"
              />
            </div>
          </div>
          
          <div className="flex justify-center">
            <button
              onClick={searchProperties}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center"
            >
              {loading ? (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
              {loading ? 'Searching...' : 'Search Properties'}
            </button>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Results */}
        {searchPerformed && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Search Results</h2>
                <span className="text-sm text-gray-500">{properties.length} properties found</span>
              </div>
            </div>
            
            {properties.length === 0 ? (
              <div className="p-12 text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
                <p className="text-gray-500">Try adjusting your search filters to see more results.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {properties.map((property) => (
                  <div key={property.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start space-x-4">
                      <div className="w-32 h-24 bg-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {property.address}
                              </h3>
                              {property.opportunityScore && (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getOpportunityScoreColor(property.opportunityScore)}`}>
                                  Score: {property.opportunityScore}
                                </span>
                              )}
                            </div>
                            
                            <p className="text-gray-600 mb-3">
                              {property.city}, {property.province} {property.postalCode}
                            </p>
                            
                            <div className="flex items-center space-x-6 text-sm text-gray-500 mb-3">
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v3H8V5z" />
                                </svg>
                                {property.bedrooms} BR
                              </span>
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                                </svg>
                                {property.bathrooms} BA
                              </span>
                              <span>{property.squareFootage.toLocaleString()} sqft</span>
                              <span>{property.propertyType}</span>
                              <span>{property.daysOnMarket} days on market</span>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-3">{property.description}</p>
                            
                            <div className="flex flex-wrap gap-2 mb-3">
                              {property.features.slice(0, 4).map((feature, index) => (
                                <span 
                                  key={index}
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                  {feature}
                                </span>
                              ))}
                              {property.features.length > 4 && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                  +{property.features.length - 4} more
                                </span>
                              )}
                            </div>
                            
                            <div className="text-xs text-gray-500">
                              MLS®: {property.mlsNumber} • Listed: {new Date(property.listingDate).toLocaleDateString()}
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end space-y-2">
                            <div className="text-2xl font-bold text-gray-900">
                              ${property.price.toLocaleString()}
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleBookmark(property.id, property.isBookmarked || false)}
                                className={`p-2 rounded-lg transition-colors ${
                                  property.isBookmarked 
                                    ? 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100' 
                                    : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
                                }`}
                                title={property.isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
                              >
                                <svg className="w-5 h-5" fill={property.isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                </svg>
                              </button>
                              
                              <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}