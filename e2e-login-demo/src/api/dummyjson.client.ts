import { APIRequestContext, APIResponse } from '@playwright/test';

export type LoginPayload = {
  username: string;
  /** Omit to exercise the "missing password" error case. */
  password?: string;
};

export type UserPayload = {
  firstName: string;
  lastName?: string;
  age?: number;
};

/**
 * Thin wrapper around the DummyJSON demo API (https://dummyjson.com) — mirrors
 * the Page Object pattern used for UI tests (src/pages/*.page.ts), but for
 * HTTP calls instead of browser actions. No API key or signup is required:
 * these are the public demo endpoints (/auth/login, /users).
 */
export class DummyJsonClient {
  constructor(private readonly request: APIRequestContext) {}

  login(payload: LoginPayload): Promise<APIResponse> {
    return this.request.post('/auth/login', { data: payload });
  }

  listUsers(limit = 10): Promise<APIResponse> {
    return this.request.get(`/users?limit=${limit}`);
  }

  getUser(id: string | number): Promise<APIResponse> {
    return this.request.get(`/users/${id}`);
  }

  createUser(payload: UserPayload): Promise<APIResponse> {
    return this.request.post('/users/add', { data: payload });
  }

  updateUser(id: string | number, payload: UserPayload): Promise<APIResponse> {
    return this.request.put(`/users/${id}`, { data: payload });
  }

  deleteUser(id: string | number): Promise<APIResponse> {
    return this.request.delete(`/users/${id}`);
  }
}
