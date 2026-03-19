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
            case 'date': return 'text';
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
                    className="text-sm font-semibold text-[#09090B] tracking-tight leading-tight"
                >
                    {originalText}
                </label>

                {/* Location Badge */}
                {(paragraph || page) && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#F4F4F5] text-[#71717A]">
                        {page && `Page ${page}`}
                        {page && paragraph && ' · '}
                        {paragraph && `¶${paragraph}`}
                    </span>
                )}
            </div>

            {/* Context Preview (if available) */}
            {(contextBefore || contextAfter) && (
                <div className="mb-2 text-sm text-[#6B7280] font-mono">
                    {contextBefore && <span>...{contextBefore} </span>}
                    <span className="bg-[#FFFDF0] text-[#CA8A04] px-1 rounded">
                        {originalText}
                    </span>
                    {contextAfter && <span> {contextAfter}...</span>}
                </div>
            )}

            {/* Input Field */}
            <input
                type={getInputType()}
                id={fieldName}
                placeholder={({ date: 'Enter date...', email: 'Enter email...', phone: 'Enter phone number...', number: 'Enter number...', currency: 'Enter amount...' } as Record<string, string>)[fieldType] ?? 'Enter field...'}
                {...register(fieldName, { required: 'Required' })}
                className={`
                    w-full px-4 py-3
                    bg-white
                    border rounded-lg
                    text-[#09090B] text-sm
                    placeholder:text-[#A1A1AA]
                    transition-colors duration-150
                    focus:outline-none focus:ring-2 focus:ring-[#FFE033]/40 focus:border-[#CA8A04] focus:bg-[#FFFDF0]
                    ${hasError
                        ? 'border-[#FECACA] focus:ring-red-400/40'
                        : 'border-[#E4E4E7] hover:border-[#CA8A04]'
                    }
                `}
            />

            {/* Error Message */}
            {hasError && (
                <p className="mt-1.5 text-sm text-red-500">
                    {errors[fieldName]?.message as string}
                </p>
            )}
        </div>
    );
}
