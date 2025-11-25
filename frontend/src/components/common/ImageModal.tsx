import React from "react";

interface ImageModalProps {
  isOpen: boolean;
  src: string | null;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ isOpen, src, onClose }) => {
  if (!isOpen || !src) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-[90vw] max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 bg-white/90 rounded-full px-3 py-1 text-black font-bold hover:bg-white"
        >
          ✕
        </button>

        <img
          src={src}
          alt="Preview"
          className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-xl bg-white"
        />
      </div>
    </div>
  );
};

export default ImageModal;
