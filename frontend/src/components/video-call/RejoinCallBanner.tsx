
import { Button } from "../ui/button";
import { Video } from "lucide-react";

interface RejoinCallBannerProps {
    onRejoin: () => void;
    expiresIn: number; // minutes
    isLoading?: boolean;
}

export const RejoinCallBanner: React.FC<RejoinCallBannerProps> = ({
    onRejoin,
    expiresIn,
    isLoading = false
}) => {
    return (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 rounded-lg border border-emerald-500/30 bg-[#1C1F24] p-4 shadow-sm md:p-6">
            <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                    <Video className="h-5 w-5" />
                </div>
                <div>
                    <h3 className="text-base font-semibold text-white">Session Active</h3>
                    <p className="text-sm text-slate-400">
                        You were disconnected. Rejoin within <span className="font-medium text-white">{expiresIn}</span> min.
                    </p>
                </div>
            </div>

            <Button
                onClick={onRejoin}
                disabled={isLoading}
                className="w-full h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-medium text-sm transition-colors md:w-auto"
            >
                {isLoading ? (
                    <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Rejoining...
                    </>
                ) : (
                    "Rejoin Call"
                )}
            </Button>
        </div>
    );
};
