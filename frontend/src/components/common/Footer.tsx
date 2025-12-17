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
        <div className="text-sm mb-3">
          Address: 13 Elmore Road, Street 32, Balo-Walmen
        </div>
        <div className="text-sm mb-5">
          Phone: +01 2222 365 / +91 091 2345 6789
        </div>
        <div className="flex space-x-2">
          <a href="#" className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#007a85]">
            {/* Twitter */}
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="..." /></svg>
          </a>
          <a href="#" className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#007a85]">
            {/* Facebook */}
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="..." /></svg>
          </a>
          <a href="#" className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#007a85]">
            {/* Instagram */}
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="..." /></svg>
          </a>
        </div>
      </div>
      {/* Address/Links */}
      <div>
        <div className="mb-2 font-semibold">Address</div>
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
    <div className="text-center text-xs bg-[#005f69] py-3 border-t border-[#00474f]">
      Copyright &copy; 2025 take-care.com | All Rights Reserved
      <span className="mx-2">|</span>
      <a href="/privacy-policy" className="underline">Privacy Policy</a>
      <span className="mx-2">|</span>
      <a href="/terms" className="underline">Terms &amp; Conditions</a>
    </div>
  </footer>
);

export default Footer;

