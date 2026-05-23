import { gql } from "@apollo/client";

export const GET_VIEWER = gql`
  query GetViewer {
    viewer {
      id
      databaseId
      firstName
      lastName
      displayName
      email
      avatar {
        url
      }
      description
      roles {
        nodes {
          name
        }
      }
      studentData {
        phone
        timezone
        enrolledCourses {
          nodes {
            id
            databaseId
            title
            slug
            featuredImage {
              node {
                sourceUrl
                altText
              }
            }
            progress
          }
        }
      }
    }
  }
`;

export const GET_USER_PROFILE = gql`
  query GetUserProfile($id: ID!) {
    user(id: $id) {
      id
      databaseId
      firstName
      lastName
      displayName
      email
      avatar {
        url
      }
      description
      registeredAt: date
    }
  }
`;
