import { gql } from "@apollo/client";

export const COURSE_FRAGMENT = gql`
  fragment CourseBasic on Course {
    id
    databaseId
    title
    slug
    excerpt
    featuredImage {
      node {
        sourceUrl
        altText
      }
    }
    courseData {
      price
      regularPrice
      salePrice
      isFree
      level
      duration
      totalLessons
      totalStudents
      language
    }
    rating {
      average
      count
    }
    author {
      node {
        id
        name
        avatar {
          url
        }
      }
    }
    categories {
      nodes {
        id
        name
        slug
      }
    }
  }
`;

export const GET_COURSES = gql`
  ${COURSE_FRAGMENT}
  query GetCourses(
    $first: Int = 12
    $after: String
    $where: RootQueryToCourseConnectionWhereArgs
  ) {
    courses(first: $first, after: $after, where: $where) {
      pageInfo {
        hasNextPage
        endCursor
        total
      }
      nodes {
        ...CourseBasic
      }
    }
  }
`;

export const GET_COURSE = gql`
  query GetCourse($slug: ID!) {
    course(id: $slug, idType: SLUG) {
      id
      databaseId
      title
      slug
      content
      excerpt
      featuredImage {
        node {
          sourceUrl
          altText
        }
      }
      date
      modified
      courseData {
        price
        regularPrice
        salePrice
        isFree
        level
        duration
        totalLessons
        totalStudents
        totalSections
        language
        requirements
        outcomes
        targetAudience
        videoHours
        articles
        downloadableResources
        fullLifetimeAccess
        certificate
        mobileAccess
      }
      rating {
        average
        count
        breakdown {
          oneStar
          twoStar
          threeStar
          fourStar
          fiveStar
        }
      }
      author {
        node {
          id
          databaseId
          name
          description
          avatar {
            url
          }
          instructorData {
            totalStudents
            totalCourses
            rating
          }
        }
      }
      categories {
        nodes {
          id
          name
          slug
        }
      }
      tags {
        nodes {
          id
          name
          slug
        }
      }
    }
  }
`;

export const GET_CATEGORIES = gql`
  query GetCategories {
    categories(where: { hideEmpty: true }) {
      nodes {
        id
        databaseId
        name
        slug
        description
        count
        thumbnail {
          sourceUrl
          altText
        }
      }
    }
  }
`;

export const GET_FEATURED_COURSES = gql`
  ${COURSE_FRAGMENT}
  query GetFeaturedCourses {
    courses(
      first: 6
      where: { orderby: { field: MENU_ORDER, order: ASC }, status: PUBLISH }
    ) {
      nodes {
        ...CourseBasic
      }
    }
  }
`;

export const GET_COURSE_REVIEWS = gql`
  query GetCourseReviews($courseId: ID!, $first: Int = 10) {
    courseReviews(first: $first, where: { courseId: $courseId }) {
      nodes {
        id
        content
        rating
        date
        author {
          node {
            name
            avatar {
              url
            }
          }
        }
      }
    }
  }
`;
