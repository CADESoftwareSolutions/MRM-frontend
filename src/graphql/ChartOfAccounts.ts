const CHART_OF_ACCOUNT_FIELDS = `
  id
  glAccount
  subAccount
  description
  category
  isActive
  createdById
  updatedById
  createdAt
  updatedAt
`;

// Posted journal lines are what make an account "used"; the backend has no per-account count yet,
// so the chart of accounts query brings them along to count.
export const FETCH_CHART_OF_ACCOUNTS = `
  query FetchChartOfAccounts {
    chartOfAccounts {
      ${CHART_OF_ACCOUNT_FIELDS}
    }
    journalEntries(status: "posted") {
      id
      lines {
        chartOfAccountId
      }
    }
  }
`;

export const CREATE_CHART_OF_ACCOUNT = `
  mutation CreateChartOfAccount(
    $glAccount: Int!
    $subAccount: Int
    $description: String!
    $category: String!
  ) {
    createChartOfAccount(
      glAccount: $glAccount
      subAccount: $subAccount
      description: $description
      category: $category
    ) {
      chartOfAccount {
        ${CHART_OF_ACCOUNT_FIELDS}
      }
    }
  }
`;

export const UPDATE_CHART_OF_ACCOUNT = `
  mutation UpdateChartOfAccount(
    $id: Int!
    $description: String
    $category: String
    $isActive: Boolean
  ) {
    updateChartOfAccount(
      id: $id
      description: $description
      category: $category
      isActive: $isActive
    ) {
      chartOfAccount {
        ${CHART_OF_ACCOUNT_FIELDS}
      }
    }
  }
`;

export const DELETE_CHART_OF_ACCOUNT = `
  mutation DeleteChartOfAccount($id: Int!) {
    deleteChartOfAccount(id: $id) {
      success
    }
  }
`;
