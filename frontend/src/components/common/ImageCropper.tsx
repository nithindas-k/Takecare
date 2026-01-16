import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "../../utils/cropImage";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { FaUpload } from "react-icons/fa";

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
    aspect = 4 / 3,
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
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-white border-none shadow-2xl">
                <DialogHeader className="p-6 bg-gray-50/50 border-b">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <FaUpload size={16} />
                        </div>
                        <DialogTitle className="text-xl font-bold text-gray-800">Crop Profile Photo</DialogTitle>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Adjust your photo to fit the 4:3 area. This will be visible to your patients.</p>
                </DialogHeader>
                <div className="relative w-full h-[380px] bg-slate-900 shadow-inner">
                    <Cropper
                        image={image}
                        crop={crop}
                        zoom={zoom}
                        aspect={aspect}
                        onCropChange={onCropChange}
                        onZoomChange={onZoomChange}
                        onCropComplete={onCropAreaComplete}
                    />
                </div>
                <div className="p-6 bg-white border-t">
                    <div className="flex flex-col gap-6">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    Zoom Level <span className="text-xs font-normal text-gray-400">({zoom.toFixed(1)}x)</span>
                                </span>
                                <span className="text-[10px] uppercase tracking-wider font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">Fixed 4:3 Ratio</span>
                            </div>
                            <input
                                type="range"
                                value={zoom}
                                min={1}
                                max={3}
                                step={0.1}
                                aria-labelledby="Zoom"
                                onChange={(e) => setZoom(Number(e.target.value))}
                                className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                        </div>
                        <DialogFooter className="flex gap-3 sm:gap-3 items-center">
                            <Button
                                variant="ghost"
                                onClick={onCancel}
                                className="flex-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 font-medium"
                            >
                                Discard
                            </Button>
                            <Button
                                onClick={handleCrop}
                                className="flex-[2] bg-primary text-white hover:bg-[#008f9c] shadow-lg shadow-primary/20 font-bold py-6 rounded-xl transition-all active:scale-[0.98]"
                            >
                                Save Cropped Photo
                            </Button>
                        </DialogFooter>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ImageCropper;
