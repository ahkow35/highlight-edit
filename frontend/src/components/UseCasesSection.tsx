const USE_CASES = [
    {
        title: 'Offer Letters',
        description: 'Personalise salary, role, start date, and manager name per candidate. Generate a clean PDF in seconds.',
        tags: ['HR', 'Recruitment'],
        fields: ['Candidate Name', 'Job Title', 'Salary', 'Start Date'],
    },
    {
        title: 'Employment Contracts',
        description: 'Swap in employee details, probation periods, and reporting lines — without touching the legal boilerplate.',
        tags: ['HR', 'Legal'],
        fields: ['Employee Name', 'Department', 'Probation Period', 'Signing Date'],
    },
    {
        title: 'NDAs & Agreements',
        description: 'Update counterparty names, effective dates, and jurisdiction per deal. Send professionally every time.',
        tags: ['Legal'],
        fields: ['Party Name', 'Effective Date', 'Jurisdiction', 'Governing Law'],
    },
    {
        title: 'Service Proposals',
        description: 'Customise client name, scope, pricing, and delivery timeline on your master proposal template.',
        tags: ['Sales', 'Operations'],
        fields: ['Client Name', 'Project Scope', 'Total Value', 'Delivery Date'],
    },
    {
        title: 'Vendor Onboarding',
        description: 'Fill supplier details, payment terms, and contact info into your standard onboarding pack.',
        tags: ['Operations', 'Finance'],
        fields: ['Vendor Name', 'Payment Terms', 'Account Number', 'Contact Email'],
    },
    {
        title: 'Lease Agreements',
        description: 'Enter tenant, unit, rental amount, and lease term. Get a ready-to-sign document immediately.',
        tags: ['Legal', 'Finance'],
        fields: ['Tenant Name', 'Unit Number', 'Monthly Rent', 'Lease End Date'],
    },
];

const TAG_COLORS: Record<string, string> = {
    HR: 'bg-blue-50 text-blue-700',
    Legal: 'bg-purple-50 text-purple-700',
    Sales: 'bg-green-50 text-green-700',
    Operations: 'bg-orange-50 text-orange-700',
    Finance: 'bg-amber-50 text-amber-700',
    Recruitment: 'bg-sky-50 text-sky-700',
};

export default function UseCasesSection() {
    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-0 py-10 border-t border-[#E4E4E7]">
            {/* Header */}
            <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-[#09090B] tracking-tight mb-1.5">
                    What teams use HighlightEdit for
                </h2>
                <p className="text-sm text-[#71717A] max-w-sm mx-auto">
                    Any Word document with yellow-highlighted fields becomes a reusable smart form.
                </p>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {USE_CASES.map((uc) => (
                    <div
                        key={uc.title}
                        className="bg-white border border-[#E4E4E7] rounded-xl p-4 hover:border-[#CA8A04] transition-colors group"
                    >
                        {/* Title + tags */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="text-sm font-semibold text-[#09090B] tracking-tight group-hover:text-[#CA8A04] transition-colors">
                                {uc.title}
                            </h3>
                            <div className="flex flex-wrap gap-1 flex-shrink-0">
                                {uc.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${TAG_COLORS[tag] ?? 'bg-[#F4F4F5] text-[#71717A]'}`}
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-[#71717A] leading-relaxed mb-3">
                            {uc.description}
                        </p>

                        {/* Field pills */}
                        <div className="flex flex-wrap gap-1.5">
                            {uc.fields.map((field) => (
                                <span
                                    key={field}
                                    className="text-xs px-2 py-0.5 bg-[#FFFDF0] text-[#CA8A04] rounded font-medium border border-[#FFE033]/30"
                                >
                                    {field}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <p className="text-center text-xs text-[#71717A] mt-6">
                If it's in Word with yellow highlights, it works.
            </p>
        </div>
    );
}
