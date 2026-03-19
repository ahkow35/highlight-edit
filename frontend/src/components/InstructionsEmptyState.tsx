import { FaHighlighter, FaCloudUploadAlt, FaMagic } from 'react-icons/fa';

export default function InstructionsEmptyState() {
    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-0 mb-10">
            <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-[#09090B] tracking-tight mb-1.5">
                    How it works
                </h2>
                <p className="text-sm text-[#71717A]">
                    Create smart templates from your documents in three steps.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="card-highlight flex flex-col items-center text-center p-5 rounded-xl bg-white border border-[#E4E4E7]">
                    <div className="w-12 h-12 rounded-xl bg-[#FFFDF0] flex items-center justify-center mb-3">
                        <FaHighlighter className="text-xl text-[#CA8A04]" />
                    </div>
                    <h3 className="text-sm font-semibold text-[#09090B] tracking-tight mb-1.5">
                        Highlight Variables
                    </h3>
                    <p className="text-xs text-[#71717A] leading-relaxed">
                        Open your Word document and mark any text you want to change with a yellow highlight.
                    </p>
                </div>

                <div className="card-highlight flex flex-col items-center text-center p-5 rounded-xl bg-white border border-[#E4E4E7]">
                    <div className="w-12 h-12 rounded-xl bg-[#FFFDF0] flex items-center justify-center mb-3">
                        <FaCloudUploadAlt className="text-xl text-[#CA8A04]" />
                    </div>
                    <h3 className="text-sm font-semibold text-[#09090B] tracking-tight mb-1.5">
                        Upload the File
                    </h3>
                    <p className="text-xs text-[#71717A] leading-relaxed">
                        Drag & drop your .docx here. We detect the highlights automatically — no config needed.
                    </p>
                </div>

                <div className="card-highlight flex flex-col items-center text-center p-5 rounded-xl bg-white border border-[#E4E4E7]">
                    <div className="w-12 h-12 rounded-xl bg-[#FFFDF0] flex items-center justify-center mb-3">
                        <FaMagic className="text-xl text-[#CA8A04]" />
                    </div>
                    <h3 className="text-sm font-semibold text-[#09090B] tracking-tight mb-1.5">
                        Fill & Export
                    </h3>
                    <p className="text-xs text-[#71717A] leading-relaxed">
                        Enter your values. Download a clean, formatted Word or PDF document instantly.
                    </p>
                </div>
            </div>
        </div>
    );
}
