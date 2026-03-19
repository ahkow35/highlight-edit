import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { templateApi, TemplateResponse } from '../services/api';

const TemplatesList: React.FC = () => {
    const [templates, setTemplates] = useState<TemplateResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const data = await templateApi.listTemplates();
                setTemplates(data);
            } catch (err) {
                console.error('Failed to load templates', err);
                setError('Failed to load your templates.');
            } finally {
                setLoading(false);
            }
        };
        fetchTemplates();
    }, []);

    const handleTemplateClick = (templateId: number) => {
        navigate(`/?templateId=${templateId}`);
    };

    const handleDelete = async (e: React.MouseEvent, templateId: number) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this template?')) return;
        try {
            await templateApi.deleteTemplate(templateId);
            setTemplates(templates.filter((t) => t.id !== templateId));
        } catch (err) {
            console.error('Failed to delete template', err);
            setError('Failed to delete template.');
        }
    };

    // Skeleton loading
    if (loading) {
        return (
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                <div className="flex justify-between items-center mb-8">
                    <div className="h-6 w-36 skeleton" />
                    <div className="h-9 w-32 skeleton rounded-md" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white border border-[#E4E4E7] rounded-xl p-5 card-highlight">
                            <div className="flex justify-between mb-4">
                                <div className="w-10 h-10 skeleton rounded-lg" />
                                <div className="w-20 h-4 skeleton" />
                            </div>
                            <div className="h-4 w-3/4 skeleton mb-2" />
                            <div className="h-3 w-1/2 skeleton" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-xl font-semibold text-[#09090B] tracking-tight">My Templates</h1>
                <button
                    onClick={() => navigate('/')}
                    className="px-4 py-2.5 bg-[#18181B] hover:bg-[#27272A] text-white text-sm font-medium rounded-md transition-colors"
                >
                    Upload New File
                </button>
            </div>

            {error && (
                <div className="flex items-start gap-3 px-4 py-3 bg-[#FEF2F2] border border-[#FECACA] rounded-lg mb-6">
                    <svg className="w-4 h-4 text-[#EF4444] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-[#EF4444]">{error}</p>
                </div>
            )}

            {templates.length === 0 && !error ? (
                <div className="text-center py-20 bg-white rounded-xl border border-[#E4E4E7]">
                    <div className="w-14 h-14 bg-[#FFFDF0] rounded-xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-7 h-7 text-[#CA8A04]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="text-sm font-semibold text-[#09090B] tracking-tight mb-1">No templates saved yet</h3>
                    <p className="text-xs text-[#71717A] max-w-xs mx-auto mb-5">
                        Save a template to reuse it instantly — skip re-uploading the same document every time.
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-4 py-2.5 bg-[#18181B] hover:bg-[#27272A] text-white text-sm font-medium rounded-md transition-colors"
                    >
                        Upload your first document
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map((template) => (
                        <div
                            key={template.id}
                            onClick={() => handleTemplateClick(template.id)}
                            className="group bg-white border border-[#E4E4E7] rounded-xl p-5 cursor-pointer hover:border-[#CA8A04] transition-colors card-highlight"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-10 h-10 bg-[#FFFDF0] rounded-lg flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-[#CA8A04]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-[#71717A]">
                                        {new Date(template.created_at).toLocaleDateString()}
                                    </span>
                                    <button
                                        onClick={(e) => handleDelete(e, template.id)}
                                        className="p-1 text-[#E4E4E7] hover:text-[#EF4444] transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                        title="Delete template"
                                        aria-label="Delete template"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-sm font-semibold text-[#09090B] tracking-tight mb-1 truncate">
                                {template.name}
                            </h3>

                            {/* Action row — fades in on hover (always visible on mobile) */}
                            <div className="mt-3 pt-3 border-t border-[#E4E4E7] flex items-center gap-1.5
                                            sm:opacity-0 sm:group-hover:opacity-100 sm:transition-opacity sm:duration-150">
                                <span className="text-xs text-[#CA8A04] font-medium">Use template</span>
                                <svg className="w-3 h-3 text-[#CA8A04]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TemplatesList;
