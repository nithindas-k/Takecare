import React from "react";

const Footer: React.FC = () => (
    <footer className="w-full bg-[#007a85] text-white mt-12">
        <div className="max-w-7xl mx-auto py-10 px-4 grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Brand & socials */}
            <div>
                <div className="flex items-center mb-2">
                    <img src="/logo-takecare.png" alt="TakeCare Logo" className="h-7 w-auto mr-2" />
                    <span className="text-xl font-extrabold tracking-wide">Takecare</span>
                </div>
                <div className="text-sm mb-3 text-white/90">
                    Your Trusted Online Healthcare Partner
                </div>
                <div className="text-sm mb-3">
                    📧 Email: support@takecare.com
                </div>
                <div className="text-sm mb-3">
                    📞 Phone: +91 9876543210 (24/7 Support)
                </div>
                <div className="flex space-x-2">
                    <a href="#" className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#007a85] hover:bg-white/90 transition">
                        {/* Twitter */}
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.84 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                        </svg>
                    </a>
                    <a href="#" className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#007a85] hover:bg-white/90 transition">
                        {/* Facebook */}
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                    </a>
                    <a href="#" className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#007a85] hover:bg-white/90 transition">
                        {/* Instagram */}
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.85-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.622 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4.162 4.162 0 110-8.324 4.162 4.162 0 010 8.324zM18.406 3.99a1.44 1.44 0 100 2.88 1.44 1.44 0 000-2.88z" />
                        </svg>
                    </a>
                </div>
            </div>
            {/* Quick Links */}
            <div>
                <div className="mb-2 font-semibold">Quick Links</div>
                <ul className="space-y-1 text-sm">
                    <li><a href="/about" className="hover:underline">About Us</a></li>
                    <li><a href="/delivery" className="hover:underline">Delivery Information</a></li>
                    <li><a href="/privacy-policy" className="hover:underline">Privacy Policy</a></li>
                    <li><a href="/terms" className="hover:underline">Terms &amp; Conditions</a></li>
                    <li><a href="/contact" className="hover:underline">Contact Us</a></li>
                    <li><a href="/support" className="hover:underline">Support Center</a></li>
                </ul>
            </div>
            {/* My Account & Payment */}
            <div>
                <div className="mb-2 font-semibold">My Account</div>
                <ul className="space-y-1 text-sm mb-4">
                    <li><a href="/signin" className="hover:underline">Sign In</a></li>
                    <li><a href="/cart" className="hover:underline">View Cart</a></li>
                    <li><a href="/wishlist" className="hover:underline">My Wishlist</a></li>
                    <li><a href="/order" className="hover:underline">Track My Order</a></li>
                    <li><a href="/help" className="hover:underline">Help</a></li>
                </ul>
                <div className="mb-1 font-semibold">Secured Payed Gateways</div>
                <div className="flex items-center space-x-2">
                    {/* Card icons can use images or SVGs */}
                    <img src="/visa.png" alt="Visa" className="h-5" />
                    <img src="/mastercard.png" alt="Mastercard" className="h-5" />
                    <img src="/paypal.png" alt="PayPal" className="h-5" />
                </div>
            </div>
        </div>
        <div className="text-center text-xs bg-[#007a85] py-3 border-t border-white/10 text-white/80">
            Copyright &copy; 2025 take-care.com | All Rights Reserved
            <span className="mx-2">|</span>
            <a href="/privacy-policy" className="underline">Privacy Policy</a>
            <span className="mx-2">|</span>
            <a href="/terms" className="underline">Terms &amp; Conditions</a>
        </div>
    </footer>
);

export default Footer;
