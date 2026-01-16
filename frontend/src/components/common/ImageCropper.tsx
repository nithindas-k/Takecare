import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "../../utils/cropImage";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { ZoomIn, ZoomOut, Move } from "lucide-react";

interface ImageCropperProps {
    image: string;
    onCropComplete: (croppedImage: Blob) => void;
    onCancel: () => void;
    aspect?: number;
}

const ImageCropper: React.FC<ImageCropperProps> = ({
    image,
    onCropComplete,
    onCancel,
    aspect = 3 / 4,
}) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

    const onCropChange = (crop: { x: number; y: number }) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom: number) => {
        setZoom(zoom);
    };

    const onCropAreaComplete = useCallback((_: any, clippedAreaPixels: any) => {
        setCroppedAreaPixels(clippedAreaPixels);
    }, []);

    const handleCrop = async () => {
        try {
            const croppedImage = await getCroppedImg(image, croppedAreaPixels);
            if (croppedImage) {
                onCropComplete(croppedImage);
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white border-none shadow-2xl rounded-3xl">
                <DialogHeader className="px-6 py-4 bg-white border-b border-gray-50">
                    <DialogTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        Adjust Profile Photo
                    </DialogTitle>
                    <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                        <Move size={10} /> Drag to position and use slider to zoom
                    </p>
                </DialogHeader>

                <div className="relative w-full h-[380px] bg-[#f8fafc]">
                    <Cropper
                        image={image}
                        crop={crop}
                        zoom={zoom}
                        aspect={aspect}
                        onCropChange={onCropChange}
                        onZoomChange={onZoomChange}
                        onCropComplete={onCropAreaComplete}
                        classes={{
                            containerClassName: "rounded-none",
                            cropAreaClassName: "border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]"
                        }}
                    />
                </div>

                <div className="p-6 bg-white">
                    <div className="flex flex-col gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#00A1B0] bg-[#00A1B0]/5 px-2 py-1 rounded">
                                    3:4 Professional Aspect
                                </span>
                                <span className="text-[10px] font-bold text-gray-400">
                                    {Math.round(zoom * 100)}% Scale
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                <ZoomOut size={16} className="text-gray-300" />
                                <input
                                    type="range"
                                    value={zoom}
                                    min={1}
                                    max={3}
                                    step={0.05}
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="flex-1 h-1 bg-gray-100 rounded-full appearance-none cursor-pointer accent-[#00A1B0]"
                                />
                                <ZoomIn size={16} className="text-gray-300" />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-2">
                            <Button
                                variant="ghost"
                                onClick={onCancel}
                                className="flex-1 h-11 text-gray-500 hover:text-gray-800 hover:bg-gray-50 font-medium rounded-xl"
                            >
                                Discard
                            </Button>
                            <Button
                                onClick={handleCrop}
                                className="flex-[1.5] h-11 bg-[#00A1B0] hover:bg-[#008f9c] text-white font-bold rounded-xl shadow-lg shadow-[#00A1B0]/15 transition-all active:scale-[0.98]"
                            >
                                Apply Changes
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ImageCropper;
