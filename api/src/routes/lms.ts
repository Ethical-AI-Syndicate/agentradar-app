/**
 * Learning Management System (LMS) Routes
 * Real implementation with database operations and comprehensive functionality
 * Using Joi validation for compatibility with existing middleware
 */

import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "../middleware/auth";
import { validateRequest } from "../middleware/validation";
import Joi from "joi";

const router = express.Router();
const prisma = new PrismaClient();

// ============================================================================
// VALIDATION SCHEMAS (Using Joi for compatibility)
// ============================================================================

const courseCreationSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required(),
  description: Joi.string().trim().min(10).max(2000).required(),
  category: Joi.string().trim().min(1).max(100).required(),
  level: Joi.string().valid("BEGINNER", "INTERMEDIATE", "ADVANCED").required(),
  duration: Joi.string().trim().min(1).max(50).required(),
  price: Joi.number().min(0).max(99999).required(),
  instructor: Joi.string().trim().min(1).max(100).required(),
  thumbnail: Joi.string().uri().allow("").optional(),
  tags: Joi.array().items(Joi.string().trim().max(50)).max(10).default([]),
  learningObjectives: Joi.array().items(Joi.string().trim().max(200)).max(10).default([]),
  isPublished: Joi.boolean().default(false)
});

const lessonCreationSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required(),
  description: Joi.string().trim().max(1000).allow("").optional(),
  content: Joi.string().trim().min(1).required(),
  contentType: Joi.string().valid("VIDEO", "TEXT", "AUDIO", "DOCUMENT", "QUIZ", "ASSIGNMENT").required(),
  duration: Joi.number().min(1).max(1440).required(), // max 24 hours in minutes
  order: Joi.number().min(1).required(),
  isPreview: Joi.boolean().default(false),
  videoUrl: Joi.string().uri().allow("").optional(),
  attachments: Joi.array().items(Joi.string().uri()).max(5).default([])
});

const enrollmentSchema = Joi.object({
  courseId: Joi.string().trim().required()
});

const progressUpdateSchema = Joi.object({
  lessonId: Joi.string().trim().required(),
  completed: Joi.boolean().required(),
  timeSpent: Joi.number().min(0).optional()
});

const reviewSchema = Joi.object({
  courseId: Joi.string().trim().required(),
  rating: Joi.number().min(1).max(5).required(),
  comment: Joi.string().trim().max(1000).allow("").optional()
});

// ============================================================================
// STUDENT ROUTES
// ============================================================================

/**
 * GET /api/lms/courses
 * Get available courses for students
 */
