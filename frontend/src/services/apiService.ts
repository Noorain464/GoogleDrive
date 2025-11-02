const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiService {
  constructor() {}

  // File operations
  async getFiles(parentId: string | null = null) {
    const response = await fetch(`${API_URL}/api/files?parentId=${parentId || ''}`, {
      credentials: 'include'
    });
    return await response.json();
  }

  async createFolder(name: string, parentId: string | null = null) {
    const response = await fetch(`${API_URL}/api/files`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ name, type: 'folder', parentId })
    });
    return await response.json();
  }

  async uploadFile(file: File, parentId: string | null = null) {
    const formData = new FormData();
    formData.append('file', file);
    if (parentId) formData.append('parentId', parentId);

    const response = await fetch(`${API_URL}/api/files/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData
    });
    return await response.json();
  }

  async renameFile(fileId: string, newName: string) {
    const response = await fetch(`${API_URL}/api/files/${fileId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ name: newName })
    });
    return await response.json();
  }

  async deleteFile(fileId: string) {
    const response = await fetch(`${API_URL}/api/files/${fileId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    return await response.json();
  }

  // Authentication
  async login(email: string, password: string) {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });
    return await response.json();
  }

  async register(email: string, password: string) {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });
    return await response.json();
  }

  async logout() {
    const response = await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    return await response.json();
  }

  // Placeholder for future real-time features if needed
  async subscribeToFileChanges(_fileId: string, _callback: (data: any) => void) {
    // Implementation will be added when real-time features are needed
  }

  async unsubscribeFromFileChanges(_fileId: string) {
    // Implementation will be added when real-time features are needed
  }
}

export const apiService = new ApiService();