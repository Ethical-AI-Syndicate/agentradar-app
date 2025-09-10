import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import validateRequest from '../middleware/validation';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const createCourseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  duration: z.string().min(1, 'Duration is required'),
  price: z.number().min(0, 'Price must be non-negative'),
  instructor: z.string().min(1, 'Instructor is required'),
  tags: z.array(z.string()).optional().default([]),
  learningObjectives: z.array(z.string()).optional().default([]),
  thumbnail: z.string().optional()
});

const updateCourseSchema = createCourseSchema.partial();

const createLessonSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  contentType: z.enum(['VIDEO', 'TEXT', 'AUDIO', 'DOCUMENT', 'QUIZ', 'ASSIGNMENT']),
  duration: z.number().min(1, 'Duration must be positive'),
  order: z.number().min(0, 'Order must be non-negative'),
  isPreview: z.boolean().optional().default(false),
  videoUrl: z.string().optional(),
  attachments: z.array(z.string()).optional().default([])
});

const enrollmentSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required')
});

const reviewSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  rating: z.number().min(1).max(5, 'Rating must be between 1 and 5'),
  comment: z.string().optional()
});

const progressUpdateSchema = z.object({
  lessonId: z.string().min(1, 'Lesson ID is required'),
  completed: z.boolean(),
  timeSpent: z.number().min(0, 'Time spent must be non-negative').optional()
});

// ========================================
// PUBLIC ROUTES - Course Catalog
// ========================================

// Get all published courses for catalog
router.get('/courses', async (req, res) => {
  try {
    const { category, level, search, page = 1, limit = 12 } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const where: any = { isPublished: true };
    
    if (category && category !== 'all') {
      where.category = category;
    }
    
    if (level) {
      where.level = level;
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { tags: { has: search as string } }
      ];
    }

    const [courses, totalCount] = await Promise.all([
      prisma.course.findMany({
        where,
        include: {
          enrollments: { select: { id: true } },
          reviews: { select: { rating: true } },
          lessons: { select: { id: true, duration: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limitNum
      }),
      prisma.course.count({ where })
    ]);

    const coursesWithStats = courses.map(course => ({
      ...course,
      enrollmentCount: course.enrollments.length,
      averageRating: course.reviews.length > 0 
        ? course.reviews.reduce((sum, review) => sum + review.rating, 0) / course.reviews.length
        : 0,
      totalDuration: course.lessons.reduce((sum, lesson) => sum + lesson.duration, 0),
      lessonCount: course.lessons.length,
      enrollments: undefined,
      reviews: undefined,
      lessons: undefined
    }));

    res.json({
      success: true,
      data: {
        courses: coursesWithStats,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalCount / limitNum),
          totalCount,
          hasNext: pageNum * limitNum < totalCount,
          hasPrev: pageNum > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch courses' });
  }
});

// Get single course details
router.get('/courses/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user?.id; // Optional - for enrollment status

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            description: true,
            duration: true,
            order: true,
            isPreview: true,
            contentType: true
          }
        },
        enrollments: userId ? {
          where: { userId },
          select: { id: true, progress: true, enrolledAt: true }
        } : false,
        reviews: {
          include: {
            user: { select: { firstName: true, lastName: true } }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        certifications: userId ? {
          where: { userId },
          select: { id: true, issueDate: true, certificateNumber: true }
        } : false
      }
    });

    if (!course || !course.isPublished) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }

    const totalDuration = course.lessons.reduce((sum, lesson) => sum + lesson.duration, 0);
    const averageRating = course.reviews.length > 0 
      ? course.reviews.reduce((sum, review) => sum + review.rating, 0) / course.reviews.length
      : 0;

    const enrollmentCount = await prisma.courseEnrollment.count({
      where: { courseId }
    });

    const result = {
      ...course,
      totalDuration,
      averageRating,
      enrollmentCount,
      reviewCount: course.reviews.length,
      isEnrolled: userId ? course.enrollments.length > 0 : false,
      enrollment: userId && course.enrollments.length > 0 ? course.enrollments[0] : null,
      hasCertificate: userId ? course.certifications.length > 0 : false,
      certificate: userId && course.certifications.length > 0 ? course.certifications[0] : null
    };

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch course' });
  }
});

