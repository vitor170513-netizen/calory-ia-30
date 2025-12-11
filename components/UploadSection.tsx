
import React, { useCallback, useState, useRef, useEffect } from 'react';
import { Button } from './Button';
import { TipItem } from './TipItem';
import { LanguageCode } from '../types';
import { getText } from '../utils/i18n';

interface UploadSectionProps {
  onImageSelected: (file: File) => void;
  isLoading: boolean;
  lang?: LanguageCode;
}

export const UploadSection: React.FC<UploadSectionProps> = ({ onImageSelected, isLoading, lang = 'pt' as LanguageCode }) => {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Camera State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const text = getText(lang);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleFile = useCallback((file: File) => {
    setValidationError(null); // Clear previous errors

    // 1. Type Validation
    if (!file || !file.type.startsWith('image/')) {
        setValidationError(text.upload.errorType || "Invalid format. Please use JPG or PNG.");
        setPreview(null);
        setSelectedFile(null);
        return;
    }

    // 2. Size Validation (Max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > MAX_SIZE) {
        setValidationError(text.upload.errorSize || "Image is too large. Max 5MB.");
        setPreview(null);
        setSelectedFile(null);
        return;
    }

    // Success
    const url = URL.createObjectURL(file);
    setPreview(url);
    setSelectedFile(file);
  }, [text]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleAnalyzeClick = () => {
    if (selectedFile) {
      onImageSelected(selectedFile);
    }
  };

  const handleClear = () => {
    setPreview(null);
    setSelectedFile(null);
    setValidationError(null);
    stopCamera();
  };

  // --- CAMERA FUNCTIONS ---

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
      setValidationError(null);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setValidationError("Erro ao acessar a câmera. Verifique as permissões.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Flip horizontally if using front camera (optional, usually feels more natural)
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(blob => {
          if (blob) {
            const file = new File([blob], "camera_photo.jpg", { type: "image/jpeg" });
            handleFile(file);
            stopCamera();
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 pb-20 animate-fade-in-up">
      {/* Main Glass Card */}
      <div className="glass-panel rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row gap-12 transition-all duration-500">
        
        {/* Decorative Glow */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 opacity-80"></div>

        <div className="flex-1 z-10">
            <h2 className="text-4xl font-black mb-3 text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 transition-colors">
                {text.upload.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg leading-relaxed font-light transition-colors">{text.upload.subtitle}</p>
            
            {/* SECURITY BADGES (NEW) */}
            <div className="flex flex-wrap gap-3 mb-8">
               <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-lg border border-green-100 dark:border-green-800">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  <span className="text-xs font-bold text-green-800 dark:text-green-300 uppercase">{text.upload.privacyBadge}</span>
               </div>
               <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-800">
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
                  <span className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase">Salvo na Nuvem</span>
               </div>
            </div>

            {/* Validation Error Banner */}
            {validationError && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-r-xl flex items-center gap-3 animate-pulse">
                    <div className="text-red-500 bg-red-100 dark:bg-red-900/50 p-1.5 rounded-full">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <span className="text-red-700 dark:text-red-300 font-bold text-sm">{validationError}</span>
                </div>
            )}

            {/* Upload Zone - Futuristic Glass Look */}
            <div 
              className={`relative group rounded-3xl transition-all duration-500 overflow-hidden ${
                  dragActive 
                  ? 'bg-pink-50 dark:bg-pink-900/20 border-2 border-pink-500 scale-[1.02] shadow-2xl shadow-pink-500/10' 
                  : validationError
                      ? 'bg-red-50 dark:bg-red-900/10 border-2 border-red-300 dark:border-red-800'
                      : 'bg-white/60 dark:bg-gray-800/40 border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-pink-500/50 hover:bg-white/80 dark:hover:bg-gray-800/60 hover:shadow-xl'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
                {/* CAMERA FEED OVERLAY */}
                {isCameraActive ? (
                  <div className="relative w-full h-[400px] bg-black flex flex-col items-center justify-center">
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      className="absolute inset-0 w-full h-full object-cover transform -scale-x-100" 
                    />
                    <div className="absolute bottom-6 flex gap-4 z-20">
                      <Button onClick={stopCamera} variant="secondary" className="bg-white/20 backdrop-blur border-white/30 text-white hover:bg-white/30">
                        {text.upload.cancelCamera}
                      </Button>
                      <button 
                        onClick={capturePhoto}
                        className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center bg-transparent hover:bg-white/20 transition-all active:scale-95"
                      >
                        <div className="w-12 h-12 bg-white rounded-full"></div>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {!preview && (
                        <input 
                            type="file" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
                            onChange={handleChange}
                            accept="image/jpeg,image/png,image/webp"
                            disabled={isLoading}
                            aria-label="Upload your body image"
                        />
                    )}
                    
                    {/* Background Pulse for Interaction */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                    
                    {preview ? (
                        <div className="relative z-10 animate-fade-in group-hover:scale-[1.01] transition-transform duration-500 p-10">
                            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-0"></div>
                            <img src={preview} alt="Preview" className="relative z-10 max-h-[400px] w-auto mx-auto rounded-xl shadow-2xl border-4 border-white/20" />
                            <button 
                                onClick={handleClear}
                                className="absolute top-4 right-4 z-20 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full backdrop-blur-md transition-all"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 px-4 text-center relative z-10">
                            <div className="w-20 h-20 bg-pink-50 dark:bg-pink-900/30 rounded-full flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-300">
                                <svg className="w-10 h-10 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <p className="font-bold text-gray-800 dark:text-gray-200 text-lg mb-2">{text.upload.drag}</p>
                            <p className="text-gray-400 text-sm mb-6 max-w-xs">JPG ou PNG (Max 5MB)</p>
                            <div className="flex gap-3">
                                <Button variant="secondary" className="pointer-events-none relative z-0">{text.upload.takePhoto}</Button>
                                <button 
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); startCamera(); }}
                                  className="px-6 py-3 rounded-[1.2rem] font-bold transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 text-sm tracking-wide bg-pink-600 text-white hover:bg-pink-700 shadow-lg relative z-30"
                                >
                                  📷 {text.upload.useCamera}
                                </button>
                            </div>
                        </div>
                    )}
                  </>
                )}
            </div>
            
            <div className="mt-8 flex justify-center">
                 <Button 
                    onClick={handleAnalyzeClick} 
                    disabled={!selectedFile || isLoading} 
                    isLoading={isLoading}
                    className="w-full md:w-auto px-12 py-4 text-lg bg-gradient-to-r from-pink-600 to-purple-600 shadow-xl shadow-pink-500/30"
                 >
                    {isLoading ? text.upload.analyzing : text.upload.analyze}
                 </Button>
            </div>
        </div>

        {/* Tips Sidebar */}
        <div className="md:w-72 bg-white/40 dark:bg-gray-800/40 rounded-[2rem] p-8 border border-white/50 dark:border-gray-700 flex flex-col gap-6 backdrop-blur-md">
            <h3 className="font-black text-[#2D1B4E] dark:text-white uppercase tracking-wider text-sm border-b border-gray-200 dark:border-gray-600 pb-3">
                {text.upload.tips}
            </h3>
            <ul className="space-y-4">
                <TipItem text={text.upload.tip1} />
                <TipItem text={text.upload.tip2} />
                <TipItem text={text.upload.tip3} />
            </ul>
            
            {/* Privacy Note */}
            <div className="mt-auto bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
               <div className="text-blue-500 mb-2">🛡️</div>
               <p className="text-[10px] text-blue-800 dark:text-blue-200 leading-relaxed font-medium">
                  {text.upload.privacyText}
               </p>
            </div>
        </div>
      </div>
    </div>
  );
};
