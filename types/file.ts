export type FileWithPreview = {
    file: File;
    preview: string | null;
    progress: number;
    error?: string;
    success?: boolean
}