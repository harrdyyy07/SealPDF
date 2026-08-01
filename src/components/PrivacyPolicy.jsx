import React from 'react';
import LegalPage from './LegalPage';

const PrivacyPolicy = ({ onBack }) => {
    const content = (
        <>
            <p><strong>Last Updated:</strong> August 1, 2026</p>
            
            <h2>1. Introduction</h2>
            <p>Welcome to SealPDF ("we," "our," or "us"). We are deeply committed to respecting and protecting the privacy of our visitors and users. This Privacy Policy outlines how we handle data, files, and personal information across our website and browser-based utility services accessible at <a href="https://seal-pdf.com/">seal-pdf.com</a>.</p>

            <h2>2. Local Client-Side Processing & File Security</h2>
            <p>SealPDF is built with a <strong>privacy-first architecture</strong>. Unlike standard cloud-based document converters that upload your confidential files to external servers, most of SealPDF's core features (including PDF merging, splitting, watermarking, page rotation, and numbering) execute entirely inside your local web browser using JavaScript and WebAssembly.</p>
            <ul>
                <li><strong>No Permanent Storage:</strong> Your PDF files, images, and documents are never permanently saved or stored on our servers.</li>
                <li><strong>Browser Execution:</strong> Local tasks never transmit your file contents to any server.</li>
                <li><strong>Temporary Server Tasks:</strong> For select tools requiring server processing, uploaded files are processed over 256-bit SSL encrypted channels and automatically deleted immediately after completion.</li>
            </ul>

            <h2>3. Information We Collect</h2>
            <p>We collect minimal information necessary to deliver, protect, and optimize our services:</p>
            <ul>
                <li><strong>Non-Personal & Technical Data:</strong> Browser type, operating system, language preferences, referring site, date and time of visits, and page view metrics to optimize system reliability.</li>
                <li><strong>Cookies & Local Storage:</strong> Small text files stored on your device to remember user settings (such as dark mode preferences) and enable web application functionality.</li>
            </ul>

            <h2>4. Third-Party Advertising & Google AdSense Disclosures</h2>
            <p>SealPDF utilizes Google AdSense and third-party advertising companies to serve advertisements when you visit our website. These companies may use information about your visits to this and other websites in order to provide advertisements about goods and services of interest to you.</p>
            <ul>
                <li><strong>Google AdSense & DoubleClick DART Cookie:</strong> Google, as a third-party vendor, uses cookies to serve ads on SealPDF. Google's use of the DART cookie enables it to serve ads to users based on their visit to SealPDF and other sites on the Internet.</li>
                <li><strong>Opting Out of Personalization:</strong> Users may opt out of personalized advertising by visiting <a href="https://adssettings.google.com/" target="_blank" rel="noopener noreferrer">Google Ad Settings</a> or by visiting <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer">AboutAds.info</a>.</li>
                <li><strong>Third-Party Vendors:</strong> Other third-party ad networks or ad servers may also use cookies, web beacons, or JavaScript to measure the effectiveness of their advertisements and personalize ad content. SealPDF has no access to or control over cookies used by third-party advertisers.</li>
            </ul>

            <h2>5. Web Analytics & Tracking Technologies</h2>
            <p>We use web analytics services such as Google Analytics and Microsoft Clarity to understand aggregated user behavior, troubleshoot page rendering performance, and enhance site navigation. These services record anonymous interaction metrics (such as clicks, scrolls, and navigation paths) without processing personal user identities or document text.</p>

            <h2>6. GDPR & CCPA Compliance Privacy Rights</h2>
            <p>Under the General Data Protection Regulation (GDPR) and California Consumer Privacy Act (CCPA), users possess specific rights regarding their personal data:</p>
            <ul>
                <li><strong>Right to Know & Access:</strong> You have the right to request what data we collect. Because SealPDF does not require accounts or store personal user records, we store minimal identifying data.</li>
                <li><strong>Right to Deletion:</strong> You have the right to request the deletion of any collected personal data.</li>
                <li><strong>Right to Non-Discrimination:</strong> We do not discriminate against users exercising their privacy rights.</li>
            </ul>

            <h2>7. Security Practices</h2>
            <p>We implement industry-standard encryption protocols (HTTPS with TLS 1.3) to protect data in transit. Although no Internet transmission is 100% immune, our zero-file-retention policy and browser-based sandboxing ensure your files remain secure.</p>

            <h2>8. Contact Information</h2>
            <p>If you have questions, concerns, or requests regarding this Privacy Policy or our security practices, please contact us at:</p>
            <p><strong>Email:</strong> <a href="mailto:support@sealpdf.com">support@sealpdf.com</a><br />
            <strong>Website:</strong> <a href="https://seal-pdf.com/contact">https://seal-pdf.com/contact</a></p>
        </>
    );

    return <LegalPage title="Privacy Policy" content={content} onBack={onBack} />;
};

export default PrivacyPolicy;