router.get('/courses', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const category = req.query.category as string;
    const level = req.query.level as string;
    const skip = (page - 1) * limit;

    const where: any = { isPublished: true };
    if (category) where.category = category;
    if (level) where.level = level;

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        include: {
          _count: {
            select: {
              enrollments: true,
              lessons: true,
              reviews: true
            }
          },
          reviews: {
            select: {
              rating: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.course.count({ where })
    ]);

    // Calculate average ratings
    const coursesWithRatings = courses.map(course => {
      const ratings = course.reviews.map(r => r.rating);
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
        : 0;
      
      return {
        ...course,
        averageRating: Math.round(averageRating * 10) / 10,
        enrollmentCount: course._count.enrollments,
        lessonCount: course._count.lessons,
        reviewCount: course._count.reviews
      };
    });

    res.json({
      success: true,
      data: {
        courses: coursesWithRatings,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Failed to fetch courses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch courses',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/lms/courses/:id
 * Get course details
 */
router.get('/courses/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req as any;

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        lessons: {
          select: {
            id: true,
            title: true,
            description: true,
            contentType: true,
            duration: true,
            order: true,
            isPreview: true
          },
          orderBy: { order: 'asc' }
        },
        enrollments: {
          where: { userId },
          select: {
            id: true,
            progress: true,
            completedAt: true,
            certificateIssued: true
          }
        },
        reviews: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: {
          select: {
            enrollments: true,
            reviews: true
          }
        }
      }
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (!course.isPublished) {
      return res.status(403).json({
        success: false,
        message: 'Course is not available'
      });
    }

    // Calculate average rating
    const ratings = course.reviews.map(r => r.rating);
    const averageRating = ratings.length > 0 
      ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
      : 0;

    const isEnrolled = course.enrollments.length > 0;
    const enrollment = isEnrolled ? course.enrollments[0] : null;

    res.json({
      success: true,
      data: {
        ...course,
        averageRating: Math.round(averageRating * 10) / 10,
        enrollmentCount: course._count.enrollments,
        reviewCount: course._count.reviews,
        isEnrolled,
        enrollment
      }
    });
  } catch (error) {
    console.error('Failed to fetch course:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch course',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/lms/enroll
 * Enroll in a course
 */
router.post('/enroll', authenticateToken, validateRequest(enrollmentSchema), async (req, res) => {
  try {
    const { courseId } = req.body;
    const { userId } = req as any;

    // Check if course exists and is published
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (!course.isPublished) {
      return res.status(403).json({
        success: false,
        message: 'Course is not available for enrollment'
      });
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      }
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this course'
      });
    }

    // Create enrollment
    const enrollment = await prisma.courseEnrollment.create({
      data: {
        userId,
        courseId,
        enrolledAt: new Date()
      },
      include: {
        course: {
          select: {
            title: true,
            instructor: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in course',
      data: enrollment
    });
  } catch (error) {
    console.error('Failed to enroll in course:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enroll in course',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/lms/my-courses
 * Get user's enrolled courses
 */
router.get('/my-courses', authenticateToken, async (req, res) => {
  try {
    const { userId } = req as any;

    const enrollments = await prisma.courseEnrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            lessons: {
              select: {
                id: true,
                duration: true
              }
            },
            _count: {
              select: {
                lessons: true
              }
            }
          }
        },
        lessonProgress: {
          where: { completed: true }
        }
      },
      orderBy: { enrolledAt: 'desc' }
    });

    const coursesWithProgress = enrollments.map(enrollment => {
      const totalLessons = enrollment.course._count.lessons;
      const completedLessons = enrollment.lessonProgress.length;
      const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
      
      const totalDuration = enrollment.course.lessons.reduce((sum, lesson) => sum + lesson.duration, 0);
      const completedDuration = enrollment.lessonProgress.reduce((sum, progress) => sum + (progress.timeSpent || 0), 0);

      return {
        ...enrollment,
        progressPercentage,
        completedLessons,
        totalLessons,
        totalDuration,
        completedDuration
      };
    });

    res.json({
      success: true,
      data: coursesWithProgress
    });
  } catch (error) {
    console.error('Failed to fetch enrolled courses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch enrolled courses',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/lms/lessons/:id
 * Get lesson content (only for enrolled students)
 */
router.get('/lessons/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req as any;

    const lesson = await prisma.lesson.findUnique({
      where: { id },
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
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    // Check if user is enrolled or lesson is preview
    const isEnrolled = lesson.course.enrollments.length > 0;
    if (!isEnrolled && !lesson.isPreview) {
      return res.status(403).json({
        success: false,
        message: 'You must be enrolled to access this lesson'
      });
    }

    res.json({
      success: true,
      data: lesson
    });
  } catch (error) {
    console.error('Failed to fetch lesson:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lesson',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/lms/progress
 * Update lesson progress
 */
router.post('/progress', authenticateToken, validateRequest(progressUpdateSchema), async (req, res) => {
  try {
    const { lessonId, completed, timeSpent } = req.body;
    const { userId } = req as any;

    // Verify enrollment
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
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    if (lesson.course.enrollments.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You must be enrolled to update progress'
      });
    }

    const enrollmentId = lesson.course.enrollments[0].id;

    // Update or create progress
    const progress = await prisma.lessonProgress.upsert({
      where: {
        enrollmentId_lessonId: {
          enrollmentId,
          lessonId
        }
      },
      update: {
        completed,
        completedAt: completed ? new Date() : null,
        timeSpent: timeSpent || 0
      },
      create: {
        userId,
        enrollmentId,
        lessonId,
        status: completed ? 'COMPLETED' : 'IN_PROGRESS',
        completed,
        completedAt: completed ? new Date() : null,
        timeSpent: timeSpent || 0
      }
    });

    // Update overall course progress
    if (completed) {
      const totalLessons = await prisma.lesson.count({
        where: { courseId: lesson.courseId }
      });

      const completedLessons = await prisma.lessonProgress.count({
        where: {
          enrollmentId,
          completed: true
        }
      });

      const progressPercentage = Math.round((completedLessons / totalLessons) * 100);

      await prisma.courseEnrollment.update({
        where: { id: enrollmentId },
        data: {
          progress: progressPercentage,
          completedAt: progressPercentage === 100 ? new Date() : null
        }
      });

      // Issue certificate if course is completed
      if (progressPercentage === 100) {
        const existingCertificate = await prisma.certificate.findUnique({
          where: {
            userId_courseId: {
              userId,
              courseId: lesson.courseId
            }
          }
        });

        if (!existingCertificate) {
          const certificateId = `CERT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
          await prisma.certificate.create({
            data: {
              userId,
              courseId: lesson.courseId,
              certificateId,
              certificateNumber: certificateId,
              issueDate: new Date(),
              verificationUrl: `https://agentradar.app/verify-certificate/${certificateId}`
            }
          });

          await prisma.courseEnrollment.update({
            where: { id: enrollmentId },
            data: { certificateIssued: true }
          });
        }
      }
    }

    res.json({
      success: true,
      message: 'Progress updated successfully',
      data: progress
    });
  } catch (error) {
    console.error('Failed to update progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update progress',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/lms/reviews
 * Submit course review
 */
router.post('/reviews', authenticateToken, validateRequest(reviewSchema), async (req, res) => {
  try {
    const { courseId, rating, comment } = req.body;
    const { userId } = req as any;

    // Verify enrollment
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      }
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'You must be enrolled to review this course'
      });
    }

    // Create or update review
    const review = await prisma.courseReview.upsert({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      },
      update: {
        rating,
        comment: comment || ''
      },
      create: {
        userId,
        courseId,
        rating,
        comment: comment || ''
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Review submitted successfully',
      data: review
    });
  } catch (error) {
    console.error('Failed to submit review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit review',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/lms/certificates
 * Get user's certificates
 */
router.get('/certificates', authenticateToken, async (req, res) => {
  try {
    const { userId } = req as any;

    const certificates = await prisma.certificate.findMany({
      where: { userId, isValid: true },
      include: {
        course: {
          select: {
            title: true,
            instructor: true
          }
        }
      },
      orderBy: { issueDate: 'desc' }
    });

    res.json({
      success: true,
      data: certificates
    });
  } catch (error) {
    console.error('Failed to fetch certificates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch certificates',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// ADMIN ROUTES (require admin role)
// ============================================================================

/**
 * POST /api/lms/admin/courses
 * Create new course (admin only)
 */
router.post('/admin/courses', authenticateToken, validateRequest(courseCreationSchema), async (req, res) => {
  try {
    const { role } = req as any;
    
    if (role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const course = await prisma.course.create({
      data: req.body
    });

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: course
    });
  } catch (error) {
    console.error('Failed to create course:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create course',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/lms/admin/courses/:id/lessons
 * Add lesson to course (admin only)
 */
router.post('/admin/courses/:id/lessons', authenticateToken, validateRequest(lessonCreationSchema), async (req, res) => {
  try {
    const { role } = req as any;
    const { id: courseId } = req.params;
    
    if (role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const lesson = await prisma.lesson.create({
      data: {
        ...req.body,
        courseId
      }
    });

    res.status(201).json({
      success: true,
      message: 'Lesson created successfully',
      data: lesson
    });
  } catch (error) {
    console.error('Failed to create lesson:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create lesson',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/lms/admin/analytics
 * Get LMS analytics (admin only)
 */
router.get('/admin/analytics', authenticateToken, async (req, res) => {
  try {
    const { role } = req as any;
    
    if (role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const [
      totalCourses,
      totalEnrollments,
      totalCertificates,
      recentEnrollments,
      popularCourses
    ] = await Promise.all([
      prisma.course.count(),
      prisma.courseEnrollment.count(),
      prisma.certificate.count({ where: { isValid: true } }),
      prisma.courseEnrollment.findMany({
        take: 10,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          course: {
            select: {
              title: true
            }
          }
        },
        orderBy: { enrolledAt: 'desc' }
      }),
      prisma.course.findMany({
        include: {
          _count: {
            select: {
              enrollments: true
            }
          }
        },
        orderBy: {
          enrollments: {
            _count: 'desc'
          }
        },
        take: 5
      })
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalCourses,
          totalEnrollments,
          totalCertificates
        },
        recentEnrollments,
        popularCourses
      }
    });
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;