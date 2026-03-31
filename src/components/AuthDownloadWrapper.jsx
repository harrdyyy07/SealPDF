import React from 'react';
import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import { LogIn } from 'lucide-react';

const AuthDownloadWrapper = ({ children, buttonClass = "action-btn", buttonStyle = {}, fallbackText = "Log in to Continue" }) => {
    return (
        <>
            <SignedIn>
                {children}
            </SignedIn>
            <SignedOut>
                <SignInButton mode="modal" afterSignInUrl={window.location.pathname} afterSignUpUrl={window.location.pathname}>
                    <button className={buttonClass} style={{ ...buttonStyle }}>
                        <LogIn size={20} className="mr-2" style={{ marginRight: '8px' }} />
                        {fallbackText}
                    </button>
                </SignInButton>
            </SignedOut>
        </>
    );
};

export default AuthDownloadWrapper;
