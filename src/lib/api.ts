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
import type { StudentStats } from "@/types/user";

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
    if (filters.category) params.set("category", filters.category);
    if (filters.level) params.set("level", filters.level);
    if (filters.page) params.set("page", String(filters.page));
    if (filters.perPage) params.set("per_page", String(filters.perPage));
    if (filters.sort) params.set("orderby", filters.sort);

    const url = `${TUTOR_API}/courses?${params.toString()}`;
    return apiFetch<CoursesResponse>(url);
  },

  async getCourse(id: number): Promise<Course> {
    return apiFetch<Course>(`${TUTOR_API}/courses/${id}`);
  },

  async getCurriculum(courseId: number): Promise<CourseSection[]> {
    return apiFetch<CourseSection[]>(`${TUTOR_API}/courses/${courseId}/curriculum`);
  },

  async enrollCourse(courseId: number): Promise<{ success: boolean; message: string }> {
    return apiFetch(`${TUTOR_API}/courses/${courseId}/enroll`, { method: "POST" });
  },

  async getStudentProgress(studentId: number): Promise<EnrolledCourse[]> {
    return apiFetch<EnrolledCourse[]>(`${TUTOR_API}/students/${studentId}/progress`);
  },

  async getCertificates(studentId: number): Promise<Certificate[]> {
    return apiFetch<Certificate[]>(`${TUTOR_API}/students/${studentId}/certificates`);
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
    return apiFetch<StudentStats>(`${TUTOR_API}/students/${studentId}/stats`);
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
    return apiFetch<Order[]>(wcUrl("/orders", { customer: String(customerId) }));
  },

  async getSubscriptions(customerId: number): Promise<Subscription[]> {
    return apiFetch<Subscription[]>(
      wcUrl("/subscriptions", { customer: String(customerId) })
    );
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
    return apiFetch(`${WP_API}/wp/v2/newsletter`, {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  async uploadAvatar(formData: FormData): Promise<{ url: string }> {
    const token = getAuthToken();
    const response = await fetch(`${WP_API}/wp/v2/media`, {
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
