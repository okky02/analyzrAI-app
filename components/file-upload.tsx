"use client";

import { FileWithPreview } from "@/types/file";
import { useDropzone } from "react-dropzone";
import {
    FileIcon,
    Loader2Icon,
    Upload,
    X,
    Sparkles,
    Bot,
    MessageCircleQuestionMark,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

import { cn } from "@/lib/utils";
import { Textarea } from "./ui/textarea";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "./ui/card";
import { toast } from "sonner";
import { useCallback, useState } from "react";
import { Button } from "./ui/button";
import { getAiResult } from "@/actions/getAiResult";

interface FileUploadProps {
    value?: FileWithPreview[];
    onChange?: (files: FileWithPreview[]) => void;
    onRemove?: (file: FileWithPreview) => void;
    maxFiles?: number;
    maxSize?: number;
    accept?: {
        [key: string]: string[];
    };
    disabled?: boolean;
    className?: string;
}

const FileUpload = ({
    value = [],
    onChange,
    onRemove,
    maxFiles = 1,
    maxSize = 20,
    accept = {
        "image/*": [".jpg", ".jpeg", ".png", ".webp", ".bmp", ".gif"],
        "application/pdf": [".pdf"],
    },
    disabled = false,
    className,
}: FileUploadProps) => {
    const [files, setFiles] = useState<FileWithPreview[]>(value);
    const [isLoading, setIsloading] = useState<boolean>(false);
    const [prompt, setPrompt] = useState<string>("");
    const [aiResult, setAiResult] = useState<string>("");

    const createFilePreview = (file: File): Promise<string | null> => {
        return new Promise((resolve) => {
            if (file.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onload = () => {
                    resolve(reader.result as string);
                };
                reader.readAsDataURL(file);
            } else {
                resolve(null);
            }
        });
    };

    const simulateUpload = (fileWithPreview: FileWithPreview) => {
        let progress = 0;
        const interval = setInterval(() => {
            progress += 5;

            setFiles((prevFiles) =>
                prevFiles.map((f) =>
                    f.file === fileWithPreview.file
                        ? { ...f, progress: Math.min(progress, 100) }
                        : f
                )
            );
            if (progress >= 100) {
                clearInterval(interval);
                setFiles((prevFiles) =>
                    prevFiles.map((f) =>
                        f.file === fileWithPreview.file ? { ...f, success: true } : f
                    )
                );
            }
        }, 100);
    };

    const onDrop = useCallback(
        async (acceptedFiles: File[]) => {
            const newFiles: FileWithPreview[] = [];

            for (const file of acceptedFiles) {
                if (files.length + newFiles.length >= maxFiles) {
                    toast.error("Batas file maksimum tercapai", {
                        description: `Anda hanya dapat mengupload ${maxFiles} file`,
                    });
                    break;
                }

                const preview = await createFilePreview(file);

                const fileWithPreview: FileWithPreview = {
                    file,
                    preview,
                    progress: 0,
                };

                newFiles.push(fileWithPreview);
                simulateUpload(fileWithPreview);

                toast.success("File berhasil diupload", {
                    description: `${file.name} telah ditambahkan`,
                });
            }

            const updatedFiles = [...files, ...newFiles];
            setFiles(updatedFiles);
            onChange?.(updatedFiles);
        },
        [files, maxFiles, onChange]
    );

    const {
        getRootProps,
        getInputProps,
        isDragActive,
        isDragReject,
        fileRejections,
    } = useDropzone({
        onDrop,
        accept,
        maxSize: maxSize * 1024 * 1024,
        multiple: true,
        disabled: disabled || files.length >= maxFiles,
    });

    const handleRemove = useCallback(
        (fileToRemove: FileWithPreview) => {
            const updatedFiles = files.filter((f) => f.file !== fileToRemove.file);
            setFiles(updatedFiles);
            onChange?.(updatedFiles);
            onRemove?.(fileToRemove);
        },
        [files, onChange, onRemove]
    );

    const onSubmit = async () => {
        if (!files.length) {
            toast.error("Tidak ada file yang diupload", {
                description: "Silakan upload file sebelum mengirim",
            });
            return;
        }

        if (!prompt.trim()) {
            toast.error("Tidak ada pertanyaan yang dimasukkan", {
                description: "Silakan masukkan pertanyaan atau permintaan Anda",
            });
            return;
        }

        try {
            setIsloading(true);
            const result = await getAiResult(prompt, files[0].file);

            if (!result) {
                toast.error("Tidak ada respons dari AI", {
                    description: "Silakan coba lagi dengan pertanyaan yang berbeda",
                });
                setIsloading(false);
                return;
            }

            setAiResult(result);
            toast.success("Analisis selesai", {
                description: "AI telah memproses dokumen Anda",
            });
        } catch (error: unknown) {
            toast.error("Analisis gagal", {
                description:
                    error instanceof Error ? error.message : "Terjadi kesalahan",
            });
        } finally {
            setIsloading(false);
        }
    };

    const handleClose = () => {
        setPrompt("");
        setAiResult("");
        setFiles([]);
        toast.info("Sesi dibersihkan", {
            description: "Siap untuk analisis baru",
        });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* Panel Kiri - Input */}
            <div className="space-y-6">
                {/* Section Pertanyaan */}
                <Card className="shadow-2xl border border-gray-700 bg-gray-900/90 backdrop-blur-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-lg text-white">
                            <MessageCircleQuestionMark className="size-6 text-blue-400" />
                            Your Question
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                            Tanyakan apapun tentang dokumen yang diupload
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            placeholder="Apa yang ingin Anda ketahui tentang dokumen ini?"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="min-h-[120px] resize-none border-2 border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:border-blue-400 transition-colors"
                            disabled={isLoading}
                        />
                    </CardContent>
                </Card>

                {/* Section Upload File */}
                <Card className="shadow-2xl border border-gray-700 bg-gray-900/90 backdrop-blur-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-lg text-white">
                            <Upload className="size-6 text-green-400" />
                            Document Upload
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                            Format yang didukung:
                            <br></br>
                            Gambar (JPG, PNG, WebP, dll.) & File PDF
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div
                            {...getRootProps()}
                            className={cn(
                                "group relative flex flex-col items-center justify-center w-full h-32 p-4 border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer",
                                isDragActive
                                    ? "border-blue-400 bg-blue-500/20 scale-[1.02]"
                                    : "border-gray-600 bg-gray-800/80 hover:border-blue-400 hover:bg-blue-500/10",
                                isDragReject && "border-red-400 bg-red-500/20",
                                disabled && "cursor-not-allowed opacity-50 grayscale"
                            )}
                        >
                            <input {...getInputProps()} />
                            <div className="flex flex-col items-center justify-center text-center space-y-3">
                                <div
                                    className={cn(
                                        "p-3 rounded-full transition-colors",
                                        isDragActive
                                            ? "bg-blue-500/20"
                                            : "bg-gray-700 group-hover:bg-blue-500/20"
                                    )}
                                >
                                    <Upload
                                        className={cn(
                                            "size-6 transition-colors",
                                            isDragActive
                                                ? "text-blue-400"
                                                : "text-gray-400 group-hover:text-blue-400"
                                        )}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-medium text-gray-200">
                                        {isDragActive
                                            ? "Drop file Anda di sini"
                                            : "Drag & drop file di sini"}
                                    </p>
                                    <p className="text-sm text-gray-400">
                                        atau klik untuk memilih file • Maks {maxSize}MB
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* File yang Ditolak */}
                        {fileRejections.length > 0 && (
                            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                                <p className="text-red-400 font-medium text-sm mb-2">
                                    Upload gagal:
                                </p>
                                {fileRejections.map(({ file, errors }, index) => (
                                    <div key={index} className="text-red-300 text-sm">
                                        <p className="font-semibold">• {file.name}</p>
                                        {errors.map((e, i) => (
                                            <p key={i} className="ml-2 text-red-400">
                                                {e.message}
                                            </p>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* File yang Diupload */}
                        {files.length > 0 && (
                            <div className="space-y-3">
                                <p className="text-sm font-medium text-gray-300">
                                    File yang diupload:
                                </p>
                                {files.map((file, index) => (
                                    <div
                                        key={`${file.file.name}-${index}`}
                                        className="flex items-center p-3 bg-gray-800 border border-gray-700 rounded-lg hover:shadow-lg transition-shadow"
                                    >
                                        <div className="flex items-center flex-1 min-w-0 gap-3">
                                            {file.preview ? (
                                                <div className="relative size-12 overflow-hidden rounded-lg border border-gray-600">
                                                    <img
                                                        src={file.preview}
                                                        alt={file.file.name}
                                                        className="object-cover w-full h-full"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center size-12 bg-blue-500/20 rounded-lg border border-blue-500/30">
                                                    <FileIcon className="size-6 text-blue-400" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-white truncate">
                                                    {file.file.name}
                                                </p>
                                                <p className="text-sm text-gray-400">
                                                    {(file.file.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                                {file.progress < 100 && (
                                                    <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                                                        <div
                                                            className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                                                            style={{ width: `${file.progress}%` }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-8 hover:bg-red-500/20 hover:text-red-400 transition-colors text-gray-400"
                                            onClick={() => handleRemove(file)}
                                            disabled={disabled || file.progress < 100}
                                        >
                                            <X className="size-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-3 pt-4">
                        <div className="flex justify-between items-center w-full">
                            <div className="text-sm text-gray-400">
                                {files.length}/{maxFiles} file terupload
                            </div>
                            <Button
                                onClick={onSubmit}
                                disabled={
                                    isLoading ||
                                    !files.length ||
                                    !prompt.trim() ||
                                    files.some((f) => f.progress < 100)
                                }
                                className={cn(
                                    "px-6 transition-all font-medium text-base",
                                    isLoading
                                        ? "bg-blue-500/50 cursor-not-allowed"
                                        : "bg-blue-700 hover:bg-blue-600 text-white cursor-pointer"
                                )}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2Icon className="size-4 animate-spin mr-2" />
                                        Memproses...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="size-4 mr-1" />
                                        Analisis
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            </div>

            {/* Panel Kanan - Hasil */}
            <div className="space-y-6">
                <Card className="shadow-2xl border border-gray-700 bg-gray-900/90 backdrop-blur-sm h-full flex flex-col">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-lg text-white">
                            <Bot className="size-6 text-purple-400" />
                            AI Analysis Results
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                            Insight & Ringkasan dari dokumen Anda
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                        {aiResult ? (
                            <div className="h-full flex flex-col">
                                <div className="flex-1 text-white prose prose-sm max-w-none bg-gray-800 rounded-lg p-4 border border-gray-600 overflow-y-auto max-h-[580px]">
                                    <ReactMarkdown>{aiResult}</ReactMarkdown>
                                </div>
                                <div className="mt-4">
                                    <Button
                                        onClick={handleClose}
                                        variant="outline"
                                        className="w-full bg-gray-800 hover:bg-gray-200 border-gray-600 text-gray-300 hover:text-gray-800 transition-colors cursor-pointer"
                                    >
                                        Mulai Analisis Baru
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-gray-600 rounded-lg bg-gray-800/50">
                                <div className="bg-purple-500/20 p-3 rounded-full mb-4">
                                    <Sparkles className="size-8 text-purple-400" />
                                </div>
                                <h3 className="font-medium text-white mb-2">No Analysis Yet</h3>
                                <p className="text-gray-400 text-sm max-w-sm">
                                    Unggah dokumen dan ajukan pertanyaan untuk memperoleh analisis
                                    dan ringkasan dari AI.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default FileUpload;
