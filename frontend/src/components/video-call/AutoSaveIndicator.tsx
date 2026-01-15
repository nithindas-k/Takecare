import { Cloud, CloudOff, Loader2 } from "lucide-react";

interface AutoSaveIndicatorProps {
    isSaving: boolean;
    lastSavedText: string;
    hasUnsavedChanges: boolean;
}

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
    isSaving,
    lastSavedText,
    hasUnsavedChanges
}) => {
    return (
        <div className="flex items-center gap-2 text-xs">
            {isSaving ? (
                <>
                    <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                    <span className="text-blue-600 font-medium">Saving...</span>
                </>
            ) : hasUnsavedChanges ? (
                <>
                    <CloudOff className="h-3 w-3 text-amber-500" />
                    <span className="text-amber-600 font-medium">Unsaved changes</span>
                </>
            ) : (
                <>
                    <Cloud className="h-3 w-3 text-green-500" />
                    <span className="text-gray-600">Saved {lastSavedText}</span>
                </>
            )}
        </div>
    );
};
