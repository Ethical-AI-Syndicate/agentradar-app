'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ArrowLeft,
  Loader2,
  MapPin,
  DollarSign,
  Bell,
  AlertTriangle,
  Home
} from 'lucide-react';
import { alertsApi, type Alert as AlertType } from '@/lib/api';
import Link from 'next/link';

const alertSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  type: z.enum(['POWER_OF_SALE', 'FORECLOSURE', 'ESTATE_SALE', 'TAX_SALE']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  province: z.string().min(2, 'Province must be at least 2 characters'),
  postalCode: z.string().optional(),
  minPrice: z.number().min(0, 'Price must be positive').optional(),
  maxPrice: z.number().min(0, 'Price must be positive').optional(),
  description: z.string().optional(),
  sourceUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  caseNumber: z.string().optional(),
  saleDate: z.string().optional(),
  notifyEmail: z.boolean().default(true),
  notifyPush: z.boolean().default(true),
}).refine((data) => {
  if (data.minPrice && data.maxPrice && data.minPrice >= data.maxPrice) {
    return false;
  }
  return true;
}, {
  message: "Maximum price must be greater than minimum price",
  path: ["maxPrice"],
});

type AlertFormData = z.infer<typeof alertSchema>;

export default function CreateAlertPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AlertFormData>({
    resolver: zodResolver(alertSchema),
    defaultValues: {
      priority: 'MEDIUM',
      type: 'POWER_OF_SALE',
      notifyEmail: true,
      notifyPush: true,
    },
  });

  const watchedType = watch('type');
  const watchedPriority = watch('priority');

  const onSubmit = async (data: AlertFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const alertData = {
        title: data.title,
        type: data.type,
        priority: data.priority,
        address: data.address,
        city: data.city,
        province: data.province,
        postalCode: data.postalCode || undefined,
        price: data.minPrice || undefined,
        estimatedValue: data.maxPrice || undefined,
        description: data.description || undefined,
        sourceUrl: data.sourceUrl || undefined,
        caseNumber: data.caseNumber || undefined,
        saleDate: data.saleDate || undefined,
        status: 'ACTIVE' as const,
      };

      const response = await alertsApi.createAlert(alertData);
      
      if (response.success) {
        router.push('/alerts');
      } else {
        setError(response.message || 'Failed to create alert');
      }
    } catch (error) {
      console.error('Alert creation error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const alertTypeOptions = [
    { value: 'POWER_OF_SALE', label: 'Power of Sale', description: 'Properties being sold due to mortgage default' },
    { value: 'FORECLOSURE', label: 'Foreclosure', description: 'Court-ordered property sales' },
    { value: 'ESTATE_SALE', label: 'Estate Sale', description: 'Properties from estates and probate' },
    { value: 'TAX_SALE', label: 'Tax Sale', description: 'Properties sold for unpaid taxes' },
  ];

  const priorityOptions = [
    { value: 'LOW', label: 'Low', color: 'text-green-600', description: 'Monitor when convenient' },
    { value: 'MEDIUM', label: 'Medium', color: 'text-yellow-600', description: 'Regular monitoring' },
    { value: 'HIGH', label: 'High', color: 'text-red-600', description: 'Priority monitoring' },
    { value: 'URGENT', label: 'Urgent', color: 'text-red-800', description: 'Immediate attention required' },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16">
              <Link href="/alerts" className="flex items-center text-gray-500 hover:text-gray-700">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Alerts
              </Link>
              <h1 className="ml-4 text-xl font-semibold text-gray-900">Create New Alert</h1>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="h-5 w-5 mr-2" />
                    Alert Details
                  </CardTitle>
                  <CardDescription>
                    Set up a new property alert to monitor opportunities that match your criteria
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
                      
                      <div>
                        <Label htmlFor="title">Alert Title</Label>
                        <Input
                          {...register('title')}
                          placeholder="e.g., Downtown Toronto Power of Sales"
                          className="mt-1"
                          disabled={isLoading}
                        />
                        {errors.title && (
                          <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="type">Alert Type</Label>
                          <Select
                            onValueChange={(value) => setValue('type', value as any)}
                            defaultValue="POWER_OF_SALE"
                            disabled={isLoading}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {alertTypeOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.type && (
                            <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="priority">Priority</Label>
                          <Select
                            onValueChange={(value) => setValue('priority', value as any)}
                            defaultValue="MEDIUM"
                            disabled={isLoading}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {priorityOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  <span className={option.color}>{option.label}</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.priority && (
                            <p className="mt-1 text-sm text-red-600">{errors.priority.message}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900 flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        Location
                      </h3>
                      
                      <div>
                        <Label htmlFor="address">Address or Area</Label>
                        <Input
                          {...register('address')}
                          placeholder="e.g., King Street West, Toronto"
                          className="mt-1"
                          disabled={isLoading}
                        />
                        {errors.address && (
                          <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="city">City</Label>
                          <Input
                            {...register('city')}
                            placeholder="Toronto"
                            className="mt-1"
                            disabled={isLoading}
                          />
                          {errors.city && (
                            <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="province">Province</Label>
                          <Input
                            {...register('province')}
                            placeholder="ON"
                            className="mt-1"
                            disabled={isLoading}
                          />
                          {errors.province && (
                            <p className="mt-1 text-sm text-red-600">{errors.province.message}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="postalCode">Postal Code (Optional)</Label>
                          <Input
                            {...register('postalCode')}
                            placeholder="M5V 3A8"
                            className="mt-1"
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Price Range */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900 flex items-center">
                        <DollarSign className="h-4 w-4 mr-2" />
                        Price Range (Optional)
                      </h3>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="minPrice">Minimum Price</Label>
                          <Input
                            {...register('minPrice', { valueAsNumber: true })}
                            type="number"
                            placeholder="500000"
                            className="mt-1"
                            disabled={isLoading}
                          />
                          {errors.minPrice && (
                            <p className="mt-1 text-sm text-red-600">{errors.minPrice.message}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="maxPrice">Maximum Price</Label>
                          <Input
                            {...register('maxPrice', { valueAsNumber: true })}
                            type="number"
                            placeholder="1000000"
                            className="mt-1"
                            disabled={isLoading}
                          />
                          {errors.maxPrice && (
                            <p className="mt-1 text-sm text-red-600">{errors.maxPrice.message}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Additional Details */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">Additional Details</h3>
                      
                      <div>
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                          {...register('description')}
                          placeholder="Add any additional criteria or notes..."
                          className="mt-1"
                          rows={3}
                          disabled={isLoading}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="caseNumber">Case Number (Optional)</Label>
                          <Input
                            {...register('caseNumber')}
                            placeholder="CV-24-123456"
                            className="mt-1"
                            disabled={isLoading}
                          />
                        </div>

                        <div>
                          <Label htmlFor="saleDate">Sale Date (Optional)</Label>
                          <Input
                            {...register('saleDate')}
                            type="date"
                            className="mt-1"
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="sourceUrl">Source URL (Optional)</Label>
                        <Input
                          {...register('sourceUrl')}
                          type="url"
                          placeholder="https://example.com/listing"
                          className="mt-1"
                          disabled={isLoading}
                        />
                        {errors.sourceUrl && (
                          <p className="mt-1 text-sm text-red-600">{errors.sourceUrl.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end space-x-4">
                      <Link href="/alerts">
                        <Button type="button" variant="outline" disabled={isLoading}>
                          Cancel
                        </Button>
                      </Link>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating Alert...
                          </>
                        ) : (
                          'Create Alert'
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Preview Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-700">Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="p-1 bg-white rounded">
                        {watchedType === 'POWER_OF_SALE' && <Home className="h-3 w-3" />}
                        {watchedType === 'FORECLOSURE' && <AlertTriangle className="h-3 w-3" />}
                        {watchedType === 'ESTATE_SALE' && <Bell className="h-3 w-3" />}
                        {watchedType === 'TAX_SALE' && <DollarSign className="h-3 w-3" />}
                      </div>
                      <span className="text-xs text-gray-600 uppercase tracking-wide">
                        {watchedType?.replace('_', ' ')}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        watchedPriority === 'LOW' ? 'bg-green-100 text-green-700' :
                        watchedPriority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                        watchedPriority === 'HIGH' ? 'bg-red-100 text-red-700' :
                        'bg-red-200 text-red-800'
                      }`}>
                        {watchedPriority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 font-medium">
                      {watch('title') || 'Alert Title'}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {watch('address') || 'Address'}, {watch('city') || 'City'}
                    </p>
                  </div>

                  <div className="text-xs text-gray-500 space-y-1">
                    <p><strong>Type:</strong> {alertTypeOptions.find(t => t.value === watchedType)?.description}</p>
                    <p><strong>Priority:</strong> {priorityOptions.find(p => p.value === watchedPriority)?.description}</p>
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