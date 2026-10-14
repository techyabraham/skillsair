import type {
  Course,
  CoursesResponse,
  CourseFilters,
  CourseSection,
  Certificate,
  EnrolledCourse,
} from "@/types/course";
import type { Order, Subscription, WooProduct } from "@/types/order";
import type { PasswordChangeData, ProfileUpdateData, StudentStats, User } from "@/types/user";

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText })) as {
      message?: string;
      error?: { message?: string };
    };
    throw new Error(error.error?.message || error.message || `API Error: ${response.status}`);
  }

  const payload = await response.json() as { success?: boolean; data?: T };
  return payload?.success === true && "data" in payload ? payload.data as T : payload as T;
}

export const tutorApi = {
  async getCourses(filters: CourseFilters = {}): Promise<CoursesResponse> {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.page) params.set("page", String(filters.page));
    if (filters.perPage) params.set("per_page", String(filters.perPage));
    if (filters.sort) params.set("sort", filters.sort);
    if (filters.category) params.set("category", filters.category);

    const base = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");
    const url = `${base}/api/courses?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch courses");
    return res.json() as Promise<CoursesResponse>;
  },

  async getCourse(slug: string): Promise<Course> {
    const base = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");
    const res = await fetch(`${base}/api/courses/${slug}`);
    if (!res.ok) throw new Error("Course not found");
    return res.json() as Promise<Course>;
  },

  async getCurriculum(courseId: number): Promise<CourseSection[]> {
    return apiFetch<CourseSection[]>(`/api/learning/courses/${courseId}/curriculum`);
  },

  async enrollCourse(courseId: number): Promise<{ success: boolean; message: string }> {
    return apiFetch(`/api/learning/courses/${courseId}/enroll`, { method: "POST", body: JSON.stringify({}) });
  },

  async getStudentProgress(studentId: number): Promise<EnrolledCourse[]> {
    const base = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");
    const res = await fetch(`${base}/api/students/${studentId}/courses`);
    if (!res.ok) throw new Error("Failed to fetch enrolled courses");
    return res.json() as Promise<EnrolledCourse[]>;
  },

  async getCertificates(studentId: number): Promise<Certificate[]> {
    const base = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");
    const res = await fetch(`${base}/api/students/${studentId}/certificates`);
    if (!res.ok) throw new Error("Failed to fetch certificates");
    return res.json() as Promise<Certificate[]>;
  },

  async markLessonComplete(
    courseId: number,
    lessonId: number,
    watchedSeconds = 0,
    isCompleted = true
  ): Promise<{ success: boolean }> {
    return apiFetch(`/api/learning/courses/${courseId}/lessons/${lessonId}/progress`, {
      method: "POST",
      body: JSON.stringify({ watchedSeconds, isCompleted }),
    });
  },

  async getCourseQuizzes(courseId: number): Promise<CourseQuiz[]> {
    return apiFetch<CourseQuiz[]>(`/api/learning/courses/${courseId}/quizzes`);
  },

  async submitQuiz(
    quizId: number,
    answers: Array<{ questionId: number; optionIndex: number }>,
  ): Promise<{ id: number; score: number; passed: boolean }> {
    return apiFetch(`/api/learning/quizzes/${quizId}/submit`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    });
  },

  async getStudentStats(studentId: number): Promise<StudentStats> {
    const base = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");
    const res = await fetch(`${base}/api/students/${studentId}/stats`);
    if (!res.ok) throw new Error("Failed to fetch student stats");
    return res.json() as Promise<StudentStats>;
  },
};

export const wooApi = {
  async getProducts(params: Record<string, string> = {}): Promise<WooProduct[]> {
    const query = new URLSearchParams(params);
    const response = await apiFetch<CoursesResponse>(`/api/courses?${query.toString()}`);
    return response.courses.map((course) => ({
      id: course.id,
      name: course.title,
      slug: course.slug,
      type: "course",
      status: course.status === "publish" ? "publish" : "draft",
      price: String(course.price),
      regularPrice: String(course.regularPrice),
      salePrice: course.salePrice === undefined ? undefined : String(course.salePrice),
      description: course.description,
      shortDescription: course.excerpt,
      images: course.thumbnail ? [{ src: course.thumbnail, alt: course.title }] : [],
      categories: course.categories.map(({ id, name, slug }) => ({ id, name, slug })),
    }));
  },

  async createOrder(data: Record<string, unknown>): Promise<Order> {
    return apiFetch<Order>("/api/checkout", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getOrder(id: number): Promise<Order> {
    return apiFetch<Order>(`/api/orders/${id}`);
  },

  async getOrders(customerId: number): Promise<Order[]> {
    const base = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");
    const res = await fetch(`${base}/api/orders?customer=${customerId}`);
    if (!res.ok) return [];
    return res.json() as Promise<Order[]>;
  },

  async getSubscriptions(customerId: number): Promise<Subscription[]> {
    const base = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");
    const res = await fetch(`${base}/api/subscriptions?customer=${customerId}`);
    if (!res.ok) return [];
    return res.json() as Promise<Subscription[]>;
  },

  async cancelSubscription(subscriptionId: number): Promise<void> {
    await apiFetch("/api/subscriptions/cancel", {
      method: "POST",
      body: JSON.stringify({ subscriptionId }),
    });
  },

};

export interface CourseQuiz {
  id: number;
  title: string;
  passingScore: number;
  questions: Array<{ id: number; prompt: string; options: string[] }>;
}

export const backendApi = {
  async subscribeNewsletter(email: string): Promise<{ success: boolean }> {
    return apiFetch("/api/newsletter", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  async updateProfile(userId: number, data: ProfileUpdateData): Promise<User> {
    return apiFetch<User>("/api/profile", {
      method: "PATCH",
      body: JSON.stringify({ id: userId, ...data }),
    });
  },

  async changePassword(
    userId: number,
    email: string,
    data: PasswordChangeData
  ): Promise<{ success: boolean }> {
    return apiFetch<{ success: boolean }>("/api/profile/password", {
      method: "PATCH",
      body: JSON.stringify({
        userId,
        email,
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }),
    });
  },

  async uploadAvatar(formData: FormData): Promise<{ url: string }> {
    const response = await fetch("/api/profile/avatar", {
      method: "POST",
      body: formData,
    });
    if (!response.ok) throw new Error("Upload failed");
    return response.json() as Promise<{ url: string }>;
  },
};
