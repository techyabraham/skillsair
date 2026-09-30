<?php
/**
 * Plugin Name: SkillsAir TutorLMS Patch
 * Description: Fixes PHP 8.x count() crash in the TutorLMS /students/{id}/courses REST endpoint.
 *              Intercepts the broken route and queries tutor_enrolled posts directly.
 * Author: SkillsAir
 * Version: 1.0.0
 */

add_filter( 'rest_dispatch_request', 'sa_fix_tutor_student_courses', 1, 2 );

function sa_fix_tutor_student_courses( $result, WP_REST_Request $request ) {
    // Only intercept the exact broken route
    if ( ! preg_match( '#^/tutor/v1/students/(\d+)/courses$#', $request->get_route(), $matches ) ) {
        return $result;
    }

    $student_id = (int) $matches[1];

    // Query tutor_enrolled posts directly — this is how TutorLMS stores
    // admin-created enrollments in the WordPress database.
    $query = new WP_Query( [
        'post_type'      => 'tutor_enrolled',
        'author'         => $student_id,
        'post_status'    => 'any',
        'posts_per_page' => -1,
        'no_found_rows'  => true,
        'orderby'        => 'date',
        'order'          => 'DESC',
    ] );

    $enrolled_courses = [];

    foreach ( $query->posts as $enrollment ) {
        $course_id = (int) $enrollment->post_parent;
        if ( ! $course_id ) {
            continue;
        }

        $course = get_post( $course_id );
        if ( ! $course || $course->post_status !== 'publish' ) {
            continue;
        }

        // Completion percentage — wrapped in try/catch so a TutorLMS
        // internal error here never breaks the whole response.
        $pct = 0;
        if ( function_exists( 'tutor_utils' ) ) {
            try {
                $raw = tutor_utils()->get_course_completed_percent( $course_id, $student_id );
                $pct = is_numeric( $raw ) ? (int) $raw : 0;
            } catch ( Throwable $e ) {
                $pct = 0;
            }
        }

        // Thumbnail
        $thumbnail = get_the_post_thumbnail_url( $course_id, 'full' );
        if ( ! $thumbnail ) {
            $thumbnail = '';
        }

        // Categories
        $categories = [];
        $terms      = get_the_terms( $course_id, 'course-category' );
        if ( is_array( $terms ) ) {
            foreach ( $terms as $term ) {
                $categories[] = [
                    'term_id' => $term->term_id,
                    'name'    => $term->name,
                    'slug'    => $term->slug,
                    'count'   => (int) $term->count,
                ];
            }
        }

        $enrolled_courses[] = [
            'ID'                          => $course->ID,
            'post_title'                  => $course->post_title,
            'post_name'                   => $course->post_name,
            'post_content'                => $course->post_content,
            'post_excerpt'                => $course->post_excerpt,
            'post_date'                   => $enrollment->post_date,
            'post_modified'               => $course->post_modified,
            'post_status'                 => $course->post_status,
            'post_type'                   => $course->post_type,
            'thumbnail_url'               => $thumbnail,
            'course_category'             => $categories,
            'course_completed_percentage' => $pct,
        ];
    }

    return new WP_REST_Response( [
        'code'    => 'success',
        'message' => 'Courses retrieved successfully',
        'data'    => [
            'enrolled_courses' => $enrolled_courses,
            'total_enrolled'   => count( $enrolled_courses ),
        ],
    ], 200 );
}
