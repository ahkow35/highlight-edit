/**
 * FieldRow Component
 * 
 * A reusable, minimalist form field for the Enterprise-SaaS template editor.
 * Displays the original highlighted text as the primary label with clean styling.
 */

import { UseFormRegister, FieldErrors } from 'react-hook-form';

interface FieldRowProps {
    fieldId: number;
    originalText: string;
    fieldType: 'text' | 'date' | 'email' | 'phone' | 'number' | 'currency';
    paragraph?: number;
    page?: number;
    register: UseFormRegister<any>;
    errors: FieldErrors;
    contextBefore?: string;
    contextAfter?: string;
}

export default function FieldRow({
    fieldId,
    originalText,
    fieldType,
    paragraph,
    page,
    register,
    errors,
    contextBefore,
    contextAfter,
}: FieldRowProps) {
    const fieldName = `field_${fieldId}`;
    const hasError = !!errors[fieldName];

    const getInputType = (): string => {
        switch (fieldType) {
            case 'email': return 'email';
            case 'phone': return 'tel';
            case 'number':
            case 'currency': return 'text';  // Use text for free-form input without spinners
            case 'date': return 'date';
            default: return 'text';
        }
    };

    return (
        <div className="group">
            {/* Label Row */}
            <div className="flex items-center gap-3 mb-2">
                {/* Primary Label - Original Text */}
                <label
                    htmlFor={fieldName}
                    className="text-base font-semibold text-white leading-tight"
                >
                    {originalText}
                </label>

                {/* Location Badge */}
                {(paragraph || page) && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-700/50 text-slate-400">
                        {page && `Page ${page}`}
                        {page && paragraph && ' · '}
                        {paragraph && `¶${paragraph}`}
                    </span>
                )}
            </div>

            {/* Context Preview (if available) */}
            {(contextBefore || contextAfter) && (
                <div className="mb-2 text-sm text-slate-500 font-mono">
                    {contextBefore && <span>...{contextBefore} </span>}
                    <span className="bg-yellow-500/20 text-yellow-300 px-1 rounded">
                        {originalText}
                    </span>
                    {contextAfter && <span> {contextAfter}...</span>}
                </div>
            )}

            {/* Input Field */}
            <input
                type={getInputType()}
                id={fieldName}
                placeholder={`Enter ${fieldType === 'date' ? 'date' : 'value'}...`}
                {...register(fieldName, { required: 'Required' })}
                className={`
                    w-full px-4 py-3
                    bg-slate-900/50 
                    border rounded-lg
                    text-white text-base
                    placeholder:text-slate-500
                    transition-all duration-150
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    ${hasError
                        ? 'border-red-500/50 focus:ring-red-500'
                        : 'border-slate-600/50 hover:border-slate-500'
                    }
                `}
            />

            {/* Error Message */}
            {hasError && (
                <p className="mt-1.5 text-sm text-red-400">
                    {errors[fieldName]?.message as string}
                </p>
            )}
        </div>
    );
}
