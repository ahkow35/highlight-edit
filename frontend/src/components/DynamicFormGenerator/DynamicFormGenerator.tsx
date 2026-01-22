/**
 * DynamicFormGenerator Component
 * 
 * Renders a dynamic form based on detected fields from document processing.
 * Uses React Hook Form for form state management.
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
    onGenerate: (data: FormData) => Promise<void>;
    className?: string;
}

interface FormData {
    [key: string]: string;
}

export default function DynamicFormGenerator({
    fields,
    templateId,
    onPreview,
    onGenerate,
    className,
}: DynamicFormGeneratorProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);

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
            await onGenerate(data);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getInputType = (fieldType: string): string => {
        switch (fieldType) {
            case 'email':
                return 'email';
            case 'phone':
                return 'tel';
            case 'number':
            case 'currency':
                return 'number';
            case 'date':
                return 'date';
            default:
                return 'text';
        }
    };

    const getFieldIcon = (fieldType: string) => {
        switch (fieldType) {
            case 'email':
                return '✉️';
            case 'phone':
                return '📞';
            case 'date':
                return '📅';
            case 'currency':
                return '💰';
            case 'number':
                return '#️⃣';
            default:
                return '📝';
        }
    };

    return (
        <div
            className={clsx(
                'bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden',
                className
            )}
        >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span>📋</span>
                    Fill in Document Fields
                </h2>
                <p className="text-blue-100 text-sm mt-1">
                    {fields.length} field{fields.length !== 1 ? 's' : ''} detected • Template ID: {templateId.slice(0, 8)}
                </p>
            </div>

            {/* Form */}
            <form className="p-6 space-y-6">
                {/* Field List - Single Column for Larger Fields */}
                <div className="space-y-4">
                    {fields.map((field, index) => (
                        <div
                            key={field.id}
                            className={clsx(
                                'animate-fade-in bg-slate-800/50 border border-slate-700 rounded-xl p-5',
                                'hover:border-slate-600 transition-all duration-200',
                                'focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/20'
                            )}
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            {/* Field Header */}
                            <div className="flex items-start justify-between mb-3">
                                <label
                                    htmlFor={`field_${field.id}`}
                                    className="block text-sm font-medium text-slate-300"
                                >
                                    <span className="flex items-center gap-2">
                                        <span>{getFieldIcon(field.type)}</span>
                                        <span>Field {field.id}</span>
                                    </span>
                                </label>
                                <span className="text-xs px-2 py-0.5 bg-slate-700 rounded-full text-slate-400 uppercase tracking-wider">
                                    {field.type}
                                </span>
                            </div>

                            {/* Original Text (Label) */}
                            <div className="mb-3 p-2 bg-yellow-400/10 border border-yellow-400/20 rounded-lg">
                                <span className="text-xs text-yellow-400/70 uppercase tracking-wide">
                                    Original Highlighted Text:
                                </span>
                                <p className="text-yellow-200 font-medium mt-0.5 break-words">
                                    "{field.original_text}"
                                </p>
                            </div>

                            {/* Input Field - Larger */}
                            <input
                                type={getInputType(field.type)}
                                id={`field_${field.id}`}
                                placeholder={`Enter value to replace: "${field.original_text}"`}
                                {...register(`field_${field.id}`, {
                                    required: 'This field is required',
                                })}
                                className={clsx(
                                    'w-full px-4 py-4 bg-slate-900 border rounded-lg text-lg',
                                    'text-white placeholder-slate-500',
                                    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                                    'transition-all duration-200',
                                    errors[`field_${field.id}`]
                                        ? 'border-red-500'
                                        : 'border-slate-600 hover:border-slate-500'
                                )}
                            />

                            {/* Error Message */}
                            {errors[`field_${field.id}`] && (
                                <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                                    <span>⚠️</span>
                                    {errors[`field_${field.id}`]?.message}
                                </p>
                            )}

                            {/* Location Info */}
                            {(field.page || field.paragraph) && (
                                <p className="mt-2 text-xs text-slate-500">
                                    {field.page && `Page ${field.page}`}
                                    {field.page && field.paragraph && ' • '}
                                    {field.paragraph && `Paragraph ${field.paragraph}`}
                                </p>
                            )}
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {fields.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">📄</div>
                        <h3 className="text-xl font-medium text-slate-300 mb-2">
                            No Fields Detected
                        </h3>
                        <p className="text-slate-500">
                            Upload a document with yellow highlighted text to get started.
                        </p>
                    </div>
                )}

                {/* Action Buttons */}
                {fields.length > 0 && (
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-700">
                        {/* Preview Button */}
                        <button
                            type="button"
                            onClick={handleSubmit(handlePreview)}
                            disabled={isSubmitting || !isDirty}
                            className={clsx(
                                'flex-1 px-6 py-3 rounded-xl font-semibold text-sm',
                                'flex items-center justify-center gap-2',
                                'transition-all duration-200',
                                isSubmitting || !isDirty
                                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                    : 'bg-slate-700 text-white hover:bg-slate-600 active:scale-[0.98]'
                            )}
                        >
                            {isSubmitting && previewMode ? (
                                <>
                                    <span className="animate-spin">⏳</span>
                                    Generating Preview...
                                </>
                            ) : (
                                <>
                                    <span>👁️</span>
                                    Preview Document
                                </>
                            )}
                        </button>

                        {/* Generate Button */}
                        <button
                            type="button"
                            onClick={handleSubmit(handleGenerate)}
                            disabled={isSubmitting}
                            className={clsx(
                                'flex-1 px-6 py-3 rounded-xl font-semibold text-sm',
                                'flex items-center justify-center gap-2',
                                'transition-all duration-200',
                                isSubmitting
                                    ? 'bg-blue-700/50 text-blue-300 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white',
                                'hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98]',
                                'shadow-lg shadow-blue-500/20'
                            )}
                        >
                            {isSubmitting && !previewMode ? (
                                <>
                                    <span className="animate-spin">⏳</span>
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <span>📥</span>
                                    Generate Document
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* Reset Button */}
                {fields.length > 0 && isDirty && (
                    <div className="text-center">
                        <button
                            type="button"
                            onClick={() => reset()}
                            className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                        >
                            Reset all fields
                        </button>
                    </div>
                )}
            </form>

            {/* Summary Footer */}
            {fields.length > 0 && (
                <div className="px-6 py-4 bg-slate-800/50 border-t border-slate-700">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">
                            {Object.values(watchedValues).filter(Boolean).length} of {fields.length} fields filled
                        </span>
                        <div className="flex gap-4 text-slate-500">
                            {fields.some(f => f.type === 'date') && (
                                <span>📅 {fields.filter(f => f.type === 'date').length} dates</span>
                            )}
                            {fields.some(f => f.type === 'email') && (
                                <span>✉️ {fields.filter(f => f.type === 'email').length} emails</span>
                            )}
                        </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="mt-3 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
                            style={{
                                width: `${(Object.values(watchedValues).filter(Boolean).length / fields.length) * 100}%`,
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
