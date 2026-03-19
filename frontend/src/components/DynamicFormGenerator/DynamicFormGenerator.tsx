/**
 * DynamicFormGenerator Component
 *
 * Renders a dynamic form from detected document fields.
 * Precision Light design system — light theme, yellow accents, SVG icons only.
 */

import { useForm, SubmitHandler } from 'react-hook-form';
import { useState } from 'react';
import clsx from 'clsx';

export interface DetectedField {
    id: number;
    original_text: string;
    type: 'text' | 'date' | 'email' | 'phone' | 'number' | 'currency';
    placeholder: string;
    page?: number;
    paragraph?: number;
}

interface DynamicFormGeneratorProps {
    fields: DetectedField[];
    templateId: string;
    onPreview: (data: FormData) => Promise<void>;
    onGenerate: (data: FormData, format: string, customFilename?: string) => Promise<void>;
    className?: string;
}

interface FormData {
    [key: string]: string;
}

const getInputType = (fieldType: string): string => {
    switch (fieldType) {
        case 'email': return 'email';
        case 'phone': return 'tel';
        default: return 'text';
    }
};

export default function DynamicFormGenerator({
    fields,
    templateId,
    onPreview,
    onGenerate,
    className,
}: DynamicFormGeneratorProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);
    const [outputFormat, setOutputFormat] = useState('docx');
    const [customFilename, setCustomFilename] = useState(
        templateId.replace(/\.[^/.]+$/, '') || 'document'
    );

    const {
        register,
        handleSubmit,
        formState: { errors, isDirty },
        watch,
        reset,
    } = useForm<FormData>({
        defaultValues: fields.reduce((acc, field) => {
            acc[`field_${field.id}`] = '';
            return acc;
        }, {} as FormData),
    });

    const watchedValues = watch();
    const filledCount = Object.values(watchedValues).filter(Boolean).length;
    const progressPct = fields.length > 0 ? (filledCount / fields.length) * 100 : 0;

    const handlePreview: SubmitHandler<FormData> = async (data) => {
        setIsSubmitting(true);
        try {
            await onPreview(data);
            setPreviewMode(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGenerate: SubmitHandler<FormData> = async (data) => {
        setIsSubmitting(true);
        try {
            await onGenerate(data, outputFormat, customFilename);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={clsx('bg-white border border-[#E4E4E7] rounded-xl overflow-hidden card-highlight', className)}>

            {/* Header */}
            <div className="px-5 py-4 border-b border-[#E4E4E7] bg-[#FAFAFA] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <svg className="w-5 h-5 text-[#CA8A04]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div>
                        <h2 className="text-sm font-semibold text-[#09090B] tracking-tight">Fill in Document Fields</h2>
                        <p className="text-xs text-[#71717A]">
                            {fields.length} field{fields.length !== 1 ? 's' : ''} detected
                        </p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <form className="p-5 space-y-4">

                {/* Field list */}
                {fields.map((field, index) => (
                    <div
                        key={field.id}
                        className={clsx(
                            'animate-fade-in border border-[#E4E4E7] rounded-lg p-4',
                            'hover:border-[#CA8A04] transition-all duration-150',
                            'focus-within:border-[#CA8A04] focus-within:ring-1 focus-within:ring-[#FFE033]/40'
                        )}
                        style={{ animationDelay: `${index * 40}ms` }}
                    >
                        {/* Label + type badge */}
                        <div className="flex items-center justify-between mb-2">
                            <label
                                htmlFor={`field_${field.id}`}
                                className="text-sm font-semibold text-[#09090B] tracking-tight leading-tight"
                            >
                                {field.original_text}
                            </label>
                            <span className="text-xs px-2 py-0.5 bg-[#F4F4F5] text-[#71717A] rounded-full uppercase tracking-wider font-medium flex-shrink-0 ml-2">
                                {field.type}
                            </span>
                        </div>

                        {/* Context preview */}
                        <div className="mb-3 px-3 py-2 bg-[#FFFDF0] border border-[#FFE033]/30 rounded-md">
                            <span className="text-xs text-[#71717A] uppercase tracking-wide block mb-0.5">
                                Replacing
                            </span>
                            <p className="text-sm text-[#CA8A04] font-medium break-words">
                                "{field.original_text}"
                            </p>
                        </div>

                        {/* Input */}
                        <input
                            type={getInputType(field.type)}
                            id={`field_${field.id}`}
                            placeholder="Enter value…"
                            {...register(`field_${field.id}`, { required: 'This field is required' })}
                            className={clsx(
                                'w-full px-4 py-3 bg-white border rounded-lg text-sm text-[#09090B] placeholder:text-[#71717A]',
                                'focus:outline-none focus:ring-2 focus:ring-[#FFE033]/40 focus:border-[#CA8A04]',
                                'hover:border-[#CA8A04] transition-all duration-150',
                                errors[`field_${field.id}`] ? 'border-[#EF4444]' : 'border-[#E4E4E7]'
                            )}
                        />

                        {/* Error */}
                        {errors[`field_${field.id}`] && (
                            <p className="mt-1.5 text-xs text-[#EF4444]">
                                {errors[`field_${field.id}`]?.message}
                            </p>
                        )}

                        {/* Location badge */}
                        {(field.page || field.paragraph) && (
                            <p className="mt-1.5 text-xs text-[#71717A]">
                                {field.page && `Page ${field.page}`}
                                {field.page && field.paragraph && ' · '}
                                {field.paragraph && `¶${field.paragraph}`}
                            </p>
                        )}
                    </div>
                ))}

                {/* Empty state */}
                {fields.length === 0 && (
                    <div className="text-center py-16 px-6">
                        <div className="w-14 h-14 bg-[#F4F4F5] rounded-xl flex items-center justify-center mx-auto mb-4">
                            <svg className="w-7 h-7 text-[#71717A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-sm font-semibold text-[#09090B] tracking-tight mb-1">No fields detected</h3>
                        <p className="text-xs text-[#71717A]">
                            Upload a document with yellow highlighted text to get started.
                        </p>
                    </div>
                )}

                {/* Actions */}
                {fields.length > 0 && (
                    <div className="pt-4 border-t border-[#E4E4E7] space-y-3">

                        {/* Format toggle */}
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-medium text-[#71717A]">Format:</span>
                            <div className="flex bg-[#F4F4F5] rounded-md p-0.5 border border-[#E4E4E7]">
                                <button
                                    type="button"
                                    onClick={() => setOutputFormat('docx')}
                                    className={clsx(
                                        'px-3 py-1.5 rounded text-xs font-semibold transition-all',
                                        outputFormat === 'docx'
                                            ? 'bg-white text-[#09090B] shadow-sm border border-[#E4E4E7]'
                                            : 'text-[#71717A] hover:text-[#09090B]'
                                    )}
                                >
                                    Word (.docx)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setOutputFormat('pdf')}
                                    className={clsx(
                                        'px-3 py-1.5 rounded text-xs font-semibold transition-all',
                                        outputFormat === 'pdf'
                                            ? 'bg-white text-[#09090B] shadow-sm border border-[#E4E4E7]'
                                            : 'text-[#71717A] hover:text-[#09090B]'
                                    )}
                                >
                                    PDF (.pdf)
                                </button>
                            </div>
                        </div>

                        {/* Filename */}
                        <div>
                            <label className="block text-xs font-medium text-[#71717A] mb-1">Filename</label>
                            <input
                                type="text"
                                value={customFilename}
                                onChange={(e) => setCustomFilename(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-[#E4E4E7] rounded-md text-sm text-[#09090B] placeholder:text-[#71717A] focus:outline-none focus:ring-2 focus:ring-[#FFE033]/40 focus:border-[#CA8A04] hover:border-[#CA8A04] transition-all"
                                placeholder="Document filename"
                            />
                        </div>

                        {/* Buttons — stacked on mobile, row on sm+ */}
                        <div className="flex flex-col sm:flex-row gap-2">
                            <button
                                type="button"
                                onClick={handleSubmit(handlePreview)}
                                disabled={isSubmitting || !isDirty}
                                className={clsx(
                                    'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors',
                                    isSubmitting || !isDirty
                                        ? 'bg-[#F4F4F5] text-[#71717A] cursor-not-allowed'
                                        : 'bg-white border border-[#E4E4E7] text-[#09090B] hover:border-[#CA8A04] hover:bg-[#FAFAFA]'
                                )}
                            >
                                {isSubmitting && previewMode ? (
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                                Preview
                            </button>

                            <button
                                type="button"
                                onClick={handleSubmit(handleGenerate)}
                                disabled={isSubmitting}
                                className={clsx(
                                    'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors',
                                    isSubmitting
                                        ? 'bg-[#27272A] text-white/60 cursor-not-allowed'
                                        : 'bg-[#18181B] hover:bg-[#27272A] text-white'
                                )}
                            >
                                {isSubmitting && !previewMode ? (
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                )}
                                Generate {outputFormat === 'pdf' ? 'PDF' : 'Word'}
                            </button>
                        </div>

                        {/* Reset */}
                        {isDirty && (
                            <button
                                type="button"
                                onClick={() => reset()}
                                className="w-full text-xs text-[#71717A] hover:text-[#09090B] transition-colors py-1 text-center"
                            >
                                Reset all fields
                            </button>
                        )}
                    </div>
                )}
            </form>

            {/* Progress footer */}
            {fields.length > 0 && (
                <div className="px-5 py-4 bg-[#FAFAFA] border-t border-[#E4E4E7]">
                    <div className="flex items-center justify-between text-xs text-[#71717A] mb-2">
                        <span>{filledCount} of {fields.length} fields filled</span>
                        <span>{Math.round(progressPct)}%</span>
                    </div>
                    <div className="h-1.5 bg-[#E4E4E7] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#FFE033] rounded-full transition-all duration-300"
                            style={{ width: `${progressPct}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
