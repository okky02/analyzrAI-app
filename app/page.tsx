import FileUploadContainer from "@/components/file-upload-container";

export default function Home() {
  const currentYear = new Date().getFullYear();

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-gray-900 to-purple-900/20"></div>
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent mb-4">
              Analyzr AI
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Unggah dokumen Anda dan dapatkan analisis dari AI
            </p>
          </div>

          {/* Main Content */}
          <FileUploadContainer />

          {/* Footer */}
          <footer className="mt-8">
            <div className="flex justify-between items-center gap-3">
              <div className="text-gray-300 text-sm">
                © 2025 Okky Dhelfilano
              </div>

              <div>
                <div className="inline-flex items-center gap-2 bg-blue-800/10 border border-blue-500 rounded-full px-3 py-1.5">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-blue-300 font-medium">
                    Powered by Gemini AI API
                  </span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
}