// ========================================
// AUTHENTICATED USER ROUTES
// ========================================

// Enroll in a course
router.post('/enroll', authenticateToken, validateRequest(enrollmentSchema), async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user!.id;

    // Check if course exists and is published
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, isPublished: true, title: true }
    });

    if (!course || !course.isPublished) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.courseEnrollment.findUnique({
      where: { userId_courseId: { userId, courseId } }
    });

    if (existingEnrollment) {
      return res.status(400).json({ success: false, error: 'Already enrolled in this course' });
    }

    // Create enrollment
    const enrollment = await prisma.courseEnrollment.create({
      data: {
        userId,
        courseId
      },
      include: {
        course: { select: { title: true } }
      }
    });

    res.status(201).json({
      success: true,
      message: `Successfully enrolled in ${course.title}`,
      data: enrollment
    });
  } catch (error) {
    console.error('Error enrolling in course:', error);
    res.status(500).json({ success: false, error: 'Failed to enroll in course' });
  }
});

// Get user's enrolled courses
router.get('/my-courses', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { status = 'all' } = req.query;

    const where: any = { userId };
    
    if (status === 'completed') {
      where.progress = 100;
    } else if (status === 'in-progress') {
      where.AND = [
        { progress: { gt: 0 } },
        { progress: { lt: 100 } }
      ];
    } else if (status === 'not-started') {
      where.progress = 0;
    }

    const enrollments = await prisma.courseEnrollment.findMany({
      where,
      include: {
        course: {
          include: {
            lessons: { select: { id: true, duration: true } }
          }
        },
        lessonProgress: {
          select: { completed: true, timeSpent: true }
        }
      },
      orderBy: { enrolledAt: 'desc' }
    });

    const coursesWithProgress = enrollments.map(enrollment => {
      const totalLessons = enrollment.course.lessons.length;
      const completedLessons = enrollment.lessonProgress.filter(p => p.completed).length;
      const totalTime = enrollment.lessonProgress.reduce((sum, p) => sum + p.timeSpent, 0);

      return {
        enrollmentId: enrollment.id,
        course: {
          ...enrollment.course,
          lessons: undefined
        },
        progress: enrollment.progress,
        enrolledAt: enrollment.enrolledAt,
        completedAt: enrollment.completedAt,
        completedLessons,
        totalLessons,
        timeSpent: totalTime,
        certificateIssued: enrollment.certificateIssued
      };
    });

    res.json({ success: true, data: coursesWithProgress });
  } catch (error) {
    console.error('Error fetching user courses:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch enrolled courses' });
  }
});

// Get lesson content (only for enrolled users)
router.get('/lessons/:lessonId', authenticateToken, async (req, res) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user!.id;

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        course: {
          include: {
            enrollments: {
              where: { userId },
              select: { id: true }
            }
          }
        }
      }
    });

    if (!lesson) {
      return res.status(404).json({ success: false, error: 'Lesson not found' });
    }

    // Check if user is enrolled or lesson is preview
    const isEnrolled = lesson.course.enrollments.length > 0;
    if (!lesson.isPreview && !isEnrolled) {
      return res.status(403).json({ success: false, error: 'You must be enrolled to access this lesson' });
    }

    // Get user's progress for this lesson if enrolled
    let progress = null;
    if (isEnrolled) {
      const enrollment = lesson.course.enrollments[0];
      progress = await prisma.lessonProgress.findUnique({
        where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId } }
      });
    }

    const result = {
      ...lesson,
      course: { id: lesson.course.id, title: lesson.course.title },
      progress: progress ? {
        completed: progress.completed,
        timeSpent: progress.timeSpent,
        completedAt: progress.completedAt
      } : null
    };

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching lesson:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch lesson' });
  }
});

