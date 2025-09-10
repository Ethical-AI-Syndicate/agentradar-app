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
import { 
  BookOpen,
  Plus,
  Edit3,
  Trash2,
  Users,
  Award,
  TrendingUp,
  BarChart3,
  Play,
  FileText,
  Video,
  Clock,
  Star,
  Eye,
  Download,
  Upload,
  Settings
} from 'lucide-react'

interface Course {
  id: string
  title: string
  description: string
  category: string
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  duration: string
  lessons: number
  enrolled: number
  rating: number
  instructor: string
  price: number
  isPublished: boolean
  createdAt: string
  updatedAt: string
  tags: string[]
  thumbnail: string
  learningObjectives: string[]
}

interface Student {
  id: string
  name: string
  email: string
  enrolledCourses: number
  completedCourses: number
  totalProgress: number
  lastActivity: string
  certificationsEarned: number
}

interface Analytics {
  totalCourses: number
  totalStudents: number
  totalEnrollments: number
  averageCompletion: number
  topCourses: Array<{
    id: string
    title: string
    enrollments: number
    completion: number
  }>
  recentActivity: Array<{
    id: string
    type: 'enrollment' | 'completion' | 'certification'
    student: string
    course: string
    date: string
  }>
}

export default function LMSAdminPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [analytics, setAnalytics] = useState<Analytics>({
    totalCourses: 0,
    totalStudents: 0,
    totalEnrollments: 0,
    averageCompletion: 0,
    topCourses: [],
    recentActivity: []
  })
  const [activeTab, setActiveTab] = useState('overview')
  const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [isEditCourseOpen, setIsEditCourseOpen] = useState(false)

  // Fetch real data from API
  useEffect(() => {
    fetchCourses()
    fetchStudents()
    fetchAnalytics()
  }, [])

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/lms/admin/courses', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setCourses(data.data.courses)
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
      // Fallback to mock data for development
      const mockCourses: Course[] = [
      {
        id: '1',
        title: 'Real Estate Investment Fundamentals',
        description: 'Learn the basics of real estate investment, including property analysis, financing, and market research.',
        category: 'Investment',
        level: 'Beginner',
        duration: '4 hours',
        lessons: 12,
        enrolled: 156,
        rating: 4.8,
        instructor: 'Sarah Johnson',
        price: 297,
        isPublished: true,
        createdAt: '2024-08-15',
        updatedAt: '2024-09-01',
        tags: ['investment', 'fundamentals', 'analysis'],
        thumbnail: '/api/placeholder/400/300',
        learningObjectives: [
          'Understand real estate market fundamentals',
          'Learn property analysis techniques',
          'Master financing options and strategies'
        ]
      },
      {
        id: '2',
        title: 'Advanced Negotiation Strategies',
        description: 'Master advanced negotiation techniques specifically for real estate transactions.',
        category: 'Sales',
        level: 'Advanced',
        duration: '6 hours',
        lessons: 18,
        enrolled: 89,
        rating: 4.9,
        instructor: 'Michael Chen',
        price: 497,
        isPublished: true,
        createdAt: '2024-07-20',
        updatedAt: '2024-08-25',
        tags: ['negotiation', 'sales', 'psychology'],
        thumbnail: '/api/placeholder/400/300',
        learningObjectives: [
          'Master psychological principles of negotiation',
          'Handle difficult clients and situations',
          'Close deals with confidence'
        ]
      },
      {
        id: '3',
        title: 'Market Analysis and Trends',
        description: 'Learn to analyze market trends and make data-driven decisions in real estate.',
        category: 'Analysis',
        level: 'Intermediate',
        duration: '5 hours',
        lessons: 15,
        enrolled: 203,
        rating: 4.7,
        instructor: 'Emily Rodriguez',
        price: 397,
        isPublished: false,
        createdAt: '2024-09-01',
        updatedAt: '2024-09-08',
        tags: ['analysis', 'trends', 'data'],
        thumbnail: '/api/placeholder/400/300',
        learningObjectives: [
          'Interpret market data and statistics',
          'Identify emerging market trends',
          'Make informed investment decisions'
        ]
      }
    ]

    const mockStudents: Student[] = [
      {
        id: '1',
        name: 'Alex Thompson',
        email: 'alex@example.com',
        enrolledCourses: 3,
        completedCourses: 2,
        totalProgress: 85,
        lastActivity: '2024-09-08',
        certificationsEarned: 2
      },
      {
        id: '2',
        name: 'Jessica Park',
        email: 'jessica@example.com',
        enrolledCourses: 2,
        completedCourses: 1,
        totalProgress: 60,
        lastActivity: '2024-09-07',
        certificationsEarned: 1
      },
      {
        id: '3',
        name: 'Robert Kim',
        email: 'robert@example.com',
        enrolledCourses: 4,
        completedCourses: 3,
        totalProgress: 92,
        lastActivity: '2024-09-09',
        certificationsEarned: 3
      }
    ]

    const mockAnalytics: Analytics = {
      totalCourses: 15,
      totalStudents: 448,
      totalEnrollments: 1247,
      averageCompletion: 73,
      topCourses: [
        { id: '1', title: 'Real Estate Investment Fundamentals', enrollments: 156, completion: 78 },
        { id: '2', title: 'Market Analysis and Trends', enrollments: 203, completion: 65 },
        { id: '3', title: 'Advanced Negotiation Strategies', enrollments: 89, completion: 88 }
      ],
      recentActivity: [
        { id: '1', type: 'completion', student: 'Alex Thompson', course: 'Investment Fundamentals', date: '2024-09-09' },
        { id: '2', type: 'enrollment', student: 'Jessica Park', course: 'Market Analysis', date: '2024-09-08' },
        { id: '3', type: 'certification', student: 'Robert Kim', course: 'Negotiation Strategies', date: '2024-09-07' }
      ]
    }

      setCourses(mockCourses)
    }
  }

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/admin/users?role=USER', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      })
      const data = await response.json()
      if (data.success) {
        // Transform user data to student data
        const studentData = data.data.users.map((user: any) => ({
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          enrolledCourses: user.courseEnrollments?.length || 0,
          completedCourses: user.courseEnrollments?.filter((e: any) => e.progress === 100).length || 0,
          totalProgress: user.courseEnrollments?.length > 0 
            ? Math.round(user.courseEnrollments.reduce((sum: number, e: any) => sum + e.progress, 0) / user.courseEnrollments.length)
            : 0,
          lastActivity: user.lastLogin || user.updatedAt,
          certificationsEarned: user.certifications?.length || 0
        }))
        setStudents(studentData)
      }
    } catch (error) {
      console.error('Error fetching students:', error)
      // Fallback to mock data
      const mockStudents: Student[] = [
        {
          id: '1',
          name: 'Alex Thompson',
          email: 'alex@example.com',
          enrolledCourses: 3,
          completedCourses: 2,
          totalProgress: 85,
          lastActivity: '2024-09-08',
          certificationsEarned: 2
        },
        {
          id: '2',
          name: 'Jessica Park',
          email: 'jessica@example.com',
          enrolledCourses: 2,
          completedCourses: 1,
          totalProgress: 60,
          lastActivity: '2024-09-07',
          certificationsEarned: 1
        },
        {
          id: '3',
          name: 'Robert Kim',
          email: 'robert@example.com',
          enrolledCourses: 4,
          completedCourses: 3,
          totalProgress: 92,
          lastActivity: '2024-09-09',
          certificationsEarned: 3
        }
      ]
      setStudents(mockStudents)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/lms/admin/analytics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setAnalytics({
          totalCourses: data.data.summary.totalCourses,
          totalStudents: data.data.summary.totalStudents,
          totalEnrollments: data.data.summary.totalEnrollments,
          averageCompletion: data.data.summary.averageCompletion,
          topCourses: data.data.topCourses.map((course: any) => ({
            id: course.id,
            title: course.title,
            enrollments: course.enrollments,
            completion: Math.round(course.completionRate)
          })),
          recentActivity: data.data.recentEnrollments.map((enrollment: any) => ({
            id: enrollment.id,
            type: 'enrollment' as const,
            student: `${enrollment.user.firstName} ${enrollment.user.lastName}`,
            course: enrollment.course.title,
            date: new Date(enrollment.enrolledAt).toLocaleDateString()
          }))
        })
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
      // Fallback to mock data
      const mockAnalytics: Analytics = {
        totalCourses: 15,
        totalStudents: 448,
        totalEnrollments: 1247,
        averageCompletion: 73,
        topCourses: [
          { id: '1', title: 'Real Estate Investment Fundamentals', enrollments: 156, completion: 78 },
          { id: '2', title: 'Market Analysis and Trends', enrollments: 203, completion: 65 },
          { id: '3', title: 'Advanced Negotiation Strategies', enrollments: 89, completion: 88 }
        ],
        recentActivity: [
          { id: '1', type: 'completion', student: 'Alex Thompson', course: 'Investment Fundamentals', date: '2024-09-09' },
          { id: '2', type: 'enrollment', student: 'Jessica Park', course: 'Market Analysis', date: '2024-09-08' },
          { id: '3', type: 'certification', student: 'Robert Kim', course: 'Negotiation Strategies', date: '2024-09-07' }
        ]
      }
      setAnalytics(mockAnalytics)
    }
  }

  const handleCreateCourse = async (courseData: any) => {
    try {
      const response = await fetch('/api/lms/admin/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(courseData)
      })
      const data = await response.json()
      if (data.success) {
        setCourses([...courses, data.data])
        setIsCreateCourseOpen(false)
        // Show success message
      } else {
        console.error('Error creating course:', data.error)
      }
    } catch (error) {
      console.error('Error creating course:', error)
    }
  }

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course)
    setIsEditCourseOpen(true)
  }

  const handleDeleteCourse = async (courseId: string) => {
    try {
      const response = await fetch(`/api/lms/admin/courses/${courseId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setCourses(courses.filter(c => c.id !== courseId))
      } else {
        console.error('Error deleting course:', data.error)
      }
    } catch (error) {
      console.error('Error deleting course:', error)
    }
  }

  const toggleCoursePublication = async (courseId: string) => {
    try {
      const course = courses.find(c => c.id === courseId)
      if (!course) return

      const response = await fetch(`/api/lms/admin/courses/${courseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ isPublished: !course.isPublished })
      })
      const data = await response.json()
      if (data.success) {
        setCourses(courses.map(c => 
          c.id === courseId ? { ...c, isPublished: !c.isPublished } : c
        ))
      } else {
        console.error('Error updating course:', data.error)
      }
    } catch (error) {
      console.error('Error updating course:', error)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Learning Management System</h1>
          <p className="text-gray-600 mt-1">Manage courses, students, and track learning progress</p>
        </div>
        <Dialog open={isCreateCourseOpen} onOpenChange={setIsCreateCourseOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Course
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Course</DialogTitle>
            </DialogHeader>
            <CourseForm onSubmit={handleCreateCourse} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalCourses}</div>
            <p className="text-xs text-muted-foreground">
              +3 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalEnrollments}</div>
            <p className="text-xs text-muted-foreground">
              +18% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Completion</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.averageCompletion}%</div>
            <p className="text-xs text-muted-foreground">
              +5% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performing Courses */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Courses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.topCourses.map((course) => (
                    <div key={course.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{course.title}</p>
                        <p className="text-sm text-gray-600">{course.enrollments} enrollments</p>
                      </div>
                      <Badge variant="secondary">{course.completion}% completion</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${
                        activity.type === 'completion' ? 'bg-green-100 text-green-600' :
                        activity.type === 'enrollment' ? 'bg-blue-100 text-blue-600' :
                        'bg-yellow-100 text-yellow-600'
                      }`}>
                        {activity.type === 'completion' && <Award className="w-4 h-4" />}
                        {activity.type === 'enrollment' && <BookOpen className="w-4 h-4" />}
                        {activity.type === 'certification' && <Star className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.student}</p>
                        <p className="text-xs text-gray-600">
                          {activity.type === 'completion' && 'Completed'}
                          {activity.type === 'enrollment' && 'Enrolled in'}
                          {activity.type === 'certification' && 'Earned certification from'}
                          {' '}{activity.course}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">{activity.date}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="courses" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <Input placeholder="Search courses..." className="w-64" />
              <Select>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="investment">Investment</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="analysis">Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card key={course.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                      <Badge variant={course.isPublished ? "default" : "secondary"} className="mt-2">
                        {course.isPublished ? "Published" : "Draft"}
                      </Badge>
                    </div>
                    <div className="flex space-x-1">
                      <Button size="sm" variant="outline" onClick={() => handleEditCourse(course)}>
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDeleteCourse(course.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{course.description}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Enrolled: {course.enrolled}</span>
                      <span>Rating: {course.rating}/5</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>{course.lessons} lessons</span>
                      <span>{course.duration}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Level: {course.level}</span>
                      <span>${course.price}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <Button 
                      size="sm" 
                      variant={course.isPublished ? "secondary" : "default"}
                      onClick={() => toggleCoursePublication(course.id)}
                      className="flex-1"
                    >
                      {course.isPublished ? "Unpublish" : "Publish"}
                    </Button>
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <div className="flex justify-between items-center">
            <Input placeholder="Search students..." className="w-64" />
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Enrolled Courses
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Completed
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Progress
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Certifications
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Activity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{student.name}</div>
                            <div className="text-sm text-gray-500">{student.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.enrolledCourses}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.completedCourses}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm text-gray-900 mr-2">{student.totalProgress}%</div>
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{width: `${student.totalProgress}%`}}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="secondary">{student.certificationsEarned}</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.lastActivity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button size="sm" variant="outline">View Details</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Enrollment Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                  <p className="text-gray-500">Chart placeholder - Enrollment trends over time</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Completion Rates by Course</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                  <p className="text-gray-500">Chart placeholder - Completion rates comparison</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Student Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                  <p className="text-gray-500">Chart placeholder - Daily/weekly active users</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Course</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                  <p className="text-gray-500">Chart placeholder - Revenue breakdown</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Course Dialog */}
      <Dialog open={isEditCourseOpen} onOpenChange={setIsEditCourseOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
          </DialogHeader>
          {selectedCourse && (
            <CourseForm 
              course={selectedCourse} 
              onSubmit={handleCreateCourse}
              onCancel={() => setIsEditCourseOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Course Form Component
function CourseForm({ course, onSubmit, onCancel }: { course?: Course; onSubmit: (data: any) => void; onCancel?: () => void }) {
  const [formData, setFormData] = useState({
    title: course?.title || '',
    description: course?.description || '',
    category: course?.category || '',
    level: course?.level || 'Beginner',
    duration: course?.duration || '',
    price: course?.price || 0,
    instructor: course?.instructor || '',
    tags: course?.tags?.join(', ') || '',
    learningObjectives: course?.learningObjectives?.join('\n') || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Transform form data for API
    const courseData = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      level: formData.level as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
      duration: formData.duration,
      price: formData.price,
      instructor: formData.instructor,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
      learningObjectives: formData.learningObjectives.split('\n').map(obj => obj.trim()).filter(obj => obj.length > 0)
    }
    
    onSubmit(courseData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Course Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            required
          />
        </div>
        <div>
          <Label htmlFor="instructor">Instructor</Label>
          <Input
            id="instructor"
            value={formData.instructor}
            onChange={(e) => setFormData({...formData, instructor: e.target.value})}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          rows={3}
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="category">Category</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="investment">Investment</SelectItem>
              <SelectItem value="sales">Sales</SelectItem>
              <SelectItem value="analysis">Analysis</SelectItem>
              <SelectItem value="legal">Legal</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="level">Level</Label>
          <Select value={formData.level} onValueChange={(value) => setFormData({...formData, level: value as any})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Beginner">Beginner</SelectItem>
              <SelectItem value="Intermediate">Intermediate</SelectItem>
              <SelectItem value="Advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="duration">Duration</Label>
          <Input
            id="duration"
            placeholder="e.g., 4 hours"
            value={formData.duration}
            onChange={(e) => setFormData({...formData, duration: e.target.value})}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price">Price ($)</Label>
          <Input
            id="price"
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
            required
          />
        </div>
        <div>
          <Label htmlFor="tags">Tags (comma-separated)</Label>
          <Input
            id="tags"
            placeholder="e.g., investment, fundamentals, analysis"
            value={formData.tags}
            onChange={(e) => setFormData({...formData, tags: e.target.value})}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="objectives">Learning Objectives (one per line)</Label>
        <Textarea
          id="objectives"
          placeholder="Enter learning objectives, one per line"
          value={formData.learningObjectives}
          onChange={(e) => setFormData({...formData, learningObjectives: e.target.value})}
          rows={4}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {course ? 'Update Course' : 'Create Course'}
        </Button>
      </div>
    </form>
  )
}