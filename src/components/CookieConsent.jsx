import React, { useState, useEffect } from 'react';

const CookieConsent = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('cookie-consent');
        if (!consent) {
            setIsVisible(true);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookie-consent', 'true');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="cookie-banner">
            <div className="cookie-content">
                <p>
                    We use cookies to enhance your experience and analyze our traffic. By clicking "Accept", you consent to our use of cookies.
                    Learn more in our Privacy Policy.
                </p>
                <button className="accept-btn" onClick={handleAccept}>Accept</button>
            </div>
        </div>
    );
};

export default CookieConsent;
