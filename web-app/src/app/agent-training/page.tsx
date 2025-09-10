'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Play, 
  BookOpen, 
  Award, 
  Clock, 
  Users, 
  CheckCircle,
  Lock,
  Star,
  TrendingUp,
  FileText,
  Video,
  Headphones,
  Download,
  Filter,
  Search
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
  thumbnail: string
  price: number
  isEnrolled: boolean
  progress: number
  completed: boolean
  tags: string[]
  learningObjectives: string[]
}

interface Lesson {
  id: string
  title: string
  type: 'video' | 'document' | 'quiz' | 'interactive'
  duration: string
  completed: boolean
  locked: boolean
}

export default function AgentTrainingPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  const categories = [
    'All',
    'AgentRadar Platform',
    'Real Estate Fundamentals', 
    'Market Analysis',
    'Lead Generation',
    'Legal & Compliance',
    'Technology Tools',
    'Sales Techniques'
  ]

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/lms/courses')
      const data = await response.json()
      if (data.success) {
        setCourses(data.data.courses)
        setFilteredCourses(data.data.courses)
        return
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    }
    
    // Fallback to mock data if API fails
    const mockCourses: Course[] = [
      {
        id: '1',
        title: 'AgentRadar Mastery: Complete Platform Training',
        description: 'Master every feature of AgentRadar from basic alerts to advanced analytics and automation workflows.',
        category: 'AgentRadar Platform',
        level: 'Beginner',
        duration: '4h 30m',
        lessons: 18,
        enrolled: 1247,
        rating: 4.9,
        instructor: 'Sarah Chen',
        thumbnail: '/course-agentराdar-mastery.jpg',
        price: 0, // Free for platform users
        isEnrolled: true,
        progress: 65,
        completed: false,
        tags: ['Platform', 'Essential', 'Workflow'],
        learningObjectives: [
          'Set up and configure AgentRadar alerts',
          'Use advanced filtering and automation',
          'Integrate with your existing CRM',
          'Maximize ROI with platform analytics'
        ]
      },
      {
        id: '2',
        title: 'Power of Sale Opportunities: Advanced Strategies',
        description: 'Learn advanced techniques for identifying, evaluating, and closing power of sale properties.',
        category: 'Market Analysis',
        level: 'Advanced',
        duration: '3h 15m',
        lessons: 12,
        enrolled: 892,
        rating: 4.8,
        instructor: 'Michael Rodriguez',
        thumbnail: '/course-power-of-sale.jpg',
        price: 197,
        isEnrolled: true,
        progress: 30,
        completed: false,
        tags: ['Investment', 'Legal', 'Analysis'],
        learningObjectives: [
          'Understand power of sale legal process',
          'Evaluate property investment potential',
          'Navigate court filing systems',
          'Build relationships with legal professionals'
        ]
      },
      {
        id: '3',
        title: 'Estate Sales & Probate Properties',
        description: 'Discover how to find and evaluate estate sale opportunities with compassionate professionalism.',
        category: 'Lead Generation',
        level: 'Intermediate',
        duration: '2h 45m',
        lessons: 10,
        enrolled: 654,
        rating: 4.7,
        instructor: 'Jessica Taylor',
        thumbnail: '/course-estate-sales.jpg',
        price: 147,
        isEnrolled: false,
        progress: 0,
        completed: false,
        tags: ['Probate', 'Ethics', 'Communication'],
        learningObjectives: [
          'Navigate probate court systems',
          'Communicate with sensitivity during difficult times',
          'Identify valuable estate sale opportunities',
          'Build referral networks with estate attorneys'
        ]
      },
      {
        id: '4',
        title: 'Real Estate Market Analysis Fundamentals',
        description: 'Build essential skills in market analysis, comparable property evaluation, and trend identification.',
        category: 'Real Estate Fundamentals',
        level: 'Beginner',
        duration: '5h 20m',
        lessons: 22,
        enrolled: 2156,
        rating: 4.8,
        instructor: 'David Kim',
        thumbnail: '/course-market-analysis.jpg',
        price: 97,
        isEnrolled: true,
        progress: 80,
        completed: false,
        tags: ['Analysis', 'CMA', 'Pricing'],
        learningObjectives: [
          'Conduct comprehensive market analysis',
          'Create accurate CMAs',
          'Identify market trends and opportunities',
          'Use data to support pricing strategies'
        ]
      },
      {
        id: '5',
        title: 'Legal Compliance for Real Estate Technology',
        description: 'Stay compliant with privacy laws, data protection, and technology regulations in real estate.',
        category: 'Legal & Compliance',
        level: 'Intermediate',
        duration: '2h 30m',
        lessons: 8,
        enrolled: 445,
        rating: 4.6,
        instructor: 'Lisa Chen, J.D.',
        thumbnail: '/course-legal-compliance.jpg',
        price: 127,
        isEnrolled: false,
        progress: 0,
        completed: false,
        tags: ['GDPR', 'Privacy', 'Technology'],
        learningObjectives: [
          'Understand GDPR and privacy requirements',
          'Implement compliant data collection practices',
          'Navigate technology regulations',
          'Protect client information appropriately'
        ]
      }
    ]

    setCourses(mockCourses)
    setLoading(false)
  }

  const filteredCourses = courses.filter(course => {
    const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  const enrolledCourses = courses.filter(course => course.isEnrolled)
  const completedCourses = courses.filter(course => course.completed)
  const inProgressCourses = courses.filter(course => course.isEnrolled && !course.completed)

  const totalProgress = enrolledCourses.length > 0 
    ? enrolledCourses.reduce((sum, course) => sum + course.progress, 0) / enrolledCourses.length 
    : 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded bg-gradient-to-r from-blue-500 to-orange-500" />
              <span className="text-xl font-bold">AgentRadar</span>
            </Link>

            <div className="flex items-center space-x-6">
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                Home
              </Link>
              <Link href="/contact">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">AgentRadar Academy</h1>
            <p className="text-xl text-blue-100 mb-8">
              Master real estate intelligence with expert-led training courses
            </p>
            
            {/* Progress Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold">{enrolledCourses.length}</div>
                <div className="text-blue-100">Courses Enrolled</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold">{completedCourses.length}</div>
                <div className="text-blue-100">Completed</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold">{Math.round(totalProgress)}%</div>
                <div className="text-blue-100">Average Progress</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold">
                  {enrolledCourses.reduce((sum, course) => sum + course.lessons, 0)}
                </div>
                <div className="text-blue-100">Total Lessons</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="all-courses" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all-courses">All Courses</TabsTrigger>
            <TabsTrigger value="my-courses">My Courses</TabsTrigger>
            <TabsTrigger value="in-progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="all-courses" className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Course Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <Card key={course.id} className="hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 rounded-t-lg flex items-center justify-center">
                      <BookOpen className="w-16 h-16 text-white opacity-50" />
                    </div>
                    {course.isEnrolled && (
                      <Badge className="absolute top-2 left-2 bg-green-500">
                        Enrolled
                      </Badge>
                    )}
                    <Badge className="absolute top-2 right-2 bg-blue-500">
                      {course.level}
                    </Badge>
                  </div>
                  
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{course.category}</Badge>
                      <div className="flex items-center text-sm text-gray-500">
                        <Star className="w-4 h-4 text-yellow-400 mr-1" />
                        {course.rating}
                      </div>
                    </div>
                    <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
                    <p className="text-gray-600 text-sm line-clamp-3">{course.description}</p>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      {/* Course Meta */}
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {course.duration}
                        </div>
                        <div className="flex items-center">
                          <BookOpen className="w-4 h-4 mr-1" />
                          {course.lessons} lessons
                        </div>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {course.enrolled}
                        </div>
                      </div>

                      {/* Progress Bar (if enrolled) */}
                      {course.isEnrolled && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{course.progress}%</span>
                          </div>
                          <Progress value={course.progress} className="h-2" />
                        </div>
                      )}

                      {/* Instructor */}
                      <div className="text-sm text-gray-600">
                        Instructor: <span className="font-medium">{course.instructor}</span>
                      </div>

                      {/* Price and Action */}
                      <div className="flex items-center justify-between">
                        <div className="text-lg font-bold text-blue-600">
                          {course.price === 0 ? 'Free' : `$${course.price}`}
                        </div>
                        <Button 
                          className={course.isEnrolled ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}
                        >
                          {course.isEnrolled ? (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              Continue
                            </>
                          ) : (
                            'Enroll Now'
                          )}
                        </Button>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1">
                        {course.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="my-courses">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map((course) => (
                <Card key={course.id} className="hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <div className="h-32 bg-gradient-to-br from-green-500 to-blue-600 rounded-t-lg flex items-center justify-center">
                      <Play className="w-12 h-12 text-white" />
                    </div>
                    {course.completed && (
                      <Badge className="absolute top-2 right-2 bg-green-500">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Completed
                      </Badge>
                    )}
                  </div>
                  
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2 line-clamp-2">{course.title}</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{course.progress}%</span>
                      </div>
                      <Progress value={course.progress} className="h-2" />
                      <Button className="w-full">
                        <Play className="w-4 h-4 mr-2" />
                        Continue Learning
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="in-progress">
            <div className="space-y-4">
              {inProgressCourses.map((course) => (
                <Card key={course.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">{course.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <span>Instructor: {course.instructor}</span>
                          <span>{course.lessons} lessons</span>
                          <span>{course.duration}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Progress</span>
                              <span>{course.progress}%</span>
                            </div>
                            <Progress value={course.progress} className="h-2" />
                          </div>
                          <Button>
                            <Play className="w-4 h-4 mr-2" />
                            Continue
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="completed">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedCourses.map((course) => (
                <Card key={course.id} className="border-green-200">
                  <div className="relative">
                    <div className="h-32 bg-gradient-to-br from-green-500 to-emerald-600 rounded-t-lg flex items-center justify-center">
                      <Award className="w-12 h-12 text-white" />
                    </div>
                    <Badge className="absolute top-2 right-2 bg-green-500">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Completed
                    </Badge>
                  </div>
                  
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2 line-clamp-2">{course.title}</h3>
                    <div className="space-y-3">
                      <div className="text-sm text-gray-600">
                        Completed on {new Date().toLocaleDateString()}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1">
                          <Download className="w-4 h-4 mr-2" />
                          Certificate
                        </Button>
                        <Button variant="outline" className="flex-1">
                          <Play className="w-4 h-4 mr-2" />
                          Review
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
