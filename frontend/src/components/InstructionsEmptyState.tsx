import { FaHighlighter, FaCloudUploadAlt, FaMagic } from 'react-icons/fa';

export default function InstructionsEmptyState() {
    return (
        <div className="max-w-3xl mx-auto px-6 mb-12">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">How it works</h2>
                <p className="text-slate-400">Create smart templates from your documents in three simple steps.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Step 1 */}
                <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50">
                    <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mb-4">
                        <FaHighlighter className="text-3xl text-yellow-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Highlight Variables</h3>
                    <p className="text-slate-400 text-sm">
                        Open your Word Document and mark any text you want to change with Yellow Highlight.
                    </p>
                </div>

                {/* Step 2 */}
                <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50">
                    <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                        <FaCloudUploadAlt className="text-3xl text-blue-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Upload File</h3>
                    <p className="text-slate-400 text-sm">
                        Drag & drop your file here. We detect the highlights automatically.
                    </p>
                </div>

                {/* Step 3 */}
                <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50">
                    <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
                        <FaMagic className="text-3xl text-purple-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Fill & Create</h3>
                    <p className="text-slate-400 text-sm">
                        Enter your new data. We generate a clean, formatted document for you.
                    </p>
                </div>
            </div>
        </div>
    );
}