// Update lesson progress
router.put('/progress', authenticateToken, validateRequest(progressUpdateSchema), async (req, res) => {
  try {
    const { lessonId, completed, timeSpent = 0 } = req.body;
    const userId = req.user!.id;

    // Get enrollment and lesson info
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        course: {
          include: {
            enrollments: {
              where: { userId },
              select: { id: true }
            },
            lessons: { select: { id: true } }
          }
        }
      }
    });

    if (!lesson || lesson.course.enrollments.length === 0) {
      return res.status(404).json({ success: false, error: 'Enrollment not found' });
    }

    const enrollmentId = lesson.course.enrollments[0].id;

    // Update or create lesson progress
    const progress = await prisma.lessonProgress.upsert({
      where: { enrollmentId_lessonId: { enrollmentId, lessonId } },
      update: {
        completed,
        completedAt: completed ? new Date() : null,
        timeSpent: { increment: timeSpent }
      },
      create: {
        enrollmentId,
        lessonId,
        completed,
        completedAt: completed ? new Date() : null,
        timeSpent
      }
    });

    // Calculate overall course progress
    const allProgress = await prisma.lessonProgress.findMany({
      where: { enrollmentId },
      select: { completed: true }
    });

    const totalLessons = lesson.course.lessons.length;
    const completedLessons = allProgress.filter(p => p.completed).length;
    const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    // Update enrollment progress
    const updatedEnrollment = await prisma.courseEnrollment.update({
      where: { id: enrollmentId },
      data: {
        progress: overallProgress,
        completedAt: overallProgress === 100 ? new Date() : null
      }
    });

    // Issue certificate if course is completed
    if (overallProgress === 100 && !updatedEnrollment.certificateIssued) {
      const certificateNumber = `CERT-${Date.now()}-${userId.slice(-6)}`;
      await prisma.certification.create({
        data: {
          userId,
          courseId: lesson.course.id,
          certificateNumber,
          verificationUrl: `/certificates/verify/${certificateNumber}`
        }
      });

      await prisma.courseEnrollment.update({
        where: { id: enrollmentId },
        data: { certificateIssued: true }
      });
    }

    res.json({
      success: true,
      data: {
        lessonProgress: progress,
        courseProgress: overallProgress,
        certificateIssued: overallProgress === 100
      }
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ success: false, error: 'Failed to update progress' });
  }
});

// Submit course review
router.post('/reviews', authenticateToken, validateRequest(reviewSchema), async (req, res) => {
  try {
    const { courseId, rating, comment } = req.body;
    const userId = req.user!.id;

    // Check if user is enrolled
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: { userId_courseId: { userId, courseId } }
    });

    if (!enrollment) {
      return res.status(403).json({ success: false, error: 'You must be enrolled to review this course' });
    }

    // Create or update review
    const review = await prisma.courseReview.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: { rating, comment },
      create: { userId, courseId, rating, comment },
      include: {
        user: { select: { firstName: true, lastName: true } }
      }
    });

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ success: false, error: 'Failed to submit review' });
  }
});

// Get user certificates
router.get('/certificates', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;

    const certificates = await prisma.certification.findMany({
      where: { userId, isValid: true },
      include: {
        course: { select: { title: true, instructor: true } }
      },
      orderBy: { issueDate: 'desc' }
    });

    res.json({ success: true, data: certificates });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch certificates' });
  }
});

// ========================================
// ADMIN ROUTES - Course Management
// ========================================

// Get all courses (admin)
router.get('/admin/courses', requireAdmin, async (req, res) => {
  try {
    const { status, category, search, page = 1, limit = 20 } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const where: any = {};
    
    if (status === 'published') {
      where.isPublished = true;
    } else if (status === 'draft') {
      where.isPublished = false;
    }
    
    if (category && category !== 'all') {
      where.category = category;
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { instructor: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [courses, totalCount] = await Promise.all([
      prisma.course.findMany({
        where,
        include: {
          enrollments: { select: { id: true, progress: true } },
          reviews: { select: { rating: true } },
          lessons: { select: { id: true } }
        },
        orderBy: { updatedAt: 'desc' },
        skip: offset,
        take: limitNum
      }),
      prisma.course.count({ where })
    ]);

    const coursesWithStats = courses.map(course => ({
      ...course,
      enrollmentCount: course.enrollments.length,
      averageRating: course.reviews.length > 0 
        ? course.reviews.reduce((sum, review) => sum + review.rating, 0) / course.reviews.length
        : 0,
      averageProgress: course.enrollments.length > 0
        ? course.enrollments.reduce((sum, enrollment) => sum + enrollment.progress, 0) / course.enrollments.length
        : 0,
      lessonCount: course.lessons.length,
      enrollments: undefined,
      reviews: undefined,
      lessons: undefined
    }));

    res.json({
      success: true,
      data: {
        courses: coursesWithStats,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalCount / limitNum),
          totalCount
        }
      }
    });
  } catch (error) {
    console.error('Error fetching admin courses:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch courses' });
  }
});

