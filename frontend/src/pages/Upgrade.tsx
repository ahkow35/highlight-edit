import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const UpgradePage: React.FC = () => {
    const { upgrade, user } = useAuth();
    const navigate = useNavigate();

    const handleUpgrade = async () => {
        try {
            await upgrade();
            alert("Upgrade successful! You can now save templates.");
            navigate('/');
        } catch (error) {
            console.error(error);
            alert("Upgrade failed to process.");
        }
    };

    if (user?.is_paid) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-green-600 mb-4">You are already a Pro!</h1>
                    <button onClick={() => navigate('/')} className="text-blue-600 underline">Return to Dashboard</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-xl w-full space-y-8 bg-white p-10 rounded-lg shadow-xl text-center">
                <h2 className="text-4xl font-extrabold text-gray-900">Upgrade to Pro</h2>
                <p className="text-lg text-gray-500">
                    Unlock unlimited Document Retention and Template Saving.
                </p>

                <div className="my-8 space-y-4">
                    <div className="flex items-center space-x-3 text-left p-4 bg-blue-50 rounded-lg">
                        <span className="text-2xl">💾</span>
                        <div>
                            <h3 className="font-bold">Save Unlimited Templates</h3>
                            <p className="text-sm text-gray-600">Never upload the same file twice. Save your templates and reuse them instantly.</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-100 p-6 rounded-lg">
                    <p className="text-2xl font-bold mb-2">$9.99 / month</p>
                    <p className="text-sm text-gray-500 mb-6">Cancel anytime</p>
                    <button
                        onClick={handleUpgrade}
                        className="w-full py-3 px-6 border border-transparent text-lg font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-lg transform transition hover:scale-105"
                    >
                        Upgrade Now (Mock)
                    </button>
                </div>

                <button onClick={() => navigate('/')} className="text-gray-500 hover:text-gray-700 text-sm">
                    No thanks, maybe later
                </button>
            </div>
        </div>
    );
};

export default UpgradePage;
