import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Loader2 } from "lucide-react";

interface ReconnectingAlertProps {
    attempts: number;
    maxAttempts: number;
}

export const ReconnectingAlert: React.FC<ReconnectingAlertProps> = ({ attempts, maxAttempts }) => {
    return (
        <Alert className="absolute top-20 left-1/2 -translate-x-1/2 z-50 w-auto max-w-md bg-amber-500/95 text-white border-amber-600 backdrop-blur-sm shadow-2xl">
            <Loader2 className="h-4 w-4 animate-spin text-white" />
            <AlertTitle className="text-white font-bold">Poor Connection</AlertTitle>
            <AlertDescription className="text-white/90">
                Reconnecting... Attempt {attempts}/{maxAttempts}
                <div className="mt-2 w-full bg-white/20 rounded-full h-1.5">
                    <div
                        className="bg-white h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${(attempts / maxAttempts) * 100}%` }}
                    />
                </div>
            </AlertDescription>
        </Alert>
    );
};
