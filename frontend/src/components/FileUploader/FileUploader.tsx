import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { templateApi, TemplateState } from '../../services/api';
import { DynamicFormGenerator } from '../DynamicFormGenerator';

function FileUploader() {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [templateState, setTemplateState] = useState<TemplateState | null>(null);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
        if (isPdf) {
            setError('For best results, please upload a Word (.docx) file. We will convert it to PDF for you on export.');
            return;
        }

        const isDocx =
            file.name.toLowerCase().endsWith('.docx') ||
            file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        if (!isDocx) {
            setError('Please upload a supported Word (.docx) file.');
            return;
        }

        setIsUploading(true);
        setError(null);

        try {
            const response = await templateApi.createTemplate(file);
            setTemplateState(response);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to upload document';
            setError(errorMessage);
            console.error('Upload error:', err);
        } finally {
            setIsUploading(false);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        },
        maxFiles: 1,
    });

    const handlePreview = async (data: Record<string, string>) => {
        if (!templateState) return;
        try {
            const blob = await templateApi.previewDocument(templateState.template_file_path, null, data);
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (err) {
            setError('Failed to generate preview');
            console.error('Preview error:', err);
        }
    };

    const handleGenerate = async (data: Record<string, string>, format: string, customFilename?: string) => {
        if (!templateState) return;
        try {
            const blob = await templateApi.generateFinalDocument(
                templateState.template_file_path,
                null,
                data,
                format
            );
            const isPdf = format === 'pdf' || blob.type === 'application/pdf';
            const ext = isPdf ? 'pdf' : 'docx';
            const finalName = customFilename || templateState.original_file_path.replace(/\.[^/.]+$/, '');
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${finalName}.${ext}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            setError('Failed to generate document');
            console.error('Generate error:', err);
        }
    };

    const handleReset = () => {
        setTemplateState(null);
        setError(null);
    };

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-0">

            {/* Dropzone — only shown before upload */}
            {!templateState && (
                <div
                    {...getRootProps()}
                    className={`
                        relative flex flex-col items-center justify-center gap-4
                        border-2 border-dashed rounded-xl p-10 sm:p-16 cursor-pointer
                        transition-all duration-150
                        ${isDragActive
                            ? 'border-[#CA8A04] bg-[#FFFDF0]'
                            : 'border-[#E4E4E7] bg-white hover:border-[#CA8A04] hover:bg-[#FAFAFA]'
                        }
                        ${isUploading ? 'pointer-events-none opacity-70' : ''}
                    `}
                >
                    <input {...getInputProps()} />

                    {/* Icon */}
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 ${isDragActive ? 'bg-[#FFE033]' : 'bg-[#F4F4F5]'}`}>
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

                    {/* Text */}
                    <div className="text-center">
                        {isUploading ? (
                            <p className="text-sm font-medium text-[#09090B]">Processing document…</p>
                        ) : isDragActive ? (
                            <p className="text-sm font-semibold text-[#CA8A04]">Drop it here</p>
                        ) : (
                            <>
                                <p className="text-sm font-semibold text-[#09090B] tracking-tight">
                                    Drag & drop your .docx here
                                </p>
                                <p className="text-xs text-[#71717A] mt-1">or click to browse files</p>
                                <p className="text-xs text-[#71717A] mt-3 leading-relaxed">
                                    Word documents with{' '}
                                    <span className="bg-[#FFE033] px-1.5 rounded text-[#09090B] font-medium">
                                        yellow highlights
                                    </span>{' '}
                                    become smart forms instantly
                                </p>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Error message */}
            {error && (
                <div className="mt-4 flex items-start gap-3 px-4 py-3 bg-[#FEF2F2] border border-[#FECACA] rounded-lg">
                    <svg className="w-4 h-4 text-[#EF4444] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-[#EF4444] flex-1">{error}</p>
                    <button onClick={() => setError(null)} className="text-[#EF4444] hover:opacity-70 flex-shrink-0 transition-opacity">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Template loaded — header + form */}
            {templateState && templateState.fields.length > 0 && (
                <div>
                    {/* File header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 pb-6 border-b border-[#E4E4E7]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#FFFDF0] rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-[#CA8A04]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-[#09090B] tracking-tight truncate max-w-xs sm:max-w-sm">
                                    {templateState.original_file_path}
                                </p>
                                <p className="text-xs text-[#71717A]">
                                    {templateState.fields.length} field{templateState.fields.length !== 1 ? 's' : ''} detected
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleReset}
                            className="text-sm text-[#71717A] hover:text-[#09090B] transition-colors flex items-center gap-1.5 self-start sm:self-auto flex-shrink-0"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                            </svg>
                            Upload different file
                        </button>
                    </div>

                    <DynamicFormGenerator
                        fields={templateState.fields.map(f => ({
                            ...f,
                            type: f.type as 'text' | 'date' | 'email' | 'phone' | 'number' | 'currency',
                        }))}
                        templateId={templateState.template_file_path}
                        onPreview={handlePreview}
                        onGenerate={handleGenerate}
                    />
                </div>
            )}

            {/* No fields found */}
            {templateState && templateState.fields.length === 0 && (
                <div className="text-center py-16">
                    <div className="w-16 h-16 bg-[#FFFDF0] rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-[#CA8A04]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <h3 className="text-base font-semibold text-[#09090B] tracking-tight mb-1">
                        No highlighted fields found
                    </h3>
                    <p className="text-sm text-[#71717A] max-w-xs mx-auto mb-6">
                        The document was processed but no yellow-highlighted text was detected. Make sure fields are highlighted in yellow in your Word document.
                    </p>
                    <button
                        onClick={handleReset}
                        className="px-4 py-2.5 bg-[#18181B] hover:bg-[#27272A] text-white text-sm font-medium rounded-md transition-colors"
                    >
                        Try another file
                    </button>
                </div>
            )}
        </div>
    );
}

export default FileUploader;
