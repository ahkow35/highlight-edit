/**
 * Type definitions for Highlight Edit
 */

export interface HighlightedField {
    id: string;
    original_text: string;
    page?: number;
    paragraph?: number;
    run_index?: number;
    rect?: {
        x0: number;
        y0: number;
        x1: number;
        y1: number;
    };
    new_value?: string;
}

export interface DocumentUploadResponse {
    document_id: string;
    filename: string;
    highlights: HighlightedField[];
}

export interface FieldUpdate {
    field_id: string;
    new_value: string;
}

export interface DocumentGenerateRequest {
    document_id: string;
    field_updates: FieldUpdate[];
}

export type FileType = 'pdf' | 'docx';

export interface UploadState {
    file: File | null;
    isUploading: boolean;
    error: string | null;
    documentId: string | null;
    highlights: HighlightedField[];
}
