import React from 'react';
import { useNavigate } from 'react-router-dom';

const AuthMobileNavbar: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="md:hidden flex items-center h-14 px-4 bg-white border-b border-gray-100 sticky top-0 z-50">
            <div
                className="ml-3 flex items-baseline cursor-pointer"
                onClick={() => navigate('/')}
            >
                <span className="text-lg font-bold text-[#0f172a]">Take</span>
                <span className="text-lg font-bold text-[#00A1B0]">Care</span>
            </div>
        </div>
    );
};

export default AuthMobileNavbar;
