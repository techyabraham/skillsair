export interface CourseInstructor {
  id: number;
  name: string;
  avatar: string;
  bio: string;
  totalStudents: number;
  totalCourses: number;
  rating: number;
  slug: string;
}

export interface CourseCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
  thumbnail?: string;
  description?: string;
}

export interface CourseLesson {
  id: number;
  title: string;
  slug: string;
  duration: number;
  type: "video" | "text" | "quiz" | "assignment";
  isPreview: boolean;
  isCompleted?: boolean;
  videoUrl?: string;
  content?: string;
}

export interface CourseSection {
  id: number;
  title: string;
  lessons: CourseLesson[];
  totalDuration: number;
}

export interface CourseReview {
  id: number;
  rating: number;
  content: string;
  createdAt: string;
  author: {
    id: number;
    name: string;
    avatar: string;
  };
}

export interface CourseTag {
  id: number;
  name: string;
  slug: string;
}

export type CourseLevel = "beginner" | "intermediate" | "advanced" | "all";
export type CourseStatus = "publish" | "draft" | "pending";

export interface Course {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  description: string;
  thumbnail: string;
  price: number;
  regularPrice: number;
  salePrice?: number;
  isFree: boolean;
  isEnrolled?: boolean;
  level: CourseLevel;
  status: CourseStatus;
  language: string;
  duration: number;
  totalLessons: number;
  totalStudents: number;
  totalSections: number;
  rating: {
    average: number;
    count: number;
    breakdown: Record<string, number>;
  };
  instructor: CourseInstructor;
  categories: CourseCategory[];
  tags: CourseTag[];
  curriculum: CourseSection[];
  requirements: string[];
  outcomes: string[];
  targetAudience: string[];
  includes: {
    videoHours: number;
    articles: number;
    downloadableResources: number;
    fullLifetimeAccess: boolean;
    certificate: boolean;
    mobileAccess: boolean;
  };
  lastUpdated: string;
  createdAt: string;
  reviews: CourseReview[];
  progress?: number;
}

export interface CourseFilters {
  category?: string;
  level?: CourseLevel;
  priceMin?: number;
  priceMax?: number;
  duration?: string;
  rating?: number;
  search?: string;
  sort?: "popular" | "newest" | "price-asc" | "price-desc" | "rating";
  page?: number;
  perPage?: number;
}

export interface CoursesResponse {
  courses: Course[];
  total: number;
  totalPages: number;
  currentPage: number;
  perPage: number;
}

export interface EnrolledCourse extends Course {
  enrolledAt: string;
  progress: number;
  lastAccessed: string;
  completedLessons: number[];
  completedAt?: string;
  certificateId?: string;
}

export interface Certificate {
  id: string;
  courseId: number;
  courseName: string;
  courseThumbnail: string;
  studentName: string;
  issuedAt: string;
  certificateUrl: string;
  verificationCode: string;
}
