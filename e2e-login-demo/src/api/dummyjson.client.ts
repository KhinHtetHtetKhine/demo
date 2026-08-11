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
