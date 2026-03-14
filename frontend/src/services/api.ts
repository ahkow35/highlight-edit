import axios from 'axios';
import type { DocumentUploadResponse, DocumentGenerateRequest } from '../types';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,  // send cookies automatically
});

api.interceptors.request.use(
    (config) => config,
    (error) => {
        console.error("Request Error:", error);
        return Promise.reject(error);
    }
);

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
    is_admin: boolean;
    created_at: string;
    usage_count: number;
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
    async login(email: string, password: string): Promise<void> {
        const params = new URLSearchParams();
        params.append('username', email);
        params.append('password', password);
        await api.post('/auth/login', params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        // Token is now in httpOnly cookie — nothing to store
    },

    async signup(email: string, password: string, inviteCode: string): Promise<User> {
        const response = await api.post<User>('/auth/signup', { email, password, invite_code: inviteCode });
        return response.data;
    },

    async getMe(): Promise<User> {
        const response = await api.get<User>('/auth/me');
        return response.data;
    },

    async logout(): Promise<void> {
        await api.post('/auth/logout');
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

// --- Analytics Types ---

export interface AnalyticsOverview {
    total_users: number;
    active_users_today: number;
    active_users_this_week: number;
    active_users_this_month: number;
    total_events_today: number;
    total_documents_generated: number;
    plan_distribution: Record<string, number>;
    signups_this_week: number;
}

export interface EventSeriesPoint {
    date: string;
    [eventType: string]: string | number;
}

export interface EventSeries {
    series: EventSeriesPoint[];
}

export interface AnalyticsUser {
    id: number;
    email: string;
    plan: string;
    total_events: number;
    last_active: string | null;
    documents_generated: number;
    signup_date: string | null;
}

export interface UserDetail {
    user: { id: number; email: string; plan: string };
    stats: {
        total_events: number;
        events_this_month: number;
        documents_generated: number;
        templates_saved: number;
        limit_hits: number;
        last_active: string | null;
    };
    recent_events: Array<{
        event_type: string;
        created_at: string;
        metadata: Record<string, any>;
    }>;
}

export const analyticsApi = {
    async getOverview(): Promise<AnalyticsOverview> {
        const response = await api.get<AnalyticsOverview>('/analytics/overview');
        return response.data;
    },

    async getEvents(days: number = 30, eventType?: string): Promise<EventSeries> {
        const params = new URLSearchParams({ days: days.toString() });
        if (eventType) params.append('event_type', eventType);
        const response = await api.get<EventSeries>(`/analytics/events?${params}`);
        return response.data;
    },

    async getTopUsers(limit: number = 20): Promise<{ users: AnalyticsUser[] }> {
        const response = await api.get(`/analytics/users?sort=events&order=desc&limit=${limit}`);
        return response.data;
    },

    async getUserDetail(userId: number): Promise<UserDetail> {
        const response = await api.get<UserDetail>(`/analytics/user/${userId}`);
        return response.data;
    },
};

export const draftsApi = {
    async getDraft(templateId: string): Promise<Record<string, string> | null> {
        try {
            const response = await api.get(`/drafts/${encodeURIComponent(templateId)}`);
            if (!response.data) return null;
            return response.data.field_data || null;
        } catch {
            return null;
        }
    },

    async saveDraft(templateId: string, fieldData: Record<string, string>): Promise<void> {
        await api.post(`/drafts/${encodeURIComponent(templateId)}`, { field_data: fieldData });
    },

    async deleteDraft(templateId: string): Promise<void> {
        await api.delete(`/drafts/${encodeURIComponent(templateId)}`);
    },
};

export default api;
