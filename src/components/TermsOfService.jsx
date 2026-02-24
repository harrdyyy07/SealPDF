import React from 'react';
import LegalPage from './LegalPage';

const TermsOfService = ({ onBack }) => {
    const content = (
        <>
            <p>Last Updated: {new Date().toLocaleDateString()}</p>
            <h2>1. Acceptance of Terms</h2>
            <p>By accessing or using SealPDF, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.</p>

            <h2>2. Use of Service</h2>
            <p>SealPDF provides various PDF manipulation tools. You are responsible for any files you upload and process using our service. You must not use our service for any illegal or unauthorized purpose.</p>

            <h2>3. User Responsibilities</h2>
            <p>You agree not to upload files that contain:</p>
            <ul>
                <li>Malware, viruses, or any harmful code.</li>
                <li>Copyrighted material that you do not have the right to use.</li>
                <li>Highly sensitive or illegal content.</li>
            </ul>

            <h2>4. Limitation of Liability</h2>
            <p>SealPDF is provided "as is" without any warranties. We are not liable for any damages arising from your use of the service, including data loss or service interruptions.</p>

            <h2>5. Modification of Terms</h2>
            <p>We reserve the right to modify these terms at any time. Your continued use of the service after any changes indicates your acceptance of the new terms.</p>

            <h2>6. Contact Us</h2>
            <p>If you have questions regarding these terms, please contact us at support@sealpdf.com.</p>
        </>
    );

    return <LegalPage title="Terms of Service" content={content} onBack={onBack} />;
};

export default TermsOfService;
