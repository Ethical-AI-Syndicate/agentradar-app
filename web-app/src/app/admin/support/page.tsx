'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  HeadphonesIcon, 
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Calendar,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { apiClient } from '@/lib/auth';
import { formatRelativeTime } from '@/lib/api';

interface SupportTicket {
  id: string;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'PENDING_USER' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    subscriptionTier: string;
  };
  assignedTo?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  _count: {
    messages: number;
  };
}

interface TicketsResponse {
  tickets: SupportTicket[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function AdminSupport() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    pages: 0
  });
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter && priorityFilter !== 'all') params.append('priority', priorityFilter);
      if (categoryFilter && categoryFilter !== 'all') params.append('category', categoryFilter);

      const response = await apiClient.get(`/admin/support/tickets?${params}`);
      const data: TicketsResponse = response.data;
      
      setTickets(data.tickets);
      setPagination(data.pagination);
    } catch (err: any) {
      console.error('Failed to fetch tickets:', err);
      setError(err.response?.data?.message || 'Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [pagination.page, pagination.limit, statusFilter, priorityFilter, categoryFilter]);

  const updateTicketStatus = async (ticketId: string, status: string, priority?: string) => {
    try {
      await apiClient.put(`/admin/support/tickets/${ticketId}`, {
        status,
        priority
      });
      fetchTickets(); // Refresh the list
    } catch (err: any) {
      console.error('Failed to update ticket:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      OPEN: { variant: 'destructive' as const, icon: AlertCircle, label: 'Open' },
      IN_PROGRESS: { variant: 'default' as const, icon: Clock, label: 'In Progress' },
      PENDING_USER: { variant: 'secondary' as const, icon: User, label: 'Pending User' },
      RESOLVED: { variant: 'outline' as const, icon: CheckCircle, label: 'Resolved' },
      CLOSED: { variant: 'secondary' as const, icon: CheckCircle, label: 'Closed' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.OPEN;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center">
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      LOW: { variant: 'secondary' as const, label: 'Low' },
      MEDIUM: { variant: 'outline' as const, label: 'Medium' },
      HIGH: { variant: 'default' as const, label: 'High' },
      URGENT: { variant: 'destructive' as const, label: 'Urgent' }
    };
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.MEDIUM;
    
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load support tickets</h3>
        <p className="text-sm text-gray-600 mb-4">{error}</p>
        <Button onClick={fetchTickets} variant="outline">
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
            <HeadphonesIcon className="h-6 w-6 mr-2" />
            Support Management
          </h1>
          <p className="text-gray-600">Manage customer support tickets and requests</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Open Tickets', value: tickets.filter(t => t.status === 'OPEN').length, color: 'text-red-600' },
          { label: 'In Progress', value: tickets.filter(t => t.status === 'IN_PROGRESS').length, color: 'text-blue-600' },
          { label: 'High Priority', value: tickets.filter(t => t.priority === 'HIGH' || t.priority === 'URGENT').length, color: 'text-amber-600' },
          { label: 'Total Tickets', value: pagination.total, color: 'text-gray-900' }
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">{stat.label}</div>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="PENDING_USER">Pending User</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="billing">Billing</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="feature_request">Feature Request</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Support Tickets ({pagination.total.toLocaleString()})
          </CardTitle>
          <CardDescription>
            Customer support requests and tickets
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">
                            {ticket.title}
                          </div>
                          <div className="text-sm text-gray-600 truncate max-w-xs">
                            {ticket.description}
                          </div>
                          {ticket.category && (
                            <div className="text-xs text-gray-500 mt-1">
                              Category: {ticket.category.replace('_', ' ')}
                            </div>
                          )}
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            {ticket._count.messages} messages
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">
                            {ticket.user.firstName} {ticket.user.lastName}
                          </div>
                          <div className="text-sm text-gray-600">{ticket.user.email}</div>
                          <div className="text-xs text-gray-500">
                            {ticket.user.subscriptionTier.replace('_', ' ')}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {getStatusBadge(ticket.status)}
                      </TableCell>
                      
                      <TableCell>
                        {getPriorityBadge(ticket.priority)}
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center text-gray-600">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatRelativeTime(ticket.createdAt)}
                          </div>
                          {ticket.assignedTo && (
                            <div className="text-xs text-gray-500 mt-1">
                              Assigned to: {ticket.assignedTo.firstName} {ticket.assignedTo.lastName}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {ticket.status === 'OPEN' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateTicketStatus(ticket.id, 'IN_PROGRESS')}
                            >
                              Start Working
                            </Button>
                          )}
                          {ticket.status === 'IN_PROGRESS' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateTicketStatus(ticket.id, 'RESOLVED')}
                            >
                              Resolve
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.pages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}