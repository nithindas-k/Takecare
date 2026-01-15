import { useState, useEffect, useCallback, useRef } from 'react';
import { appointmentService } from '../services/appointmentService';
import { toast } from 'sonner';

interface Note {
    id: string;
    title: string;
    description?: string;
    category?: 'observation' | 'diagnosis' | 'medicine' | 'lab_test';
    dosage?: string;
    frequency?: string;
    duration?: string;
    createdAt: string;
}

export const useAutoSaveNotes = (appointmentId: string | undefined) => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const notesRef = useRef<Note[]>([]);
    const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

    // Update ref when notes change
    useEffect(() => {
        notesRef.current = notes;
    }, [notes]);

    const saveNotes = useCallback(async () => {
        if (!appointmentId || notesRef.current.length === 0) return;

        setIsSaving(true);
        try {
            // Save all notes to the server
            for (const note of notesRef.current) {
                await appointmentService.updateDoctorNotes(appointmentId, note);
            }

            setLastSaved(new Date());
            setHasUnsavedChanges(false);
            console.log('Notes auto-saved successfully');
        } catch (error) {
            console.error('Auto-save failed:', error);
            // Don't show error toast for auto-save failures to avoid annoying user
        } finally {
            setIsSaving(false);
        }
    }, [appointmentId]);

    const addNote = useCallback((note: Note) => {
        setNotes(prev => [...prev, note]);
        setHasUnsavedChanges(true);
    }, []);

    const updateNote = useCallback((noteId: string, updates: Partial<Note>) => {
        setNotes(prev => prev.map(note =>
            note.id === noteId ? { ...note, ...updates } : note
        ));
        setHasUnsavedChanges(true);
    }, []);

    const deleteNote = useCallback((noteId: string) => {
        setNotes(prev => prev.filter(note => note.id !== noteId));
        setHasUnsavedChanges(true);
    }, []);

    // Auto-save every 10 seconds if there are unsaved changes
    useEffect(() => {
        if (!hasUnsavedChanges || notes.length === 0) return;

        // Clear existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Set new timeout for 10 seconds
        saveTimeoutRef.current = setTimeout(() => {
            saveNotes();
        }, 10000);

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [hasUnsavedChanges, notes.length, saveNotes]);

    // Save on unmount if there are unsaved changes
    useEffect(() => {
        return () => {
            if (hasUnsavedChanges && notesRef.current.length > 0) {
                // Force immediate save on unmount
                saveNotes();
            }
        };
    }, [hasUnsavedChanges, saveNotes]);

    // Manual save function
    const forceSave = useCallback(async () => {
        await saveNotes();
        toast.success('Notes saved successfully');
    }, [saveNotes]);

    const formatLastSaved = useCallback(() => {
        if (!lastSaved) return 'Not saved';

        const now = new Date();
        const diffMs = now.getTime() - lastSaved.getTime();
        const diffSeconds = Math.floor(diffMs / 1000);

        if (diffSeconds < 60) return 'Just now';
        if (diffSeconds < 120) return '1 minute ago';
        if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} minutes ago`;

        return lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }, [lastSaved]);

    return {
        notes,
        isSaving,
        lastSaved,
        hasUnsavedChanges,
        addNote,
        updateNote,
        deleteNote,
        forceSave,
        formatLastSaved,
    };
};
