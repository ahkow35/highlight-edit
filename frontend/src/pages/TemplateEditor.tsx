/**
 * TemplateEditor Page
 */

import { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import { useNavigate, useLocation } from 'react-router-dom';
import { templateApi, TemplateState } from '../services/api';
import { FieldRow } from '../components/FieldRow';
import { useAuth } from '../context/AuthContext';

interface FormData {
    [key: string]: string;
}

export default function TemplateEditor() {
    const [isUploading, setIsUploading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [templateState, setTemplateState] = useState<TemplateState | null>(null);

    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Load template from URL ID
    useEffect(() => {
        const loadTemplate = async () => {
            console.log('[TemplateEditor] location.search RAW:', location.search);
            console.log('[TemplateEditor] window.location.search:', window.location.search);

            // Use window.location.search as fallback in case React Router location is stale
            const urlSearch = location.search || window.location.search;
            const searchParams = new URLSearchParams(urlSearch);
            const id = searchParams.get('templateId');
            console.log('[TemplateEditor] Loading template, id:', id, 'isAuthenticated:', isAuthenticated);

            // Wait for auth to be ready and user to be authenticated before fetching
            if (!isAuthenticated) {
                console.log('[TemplateEditor] Not authenticated yet, skipping template load');
                return;
            }

            if (id) {
                const templateIdNum = parseInt(id, 10);
                try {
                    setIsUploading(true); // Show loading state (reusing upload state for simplicity)
                    setError(null);
                    // Since backend doesn't have GET /id, we list all and filter.
                    console.log('[TemplateEditor] Fetching templates list...');
                    const templates = await templateApi.listTemplates();
                    console.log('[TemplateEditor] Templates received:', templates.length, templates);
                    const template = templates.find(t => t.id === templateIdNum);

                    if (template) {
                        console.log('[TemplateEditor] Found template:', template);
                        console.log('[TemplateEditor] Raw fields_data:', template.fields_data);
                        console.log('[TemplateEditor] Type of fields_data:', typeof template.fields_data);

                        // Handle case where fields_data might be a JSON string (SQLite limitation)
                        let fields = template.fields_data;
                        if (typeof fields === 'string') {
                            console.log('[TemplateEditor] Parsing fields_data from string');
                            try {
                                fields = JSON.parse(fields);
                            } catch (parseError) {
                                console.error('[TemplateEditor] Failed to parse fields_data:', parseError);
                                fields = [];
                            }
                        }

                        // Ensure fields is an array
                        if (!Array.isArray(fields)) {
                            console.warn('[TemplateEditor] fields_data is not an array, converting:', fields);
                            fields = fields ? [fields] : [];
                        }

                        console.log('[TemplateEditor] Final fields:', fields, 'length:', fields.length);
                        setTemplateState({
                            template_file_path: template.file_path,
                            original_file_path: template.name, // Use name as display title
                            fields: fields
                        });
                    } else {
                        console.error('[TemplateEditor] Template not found for id:', templateIdNum);
                        setError("Template not found");
                    }
                } catch (e: any) {
                    console.error('[TemplateEditor] Error loading template:', e);
                    setError("Failed to load template: " + (e.message || e));
                } finally {
                    setIsUploading(false);
                }
            }
        };
        loadTemplate();
    }, [location.search, isAuthenticated]);

    const {
        register,
        handleSubmit,
        formState: { errors, isDirty },
        reset,
    } = useForm<FormData>();

    // File upload handler
    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setIsUploading(true);
        setError(null);

        try {
            const response = await templateApi.createTemplate(file);
            setTemplateState(response);
            reset(); // Reset form for new template
        } catch (err: any) {
            console.error('Upload error:', err);
            const msg = err.response?.data?.detail || err.message || 'Failed to process document';
            setError(msg);
        } finally {
            setIsUploading(false);
        }
    }, [reset]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        },
        maxFiles: 1,
        noClick: !!templateState, // Disable click when template is loaded
        noDrag: !!templateState,
    });

    // Generate document handler
    const handleGenerate = async (data: FormData) => {
        if (!templateState) return;

        setIsGenerating(true);
        setError(null);

        try {
            const blob = await templateApi.generateFinalDocument(
                templateState.template_file_path,
                null,
                data
            );

            // Trigger download
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `filled_${templateState.original_file_path}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            setError('Failed to generate document. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    // Save Template Handler
    const handleSaveTemplate = async () => {
        if (!templateState) return;

        if (!isAuthenticated) {
            if (confirm("You need to be logged in to save templates. Go to login?")) {
                navigate('/auth');
            }
            return;
        }

        if (!user?.is_paid) {
            if (confirm("Saving unlimited templates is a Pro feature. Unlock it now?")) {
                navigate('/upgrade');
            }
            return;
        }

        const name = prompt("Enter a name for this template:", templateState.original_file_path);
        if (!name) return;

        try {
            await templateApi.saveTemplate(name, templateState);
            alert("Template saved successfully to your library!");
        } catch (err: any) {
            console.error(err);
            alert("Failed to save template: " + (err.response?.data?.detail || err.message));
        }
    };

    // Reset to upload new file
    const handleNewFile = () => {
        setTemplateState(null);
        setError(null);
        reset();
    };

    return (
        <div className="max-w-3xl mx-auto px-6">
            {/* Error Banner */}
            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-between">
                    <p className="text-red-400 text-sm">{error}</p>
                    <button
                        onClick={() => setError(null)}
                        className="text-red-400 hover:text-red-300"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Loading State for Template from URL */}
            {isUploading && location.search.includes('templateId') && (
                <div className="mb-6 p-8 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading template...</p>
                </div>
            )}

            {/* Upload State - only show when not loading a template from URL */}
            {!templateState && !location.search.includes('templateId') && (
                <div
                    {...getRootProps()}
                    className={`
                        cursor-pointer rounded-2xl border-2 border-dashed p-16 text-center
                        transition-all duration-200
                        ${isDragActive
                            ? 'border-blue-500 bg-blue-500/5'
                            : 'border-slate-700 hover:border-slate-600 bg-slate-900/50'
                        }
                        ${isUploading ? 'opacity-50 pointer-events-none' : ''}
                    `}
                >
                    <input {...getInputProps()} />

                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
                            <span className="text-3xl">📄</span>
                        </div>

                        {isUploading ? (
                            <div>
                                <p className="text-lg font-medium text-white">Processing document...</p>
                                <p className="text-sm text-slate-400 mt-1">Detecting highlighted fields</p>
                            </div>
                        ) : (
                            <div>
                                <p className="text-lg font-medium text-white">
                                    Drop your document here
                                </p>
                                <p className="text-sm text-slate-400 mt-1">
                                    or click to browse • PDF and DOCX supported
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Template Editor - Document Card */}
            {templateState && templateState.fields && templateState.fields.length > 0 && (
                <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                    {/* Card Header */}
                    <div className="px-8 py-6 border-b border-slate-800 bg-slate-900/80">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-xl font-semibold text-white">
                                    {templateState.original_file_path}
                                </h1>
                                <p className="text-sm text-slate-400 mt-1">
                                    {templateState.fields?.length || 0} field{(templateState.fields?.length || 0) !== 1 ? 's' : ''} to complete
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleSaveTemplate}
                                    type="button"
                                    className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                                >
                                    <span>💾</span> Save to Library
                                </button>
                                <button
                                    onClick={handleNewFile}
                                    className="text-sm text-slate-400 hover:text-white transition-colors"
                                >
                                    ✕ Close
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Form Fields */}
                    <form onSubmit={handleSubmit(handleGenerate)} className="px-8 py-6">
                        <div className="space-y-6">
                            {templateState.fields.map((field) => (
                                <FieldRow
                                    key={field.id}
                                    fieldId={field.id}
                                    originalText={field.original_text}
                                    fieldType={field.type as any}
                                    paragraph={field.paragraph}
                                    page={field.page}
                                    register={register}
                                    errors={errors}
                                />
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => reset()}
                                disabled={!isDirty}
                                className="text-sm text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                Clear all
                            </button>

                            <button
                                type="submit"
                                disabled={isGenerating}
                                className={`
                                    px-6 py-3 rounded-xl font-semibold text-sm
                                    bg-gradient-to-r from-blue-600 to-indigo-600 text-white
                                    hover:from-blue-500 hover:to-indigo-500
                                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900
                                    transition-all duration-150
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                    shadow-lg shadow-blue-500/20
                                `}
                            >
                                {isGenerating ? (
                                    <span className="flex items-center gap-2">
                                        <span className="animate-spin">⏳</span>
                                        Generating...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <span>📥</span>
                                        Generate Document
                                    </span>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* No Fields State */}
            {templateState && templateState.fields && templateState.fields.length === 0 && (
                <div className="bg-slate-900 rounded-2xl border border-slate-800 p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">🔍</span>
                    </div>
                    <h2 className="text-xl font-semibold text-white mb-2">
                        No highlighted fields found
                    </h2>
                    <p className="text-slate-400 mb-6 max-w-md mx-auto">
                        We couldn't detect any yellow-highlighted text in your document.
                        Make sure to highlight the fields you want to make editable.
                    </p>
                    <button
                        onClick={handleNewFile}
                        className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-colors"
                    >
                        Try another file
                    </button>
                </div>
            )}
        </div>
    );
}
