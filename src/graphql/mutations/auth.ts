import { gql } from "@apollo/client";

export const LOGIN_USER = gql`
  mutation LoginUser($username: String!, $password: String!) {
    login(
      input: {
        clientMutationId: "skillsair-login"
        username: $username
        password: $password
      }
    ) {
      authToken
      refreshToken
      user {
        id
        databaseId
        firstName
        lastName
        displayName
        email
        avatar {
          url
        }
        roles {
          nodes {
            name
          }
        }
      }
    }
  }
`;

export const REGISTER_USER = gql`
  mutation RegisterUser(
    $username: String!
    $email: String!
    $password: String!
    $firstName: String!
    $lastName: String!
  ) {
    registerUser(
      input: {
        clientMutationId: "skillsair-register"
        username: $username
        email: $email
        password: $password
        firstName: $firstName
        lastName: $lastName
      }
    ) {
      user {
        id
        databaseId
        firstName
        lastName
        displayName
        email
        avatar {
          url
        }
      }
    }
  }
`;

export const REFRESH_AUTH_TOKEN = gql`
  mutation RefreshAuthToken($jwtRefreshToken: String!) {
    refreshJwtAuthToken(
      input: {
        clientMutationId: "skillsair-refresh"
        jwtRefreshToken: $jwtRefreshToken
      }
    ) {
      authToken
    }
  }
`;

export const SEND_PASSWORD_RESET_EMAIL = gql`
  mutation SendPasswordResetEmail($username: String!) {
    sendPasswordResetEmail(
      input: {
        clientMutationId: "skillsair-reset"
        username: $username
      }
    ) {
      user {
        email
      }
    }
  }
`;

export const RESET_USER_PASSWORD = gql`
  mutation ResetUserPassword(
    $key: String!
    $login: String!
    $password: String!
  ) {
    resetUserPassword(
      input: {
        clientMutationId: "skillsair-reset-password"
        key: $key
        login: $login
        password: $password
      }
    ) {
      user {
        email
      }
    }
  }
`;

export const UPDATE_USER = gql`
  mutation UpdateUser(
    $id: ID!
    $firstName: String
    $lastName: String
    $displayName: String
    $description: String
  ) {
    updateUser(
      input: {
        clientMutationId: "skillsair-update-user"
        id: $id
        firstName: $firstName
        lastName: $lastName
        displayName: $displayName
        description: $description
      }
    ) {
      user {
        id
        firstName
        lastName
        displayName
        description
      }
    }
  }
`;
