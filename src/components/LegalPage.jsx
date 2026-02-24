import React from 'react';
import { ArrowLeft } from 'lucide-react';

const LegalPage = ({ title, content, onBack }) => {
    return (
        <div className="legal-page-container">
            <button onClick={onBack} className="back-btn">
                <ArrowLeft size={18} />
                Back to Tools
            </button>
            <div className="legal-content">
                <h1>{title}</h1>
                <div className="legal-text">
                    {content}
                </div>
            </div>
        </div>
    );
};

export default LegalPage;
