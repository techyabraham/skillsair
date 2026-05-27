import { NextRequest, NextResponse } from "next/server";
import {
  fetchTutorCourses,
  findTutorCourseForProduct,
  mapProductToCourse,
  tutorHeaders,
  tutorUrl,
  wcHeaders,
  wcUrl,
  type TutorCourseRecord,
  type WcProduct,
} from "@/lib/server-course-catalog";
import type { EnrolledCourse } from "@/types/course";

function stripHtml(html = ""): string {
  return html.replace(/<[^>]+>/g, "").trim();
}

function progress(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value.replace("%", "")) || 0;
  return 0;
}

function tutorId(course: TutorCourseRecord): number {
  const value = course.ID || course.id || course.course_id;
  return Number(value) || 0;
}

function matchProduct(
  course: TutorCourseRecord,
  products: WcProduct[],
  tutorCourses: TutorCourseRecord[]
): WcProduct | null {
  return products.find((product) => findTutorCourseForProduct(product, tutorCourses)?.ID === course.ID) || null;
}

function mapTutorToEnrolled(
  enrolled: TutorCourseRecord[],
  products: WcProduct[],
  tutorCourses: TutorCourseRecord[]
): EnrolledCourse[] {
  return enrolled.map((course) => {
    const product = matchProduct(course, products, tutorCourses);
    const base = product
      ? mapProductToCourse(product, course)
      : mapProductToCourse(
          {
            id: tutorId(course),
            name: String(course.post_title || course.title || "Course"),
            slug: String(course.post_name || course.slug || tutorId(course)),
            description: String(course.post_content || ""),
            short_description: String(course.post_excerpt || ""),
            price: "0",
            regular_price: "0",
            sale_price: "",
            images: [],
            categories: [],
            average_rating: "0",
            rating_count: 0,
            total_sales: 0,
            date_created: String(course.post_date || ""),
            date_modified: String(course.post_modified || ""),
          },
          course
        );
    return {
      ...base,
      excerpt:
        base.excerpt ||
        stripHtml(String(course.post_excerpt || course.post_content || "")).slice(0, 180),
      progress: progress(course.course_completed_percentage),
      enrolledAt: String(course.post_date || new Date().toISOString()),
      lastAccessed: String(course.post_modified || new Date().toISOString()),
      completedLessons: [],
    };
  });
}

/**
 * WooCommerce orders fallback.
 *
 * When TutorLMS has no auth configured (or returns an empty list), we look up
 * completed/processing orders for this customer and treat purchased course
 * products as enrolled courses. This ensures users who were enrolled directly
 * from the WordPress dashboard (without going through the Next.js checkout)
 * still see their courses here.
 */
async function getEnrolledCoursesFromOrders(studentId: number): Promise<EnrolledCourse[]> {
  try {
    // Fetch completed AND processing orders so recently-purchased courses appear
    const ordersRes = await fetch(
      wcUrl("/orders", {
        customer: String(studentId),
        status: "completed",
        per_page: "100",
      }),
      { headers: wcHeaders(), cache: "no-store" }
    );

    let orders: Array<{ line_items?: Array<{ product_id?: number }> }> = [];

    if (ordersRes.ok) {
      orders = await ordersRes.json().catch(() => []);
    }

    // Also grab "processing" orders (paid but not yet fulfilled)
    const processingRes = await fetch(
      wcUrl("/orders", {
        customer: String(studentId),
        status: "processing",
        per_page: "100",
      }),
      { headers: wcHeaders(), cache: "no-store" }
    );
    if (processingRes.ok) {
      const processing = await processingRes.json().catch(() => []);
      if (Array.isArray(processing)) orders = [...orders, ...processing];
    }

    if (!Array.isArray(orders) || orders.length === 0) return [];

    // Collect all unique purchased product IDs
    const productIds = new Set<number>();
    for (const order of orders) {
      for (const item of order.line_items || []) {
        if (typeof item.product_id === "number" && item.product_id > 0) {
          productIds.add(item.product_id);
        }
      }
    }
    if (productIds.size === 0) return [];

    // Fetch the full product catalogue + TutorLMS courses for metadata enrichment
    const [allProducts, tutorCourses] = await Promise.all([
      fetch(wcUrl("/products", { status: "publish", per_page: "100" }), {
        headers: wcHeaders(),
        next: { revalidate: 60 },
      })
        .then((r) => r.json() as Promise<WcProduct[]>)
        .catch(() => [] as WcProduct[]),
      fetchTutorCourses(),
    ]);

    // Only keep products the student actually purchased
    const purchasedProducts = (allProducts as WcProduct[]).filter((p) => productIds.has(p.id));

    return purchasedProducts.map((product) => {
      const tutorCourse = findTutorCourseForProduct(product, tutorCourses) ?? undefined;
      const base = mapProductToCourse(product, tutorCourse);
      return {
        ...base,
        progress: 0,
        enrolledAt: new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
        completedLessons: [],
      };
    });
  } catch {
    return [];
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const studentId = Number(params.id);
  if (!Number.isFinite(studentId) || studentId <= 0) {
    return NextResponse.json({ message: "Invalid student ID" }, { status: 400 });
  }

  // ── 1. Try TutorLMS ─────────────────────────────────────────────────────────
  let enrolled: TutorCourseRecord[] = [];
  let tutorSucceeded = false;

  try {
    const enrolledRes = await fetch(tutorUrl(`/students/${studentId}/courses`), {
      headers: tutorHeaders(),
      cache: "no-store",
    });
    if (enrolledRes.ok) {
      const enrolledPayload = await enrolledRes.json().catch(() => ({}));
      const items = Array.isArray(enrolledPayload.data?.enrolled_courses)
        ? (enrolledPayload.data.enrolled_courses as TutorCourseRecord[])
        : [];
      enrolled = items;
      tutorSucceeded = true;
    }
  } catch {
    // TutorLMS unreachable — fall through to WooCommerce orders
  }

  // ── 2. WooCommerce orders fallback ──────────────────────────────────────────
  // Use this when TutorLMS failed OR returned no courses.
  // Covers users enrolled directly from the WordPress dashboard (no app checkout).
  if (!tutorSucceeded || enrolled.length === 0) {
    return NextResponse.json(await getEnrolledCoursesFromOrders(studentId));
  }

  // ── 3. Enrich TutorLMS results with WooCommerce product data ────────────────
  const [products, tutorCourses] = await Promise.all([
    fetch(wcUrl("/products", { status: "publish", per_page: "100" }), {
      headers: wcHeaders(),
      next: { revalidate: 60 },
    })
      .then((r) => r.json() as Promise<WcProduct[]>)
      .catch(() => [] as WcProduct[]),
    fetchTutorCourses(),
  ]);

  return NextResponse.json(mapTutorToEnrolled(enrolled, products, tutorCourses));
}
