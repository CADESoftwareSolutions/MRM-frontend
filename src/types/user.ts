export interface User {
  authenticated: boolean;
  user?: {
    id: number;
    username: string;
  };
  account?: {
    id: number;
    name: string;
  } | null;
}
