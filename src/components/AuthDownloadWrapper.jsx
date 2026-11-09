import React from 'react';
import { SignedIn, SignedOut } from '@clerk/clerk-react';

const AuthDownloadWrapper = ({ children }) => {
    // Render the action button directly for both signed-in and signed-out users
    // This guarantees users can seamlessly process and download documents without being blocked
    return (
        <div style={{ width: '100%' }}>
            {children}
        </div>
    );
};

export default AuthDownloadWrapper;
