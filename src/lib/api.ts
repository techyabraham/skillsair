import { getAuthToken } from "./auth";
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

const TUTOR_API = process.env.NEXT_PUBLIC_TUTOR_API || "https://api.skillsair.com/wp-json/tutor/v1";
const WP_API = process.env.NEXT_PUBLIC_WP_API || "https://api.skillsair.com/wp-json";
const WC_API = `${WP_API}/wc/v3`;

const WC_CONSUMER_KEY = process.env.WC_CONSUMER_KEY || "";
const WC_CONSUMER_SECRET = process.env.WC_CONSUMER_SECRET || "";

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error((error as { message?: string }).message || `API Error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function wcUrl(path: string, params: Record<string, string> = {}): string {
  const url = new URL(`${WC_API}${path}`);
  url.searchParams.set("consumer_key", WC_CONSUMER_KEY);
  url.searchParams.set("consumer_secret", WC_CONSUMER_SECRET);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return url.toString();
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
    return apiFetch<CourseSection[]>(`${TUTOR_API}/courses/${courseId}/curriculum`);
  },

  async enrollCourse(courseId: number): Promise<{ success: boolean; message: string }> {
    return apiFetch(`${TUTOR_API}/courses/${courseId}/enroll`, { method: "POST" });
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
    lessonId: number
  ): Promise<{ success: boolean }> {
    return apiFetch(`${TUTOR_API}/courses/${courseId}/lessons/${lessonId}/complete`, {
      method: "POST",
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
    return apiFetch<WooProduct[]>(wcUrl("/products", params));
  },

  async createOrder(data: Record<string, unknown>): Promise<Order> {
    return apiFetch<Order>(wcUrl("/orders"), {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getOrder(id: number): Promise<Order> {
    return apiFetch<Order>(wcUrl(`/orders/${id}`));
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

  async applyCoupon(code: string): Promise<{ valid: boolean; discount: string }> {
    return apiFetch(wcUrl("/coupons/validate"), {
      method: "POST",
      body: JSON.stringify({ code }),
    });
  },
};

export const wpApi = {
  async subscribeNewsletter(email: string): Promise<{ success: boolean }> {
    return apiFetch("/api/newsletter", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  async updateProfile(userId: number, data: ProfileUpdateData): Promise<User> {
    const token = getAuthToken();
    return apiFetch<User>("/api/profile", {
      method: "PATCH",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ id: userId, ...data }),
    });
  },

  async changePassword(
    userId: number,
    email: string,
    data: PasswordChangeData
  ): Promise<{ success: boolean }> {
    const token = getAuthToken();
    return apiFetch<{ success: boolean }>("/api/profile/password", {
      method: "PATCH",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({
        userId,
        email,
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }),
    });
  },

  async uploadAvatar(formData: FormData): Promise<{ url: string }> {
    const token = getAuthToken();
    const response = await fetch("/api/profile/avatar", {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    if (!response.ok) throw new Error("Upload failed");
    return response.json() as Promise<{ url: string }>;
  },
};
