import type { ApiResponse, File, User, AuthResponse } from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiService {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  private getHeaders(isFormData = false): Record<string, string> {
    const headers: Record<string, string> = {};

    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.token) {'http://localhost:3000';

      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'An error occurred'
      };
    }
    
    return data as ApiResponse<T>;
  }
  async getFiles(parentId: string | null = null): Promise<ApiResponse<File[]>> {
    console.log('API_URL:', API_URL);
    const response = await fetch(`${API_URL}/api/files?parentId=${parentId || ''}`, {
      headers: this.getHeaders()
    });
    return this.handleResponse<File[]>(response);
  }

  async createFolder(name: string, parentId: string | null = null): Promise<ApiResponse<File>> {
    const response = await fetch(`${API_URL}/api/files`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ name, type: 'folder', parentId })
    });
    return this.handleResponse<File>(response);
  }

  async uploadFile(file: Blob, parentId: string | null = null): Promise<ApiResponse<File>> {
    const formData = new FormData();
    formData.append('file', file);
    if (parentId) formData.append('parentId', parentId);

    const headers = this.getHeaders(true);

    const response = await fetch(`${API_URL}/api/files/upload`, {
      method: 'POST',
      headers,
      body: formData
    });
    return this.handleResponse<File>(response);
  }

  async renameFile(fileId: string, newName: string): Promise<ApiResponse<File>> {
    const response = await fetch(`${API_URL}/api/files/${fileId}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ name: newName })
    });
    return this.handleResponse<File>(response);
  }

  async deleteFile(fileId: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_URL}/api/files/${fileId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    return this.handleResponse<void>(response);
  }

  async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email, password })
    });
    const apiResponse = await this.handleResponse<AuthResponse>(response);
    
    if (apiResponse.success && apiResponse.data?.token) {
      this.setToken(apiResponse.data.token);
    }
    
    return apiResponse;
  }

  async register(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email, password })
    });
    return this.handleResponse<AuthResponse>(response);
  }

  async logout(): Promise<ApiResponse<{ message: string }>> {
    const response = await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    const apiResponse = await this.handleResponse<{ message: string }>(response);
    
    if (apiResponse.success) {
      this.clearToken();
    }
    
    return apiResponse;
  }
}


export const apiService = new ApiService();