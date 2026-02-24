import React from 'react';
import LegalPage from './LegalPage';

const PrivacyPolicy = ({ onBack }) => {
    const content = (
        <>
            <p>Last Updated: {new Date().toLocaleDateString()}</p>
            <h2>1. Introduction</h2>
            <p>Welcome to SealPDF. We value your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you use our PDF tools.</p>

            <h2>2. Information We Collect</h2>
            <p><strong>Personal Data:</strong> We do not require users to create an account or provide personal information such as names or email addresses to use our basic tools.</p>
            <p><strong>File Data:</strong> Any files you upload to SealPDF are processed entirely in your browser or on our temporary secure servers. We do not store your files permanently. Files are automatically deleted after processing or after a short period of inactivity.</p>

            <h2>3. How We Use Your Information</h2>
            <p>We use the data we collect to:</p>
            <ul>
                <li>Provide and maintain our PDF tools.</li>
                <li>Improve our website's functionality and user experience.</li>
                <li>Monitor the usage of our service.</li>
            </ul>

            <h2>4. Cookies and Tracking Technologies</h2>
            <p>We use cookies to enhance your experience and analyze website traffic. We also use third-party services like Google AdSense, which may use cookies to serve ads based on your previous visits to our website or other websites.</p>

            <h2>5. Google AdSense</h2>
            <p>Google, as a third-party vendor, uses cookies to serve ads on our site. Google's use of advertising cookies enables it and its partners to serve ads to our users based on their visit to our site and/or other sites on the Internet.</p>

            <h2>6. Security</h2>
            <p>The security of your data is important to us, but remember that no method of transmission over the Internet is 100% secure. While we strive to use commercially acceptable means to protect your files, we cannot guarantee their absolute security.</p>

            <h2>7. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at support@sealpdf.com.</p>
        </>
    );

    return <LegalPage title="Privacy Policy" content={content} onBack={onBack} />;
};

export default PrivacyPolicy;
