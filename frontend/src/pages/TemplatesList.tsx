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
                console.error("Failed to load templates", err);
                setError("Failed to load your templates.");
            } finally {
                setLoading(false);
            }
        };

        fetchTemplates();
    }, []);

    const handleTemplateClick = (templateId: number) => {
        // Navigate to editor with template ID
        navigate(`/?templateId=${templateId}`);
    };

    const handleDelete = async (e: React.MouseEvent, templateId: number) => {
        e.stopPropagation(); // Prevent card click navigation
        if (!confirm("Are you sure you want to delete this template?")) {
            return;
        }
        try {
            await templateApi.deleteTemplate(templateId);
            setTemplates(templates.filter(t => t.id !== templateId));
        } catch (err) {
            console.error("Failed to delete template", err);
            setError("Failed to delete template.");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFE033]"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-6">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-[#111827]">My Templates</h1>
                <button
                    onClick={() => navigate('/')}
                    className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#333] text-white rounded-lg transition-colors"
                >
                    Create New
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-6">
                    {error}
                </div>
            )}

            {templates.length === 0 && !error ? (
                <div className="text-center py-20 bg-white rounded-lg border border-[#E5E7EB]">
                    <p className="text-[#6B7280] text-lg mb-4">You haven't saved any templates yet.</p>
                    <button
                        onClick={() => navigate('/')}
                        className="text-[#1A1A1A] hover:text-[#333] font-medium"
                    >
                        Create your first template
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map((template) => (
                        <div
                            key={template.id}
                            onClick={() => handleTemplateClick(template.id)}
                            className="card-highlight bg-white border border-[#E5E7EB] rounded-xl p-6 cursor-pointer hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-[#FFF9C4] rounded-lg transition-colors">
                                    <svg className="w-6 h-6 text-[#1A1A1A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-[#6B7280]">
                                        {new Date(template.created_at).toLocaleDateString()}
                                    </span>
                                    <button
                                        onClick={(e) => handleDelete(e, template.id)}
                                        className="p-1 text-[#9CA3AF] hover:text-red-500 transition-colors"
                                        title="Delete template"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <h3 className="text-xl font-semibold text-[#111827] mb-2 transition-colors">
                                {template.name}
                            </h3>
                            <p className="text-[#6B7280] text-sm">
                                Click to use this template
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TemplatesList;
