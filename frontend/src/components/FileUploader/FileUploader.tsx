import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { templateApi, TemplateState } from '../../services/api';
import { DynamicFormGenerator } from '../DynamicFormGenerator';
import './FileUploader.css';

function FileUploader() {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [templateState, setTemplateState] = useState<TemplateState | null>(null);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setIsUploading(true);
        setError(null);

        try {
            // Use template API to create template with placeholders
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
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        },
        maxFiles: 1,
    });

    const handlePreview = async (data: Record<string, string>) => {
        if (!templateState) return;

        try {
            const blob = await templateApi.previewDocument(
                templateState.template_file_path,
                null,
                data
            );
            // Open preview in new tab
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (err) {
            setError('Failed to generate preview');
            console.error('Preview error:', err);
        }
    };

    const handleGenerate = async (data: Record<string, string>) => {
        if (!templateState) return;

        try {
            const blob = await templateApi.generateFinalDocument(
                templateState.template_file_path,
                null,
                data
            );
            // Download the generated file
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `filled_${templateState.original_file_path}`;
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
        <div className="file-uploader">
            {/* Show dropzone only if no template loaded */}
            {!templateState && (
                <div
                    {...getRootProps()}
                    className={`dropzone ${isDragActive ? 'dropzone-active' : ''} ${isUploading ? 'dropzone-uploading' : ''}`}
                >
                    <input {...getInputProps()} />
                    <div className="dropzone-content">
                        <div className="dropzone-icon">📄</div>
                        {isUploading ? (
                            <p>Processing document...</p>
                        ) : isDragActive ? (
                            <p>Drop the file here...</p>
                        ) : (
                            <>
                                <p className="dropzone-title">Drag & drop your document here</p>
                                <p className="dropzone-subtitle">or click to select a file</p>
                                <p className="dropzone-hint">Supports PDF and DOCX files with yellow highlights</p>
                            </>
                        )}
                    </div>
                </div>
            )}

            {error && (
                <div className="error-message">
                    {error}
                    <button onClick={() => setError(null)} style={{ marginLeft: '1rem' }}>
                        Dismiss
                    </button>
                </div>
            )}

            {/* Show DynamicFormGenerator when template is loaded */}
            {templateState && templateState.fields.length > 0 && (
                <div className="template-editor">
                    <div className="template-header">
                        <div>
                            <h2>📄 {templateState.original_file_path}</h2>
                            <p>{templateState.fields.length} editable field{templateState.fields.length !== 1 ? 's' : ''} detected</p>
                        </div>
                        <button onClick={handleReset} className="btn btn-secondary">
                            ← Upload Different File
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

            {/* Empty state - template loaded but no fields */}
            {templateState && templateState.fields.length === 0 && (
                <div className="no-fields">
                    <div className="no-fields-icon">🔍</div>
                    <h3>No Highlighted Fields Found</h3>
                    <p>The document was processed but no yellow-highlighted text was detected.</p>
                    <p className="hint">Make sure your document has text highlighted in yellow color.</p>
                    <button onClick={handleReset} className="btn btn-primary">
                        Try Another File
                    </button>
                </div>
            )}
        </div>
    );
}

export default FileUploader;
