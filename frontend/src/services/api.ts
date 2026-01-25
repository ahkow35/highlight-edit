import axios from 'axios';
import type { DocumentUploadResponse, DocumentGenerateRequest } from '../types';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth interceptor
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    console.error("Request Error:", error);
    return Promise.reject(error);
});

// Add response interceptor for logging
api.interceptors.response.use((response) => {
    return response;
}, (error) => {
    console.error("API Error Response:", {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
    });
    return Promise.reject(error);
});

export const documentApi = {
    /**
     * Upload a document and extract highlights
     */
    async uploadDocument(file: File): Promise<DocumentUploadResponse> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post<DocumentUploadResponse>('/documents/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data;
    },

    /**
     * Generate a document with replaced values
     */
    async generateDocument(request: DocumentGenerateRequest): Promise<Blob> {
        const response = await api.post('/documents/generate', request, {
            responseType: 'blob',
        });

        return response.data;
    },
};

export interface TemplateState {
    template_file_path: string;
    original_file_path: string;
    fields: Array<{
        id: number;
        original_text: string;
        type: string;
        placeholder: string;
        page?: number;
        paragraph?: number;
    }>;
}

export interface User {
    id: number;
    email: string;
    is_paid: boolean;
    created_at: string;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
    user?: User; // Optional if not returned by login directly, but we might want to fetch it
}

export interface Template {
    id: number;
    name: string;
    created_at: string;
    file_path: string;
    fields_data: any;
}

export type TemplateResponse = Template;

export const authApi = {
    async login(email: string, password: string): Promise<AuthResponse> {
        const params = new URLSearchParams();
        params.append('username', email);
        params.append('password', password);
        const response = await api.post<AuthResponse>('/auth/login', params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        return response.data;
    },

    async signup(email: string, password: string, inviteCode: string): Promise<User> {
        const response = await api.post<User>('/auth/signup', { email, password, invite_code: inviteCode });
        return response.data;
    },

    async getMe(): Promise<User> {
        const response = await api.get<User>('/auth/me');
        return response.data;
    },

    async upgrade(): Promise<User> {
        const response = await api.post<User>('/auth/upgrade');
        return response.data;
    },

    async forgotPassword(email: string): Promise<{ message: string; reset_token: string }> {
        const response = await api.post('/auth/forgot-password', { email });
        return response.data;
    },

    async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
        const response = await api.post('/auth/reset-password', {
            token,
            new_password: newPassword
        });
        return response.data;
    }
};

export const templateApi = {
    /**
     * Create a template from a document with highlighted fields (Process/Parse)
     */
    async createTemplate(file: File): Promise<TemplateState> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post<TemplateState>('/templates/create', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data;
    },

    /**
     * Save a template to the user's library
     */
    async saveTemplate(name: string, templateState: TemplateState): Promise<Template> {
        const response = await api.post<Template>('/templates/save', {
            name,
            file_path: templateState.template_file_path,
            fields_data: templateState.fields
        });
        return response.data;
    },

    /**
     * List user's templates
     */
    async listTemplates(): Promise<Template[]> {
        const response = await api.get<Template[]>('/templates/');
        return response.data;
    },

    /**
     * Delete a template
     */
    async deleteTemplate(templateId: number): Promise<void> {
        await api.delete(`/templates/${templateId}`);
    },

    /**
     * Preview document with filled values
     */
    async previewDocument(
        templatePath: string | null,
        templateId: number | null,
        fieldValues: Record<string, string>
    ): Promise<Blob> {
        const response = await api.post(
            '/templates/preview',
            { template_path: templatePath, template_id: templateId, field_values: fieldValues },
            { responseType: 'blob' }
        );
        return response.data;
    },

    /**
     * Generate final document with filled values
     */
    async generateFinalDocument(
        templatePath: string | null,
        templateId: number | null,
        fieldValues: Record<string, string>,
        outputFormat: string = 'docx'
    ): Promise<Blob> {
        const response = await api.post(
            '/templates/generate',
            {
                template_path: templatePath,
                template_id: templateId,
                field_values: fieldValues,
                output_format: outputFormat
            },
            { responseType: 'blob' }
        );
        return response.data;
    },
};


// Admin API
export interface AdminUser {
    id: number;
    email: string;
    is_paid: boolean;
    created_at: string;
    usage_count: number;
}

export const adminApi = {
    /**
     * List all users (admin only)
     */
    async listUsers(): Promise<AdminUser[]> {
        const response = await api.get<AdminUser[]>('/admin/users');
        return response.data;
    },

    /**
     * Toggle Pro status for a user
     */
    async toggleUserPro(userId: number): Promise<{ message: string; is_paid: boolean }> {
        const response = await api.patch<{ message: string; user_id: number; is_paid: boolean }>(
            `/admin/users/${userId}/toggle-pro`
        );
        return response.data;
    },

    /**
     * Delete a user
     */
    async deleteUser(userId: number): Promise<void> {
        await api.delete(`/admin/users/${userId}`);
    },
};

export default api;
