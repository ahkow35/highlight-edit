/**
 * TemplateEditor Page
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import { useNavigate, useLocation } from 'react-router-dom';
import { templateApi, draftsApi, TemplateState } from '../services/api';
import { FieldRow } from '../components/FieldRow';
import { useAuth } from '../context/AuthContext';
import InstructionsEmptyState from '../components/InstructionsEmptyState';
import UsageIndicator from '../components/UsageIndicator';
import UseCasesSection from '../components/UseCasesSection';

interface FormData {
    [key: string]: string;
}

type SaveStatus = 'idle' | 'saving' | 'saved';

export default function TemplateEditor() {
    const [isUploading, setIsUploading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [outputFormat, setOutputFormat] = useState('docx');
    const [error, setError] = useState<string | null>(null);
    const [templateState, setTemplateState] = useState<TemplateState | null>(null);
    const [customFilename, setCustomFilename] = useState('');
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    // Refs for debounce control
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const savedFadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const draftLoadedRef = useRef(false); // Prevent auto-save from firing during hydration

    // Update filename when template loads
    useEffect(() => {
        if (templateState) {
            setCustomFilename(templateState.original_file_path.replace(/\.[^/.]+$/, "") || 'document');
        }
    }, [templateState?.original_file_path]);

    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        watch,
    } = useForm<FormData>();

    // --- Draft hydration on template load ---
    useEffect(() => {
        if (!templateState || !isAuthenticated) return;
        const templateId = templateState.template_file_path;

        const loadDraft = async () => {
            try {
                const draftData = await draftsApi.getDraft(templateId);
                if (draftData && Object.values(draftData).some(v => v)) {
                    // Hydrate form with draft values
                    reset(draftData);
                }
            } catch (e) {
                console.error('[TemplateEditor] Failed to load draft:', e);
            } finally {
                // Allow auto-save after a short delay to avoid saving the hydration itself
                setTimeout(() => { draftLoadedRef.current = true; }, 500);
            }
        };
        draftLoadedRef.current = false;
        loadDraft();
    }, [templateState?.template_file_path, isAuthenticated]);

    // --- Debounced auto-save ---
    useEffect(() => {
        if (!templateState || !isAuthenticated) return;

        const subscription = watch((values) => {
            // Don't save during initial hydration
            if (!draftLoadedRef.current) return;

            // Clear previous timers
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            if (savedFadeTimerRef.current) clearTimeout(savedFadeTimerRef.current);

            setSaveStatus('saving');

            debounceTimerRef.current = setTimeout(async () => {
                try {
                    await draftsApi.saveDraft(
                        templateState.template_file_path,
                        values as Record<string, string>
                    );
                    setSaveStatus('saved');
                    // Fade out after 2s
                    savedFadeTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
                } catch (e) {
                    console.error('[TemplateEditor] Auto-save failed:', e);
                    setSaveStatus('idle');
                }
            }, 1500);
        });

        return () => {
            subscription.unsubscribe();
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            if (savedFadeTimerRef.current) clearTimeout(savedFadeTimerRef.current);
        };
    }, [templateState?.template_file_path, isAuthenticated, watch]);

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
                data,
                outputFormat
            );

            // Trigger download
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const ext = outputFormat === 'pdf' ? 'pdf' : 'docx';
            const finalName = customFilename || templateState.original_file_path.replace(/\.[^/.]+$/, "");
            a.download = `${finalName}.${ext}`;
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

    // Clear Form — reset fields + delete draft
    const handleClearForm = async () => {
        reset();
        draftLoadedRef.current = false;
        setSaveStatus('idle');
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

        if (templateState && isAuthenticated) {
            try {
                await draftsApi.deleteDraft(templateState.template_file_path);
            } catch (e) {
                console.error('[TemplateEditor] Failed to delete draft:', e);
            }
        }
        setShowClearConfirm(false);
        // Re-enable auto-save after a short delay
        setTimeout(() => { draftLoadedRef.current = true; }, 500);
    };

    // Reset to upload new file
    const handleNewFile = () => {
        setTemplateState(null);
        setError(null);
        reset();
        draftLoadedRef.current = false;
        setSaveStatus('idle');
    };

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
            {/* Usage Indicator for free users */}
            <div className="mb-6">
                <UsageIndicator />
            </div>

            {/* Error Banner */}
            {error && (
                <div className="mb-6 flex items-start gap-3 px-4 py-3 bg-[#FEF2F2] border border-[#FECACA] rounded-lg">
                    <svg className="w-4 h-4 text-[#EF4444] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-[#EF4444] flex-1">{error}</p>
                    <button onClick={() => setError(null)} className="text-[#EF4444] hover:opacity-70 flex-shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Loading State for Template from URL */}
            {isUploading && location.search.includes('templateId') && (
                <div className="mb-6 py-16 text-center">
                    <svg className="w-8 h-8 animate-spin text-[#CA8A04] mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <p className="text-sm text-[#71717A]">Loading template…</p>
                </div>
            )}

            {/* Empty State Instructions */}
            {!templateState && !location.search.includes('templateId') && (
                <InstructionsEmptyState />
            )}

            {/* Use Cases */}
            {!templateState && !location.search.includes('templateId') && (
                <UseCasesSection />
            )}

            {/* Upload State - only show when not loading a template from URL */}
            {!templateState && !location.search.includes('templateId') && (
                <div
                    {...getRootProps()}
                    className={`
                        cursor-pointer rounded-2xl border-2 border-dashed p-16 text-center
                        transition-all duration-200
                        ${isDragActive
                            ? 'border-[#FFE033] bg-[#FFFDF0]'
                            : 'border-[#D1D5DB] hover:border-[#FFE033] bg-[#FAF9F6]'
                        }
                        ${isUploading ? 'opacity-50 pointer-events-none' : ''}
                    `}
                >
                    <input {...getInputProps()} />

                    <div className="flex flex-col items-center gap-4">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors ${isDragActive ? 'bg-[#FFE033]' : 'bg-[#F4F4F5]'}`}>
                            {isUploading ? (
                                <svg className="w-7 h-7 animate-spin text-[#CA8A04]" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                            ) : (
                                <svg className={`w-7 h-7 ${isDragActive ? 'text-[#09090B]' : 'text-[#71717A]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                            )}
                        </div>

                        {isUploading ? (
                            <div className="text-center">
                                <p className="text-sm font-semibold text-[#09090B] tracking-tight">Processing document…</p>
                                <p className="text-xs text-[#71717A] mt-1">Detecting highlighted fields</p>
                            </div>
                        ) : (
                            <div className="text-center">
                                <p className="text-sm font-semibold text-[#09090B] tracking-tight">
                                    {isDragActive ? 'Drop it here' : 'Drop your document here'}
                                </p>
                                <p className="text-xs text-[#71717A] mt-1">
                                    Supports Word (.docx) with <span className="bg-[#FFE033] px-1 rounded font-medium text-[#09090B]">yellow highlights</span>
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Template Editor - Document Card */}
            {templateState && templateState.fields && templateState.fields.length > 0 && (
                <div className="card-highlight bg-white rounded-xl border border-[#E4E4E7] overflow-hidden">
                    {/* Card Header */}
                    <div className="px-6 py-5 border-b border-[#E4E4E7] bg-[#FAFAFA]">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-base font-semibold text-[#09090B] tracking-tight">
                                    {templateState.original_file_path}
                                </h1>
                                <p className="text-xs text-[#71717A] mt-0.5">
                                    {templateState.fields?.length || 0} field{(templateState.fields?.length || 0) !== 1 ? 's' : ''} to complete
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleSaveTemplate}
                                    type="button"
                                    className="text-sm font-medium text-[#CA8A04] hover:text-[#A16207] transition-colors flex items-center gap-1.5"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                    </svg>
                                    Save to Library
                                </button>
                                <button
                                    onClick={handleNewFile}
                                    className="text-[#71717A] hover:text-[#09090B] transition-colors"
                                    aria-label="Close"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Save Status + Clear Form */}
                        <div className="flex items-center justify-between mt-3">
                            <div className="h-4">
                                {saveStatus === 'saving' && (
                                    <span className="text-xs text-[#71717A] flex items-center gap-1.5 animate-pulse">
                                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                                        Saving…
                                    </span>
                                )}
                                {saveStatus === 'saved' && (
                                    <span className="text-xs text-[#16A34A] flex items-center gap-1.5">
                                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                                        Saved
                                    </span>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowClearConfirm(true)}
                                className="text-xs text-[#71717A] hover:text-[#EF4444] transition-colors"
                            >
                                Clear Form
                            </button>
                        </div>
                    </div>

                    {/* Clear Confirmation Banner */}
                    {showClearConfirm && (
                        <div className="px-6 py-3 bg-[#FEF2F2] border-b border-[#FECACA] flex items-center justify-between">
                            <p className="text-sm text-[#EF4444]">Clear all fields? This cannot be undone.</p>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowClearConfirm(false)}
                                    className="text-xs text-[#71717A] hover:text-[#09090B] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleClearForm}
                                    className="text-xs font-semibold text-[#EF4444] hover:opacity-70 transition-opacity"
                                >
                                    Yes, clear
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Form Fields */}
                    <form onSubmit={handleSubmit(handleGenerate)} className="px-6 py-5">
                        <div className="space-y-5">
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

                        <div className="mt-6 pt-5 border-t border-[#E4E4E7] space-y-5">
                            {/* Format Selection */}
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-medium text-[#71717A] uppercase tracking-wider">
                                    1. Select Output Format
                                </label>
                                <div className="flex bg-[#F4F4F5] rounded-lg p-1 border border-[#E4E4E7] self-start">
                                    <button
                                        type="button"
                                        onClick={() => setOutputFormat('docx')}
                                        className={`
                                            px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2
                                            ${outputFormat === 'docx'
                                                ? 'bg-[#18181B] text-white shadow-sm border border-[#FFE033]'
                                                : 'text-[#71717A] hover:text-[#09090B] hover:bg-white'}
                                        `}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Word (.docx)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setOutputFormat('pdf')}
                                        className={`
                                            px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2
                                            ${outputFormat === 'pdf'
                                                ? 'bg-[#18181B] text-white shadow-sm border border-[#FFE033]'
                                                : 'text-[#71717A] hover:text-[#09090B] hover:bg-white'}
                                        `}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                        PDF (.pdf)
                                    </button>
                                </div>
                            </div>

                            {/* Filename Input */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-medium text-[#71717A] uppercase tracking-wider">
                                    2. Filename (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={customFilename}
                                    onChange={(e) => setCustomFilename(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-white border border-[#E4E4E7] rounded-lg text-sm text-[#09090B] placeholder:text-[#71717A] focus:outline-none focus:ring-2 focus:ring-[#FFE033]/40 focus:border-[#CA8A04] hover:border-[#CA8A04] transition-all"
                                    placeholder="e.g. MyContract"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-medium text-[#71717A] uppercase tracking-wider">
                                    3. Generate
                                </label>
                                <div>
                                    <button
                                        type="submit"
                                        disabled={isGenerating}
                                        className={`
                                            w-full sm:w-auto px-6 py-3 rounded-lg font-semibold text-sm
                                            bg-[#18181B] hover:bg-[#27272A] text-white
                                            focus:outline-none focus:ring-2 focus:ring-[#FFE033]/40
                                            transition-all duration-150
                                            disabled:opacity-50 disabled:cursor-not-allowed
                                            flex items-center justify-center gap-2
                                        `}
                                    >
                                            {isGenerating ? (
                                                <span className="flex items-center gap-2">
                                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                    </svg>
                                                    Generating {outputFormat === 'pdf' ? 'PDF' : 'DOCX'}…
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-2">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                    </svg>
                                                    Download {outputFormat === 'pdf' ? 'PDF' : 'Word Doc'}
                                                </span>
                                            )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* No Fields State */}
            {templateState && templateState.fields && templateState.fields.length === 0 && (
                <div className="card-highlight bg-white rounded-xl border border-[#E4E4E7] p-12 text-center">
                    <div className="w-14 h-14 bg-[#FFFDF0] rounded-xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-7 h-7 text-[#CA8A04]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <h2 className="text-base font-semibold text-[#09090B] tracking-tight mb-1.5">
                        No highlighted fields found
                    </h2>
                    <p className="text-sm text-[#71717A] mb-6 max-w-sm mx-auto">
                        We couldn't detect any yellow-highlighted text in your document.
                        Make sure to highlight the fields you want to make editable in yellow.
                    </p>
                    <button
                        onClick={handleNewFile}
                        className="px-4 py-2.5 bg-[#18181B] hover:bg-[#27272A] text-white text-sm font-medium rounded-md transition-colors"
                    >
                        Try another file
                    </button>
                </div>
            )}
        </div>
    );
}