// Create new course (admin)
router.post('/admin/courses', requireAdmin, validateRequest(createCourseSchema), async (req, res) => {
  try {
    const courseData = req.body;

    const course = await prisma.course.create({
      data: courseData
    });

    res.status(201).json({ success: true, data: course });
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ success: false, error: 'Failed to create course' });
  }
});

// Update course (admin)
router.put('/admin/courses/:courseId', requireAdmin, validateRequest(updateCourseSchema), async (req, res) => {
  try {
    const { courseId } = req.params;
    const updateData = req.body;

    const course = await prisma.course.update({
      where: { id: courseId },
      data: updateData
    });

    res.json({ success: true, data: course });
  } catch (error) {
    console.error('Error updating course:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }
    res.status(500).json({ success: false, error: 'Failed to update course' });
  }
});

// Delete course (admin)
router.delete('/admin/courses/:courseId', requireAdmin, async (req, res) => {
  try {
    const { courseId } = req.params;

    await prisma.course.delete({
      where: { id: courseId }
    });

    res.json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }
    res.status(500).json({ success: false, error: 'Failed to delete course' });
  }
});

// Create lesson (admin)
router.post('/admin/courses/:courseId/lessons', requireAdmin, validateRequest(createLessonSchema), async (req, res) => {
  try {
    const { courseId } = req.params;
    const lessonData = { ...req.body, courseId };

    const lesson = await prisma.lesson.create({
      data: lessonData
    });

    res.status(201).json({ success: true, data: lesson });
  } catch (error) {
    console.error('Error creating lesson:', error);
    res.status(500).json({ success: false, error: 'Failed to create lesson' });
  }
});

// Get course analytics (admin)
router.get('/admin/analytics', requireAdmin, async (req, res) => {
  try {
    const [
      totalCourses,
      totalStudents,
      totalEnrollments,
      totalCertifications,
      recentEnrollments,
      topCourses,
      completionStats
    ] = await Promise.all([
      prisma.course.count(),
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.courseEnrollment.count(),
      prisma.certification.count(),
      prisma.courseEnrollment.findMany({
        include: {
          user: { select: { firstName: true, lastName: true } },
          course: { select: { title: true } }
        },
        orderBy: { enrolledAt: 'desc' },
        take: 10
      }),
      prisma.course.findMany({
        include: {
          enrollments: { select: { id: true, progress: true } },
          reviews: { select: { rating: true } }
        },
        orderBy: {
          enrollments: { _count: 'desc' }
        },
        take: 10
      }),
      prisma.courseEnrollment.groupBy({
        by: ['progress'],
        _count: true,
        where: {
          progress: { gte: 0 }
        }
      })
    ]);

    const averageCompletion = totalEnrollments > 0 
      ? await prisma.courseEnrollment.aggregate({
          _avg: { progress: true }
        }).then(result => result._avg.progress || 0)
      : 0;

    const topCoursesWithStats = topCourses.map(course => ({
      id: course.id,
      title: course.title,
      enrollments: course.enrollments.length,
      averageRating: course.reviews.length > 0 
        ? course.reviews.reduce((sum, review) => sum + review.rating, 0) / course.reviews.length
        : 0,
      completionRate: course.enrollments.length > 0
        ? course.enrollments.filter(e => e.progress === 100).length / course.enrollments.length * 100
        : 0
    }));

    res.json({
      success: true,
      data: {
        summary: {
          totalCourses,
          totalStudents,
          totalEnrollments,
          totalCertifications,
          averageCompletion: Math.round(averageCompletion)
        },
        recentEnrollments,
        topCourses: topCoursesWithStats,
        completionDistribution: completionStats
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
  }
});

export default router;