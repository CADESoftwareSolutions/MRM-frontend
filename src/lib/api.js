export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const GRAPHQL_ENDPOINT = `${API_URL}/graphql`;

export const executeGraphQL = async (query, variables = {}) => {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const result = await response.json();
  if (response.status === 401) throw new Error("Authentication required");
  if (result.errors) throw new Error(result.errors[0].message);
  return result.data;
};
