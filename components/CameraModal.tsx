
import React, { useRef, useEffect, useState } from 'react';
import { X, Camera, SwitchCamera, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface Props {
  onCapture: (imageData: string) => void;
  onClose: () => void;
  onGalleryClick: () => void;
}

export const CameraModal: React.FC<Props> = ({ onCapture, onClose, onGalleryClick }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let currentStream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        currentStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode }
        });
        setStream(currentStream);
        if (videoRef.current) {
          videoRef.current.srcObject = currentStream;
        }
        setError(null);
      } catch (err: any) {
        console.error("Camera access denied:", err);
        let msg = "Camera access unavailable.";
        
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            msg = "Camera permission denied. Please enable access in your browser settings.";
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            msg = "No camera found on this device.";
        } else if (err.name === 'NotReadableError') {
            msg = "Camera is currently in use by another application.";
        }
        
        setError(msg);
      }
    };

    startCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (ctx) {
        // Flip if using front camera for mirror effect
        if (facingMode === 'user') {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        onCapture(dataUrl);
        onClose();
    }
  };

  const handleSwitch = () => {
      setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col animate-in fade-in duration-300">
      
      {/* Viewfinder */}
      <div className="relative flex-1 overflow-hidden bg-black flex items-center justify-center">
        {error ? (
            <div className="text-white text-center p-8 max-w-sm flex flex-col items-center gap-4">
                <div className="p-4 bg-red-500/10 rounded-full border border-red-500/50 text-red-400">
                     <AlertCircle size={32} />
                </div>
                <h3 className="text-lg font-bold">Camera Error</h3>
                <p className="text-slate-400 text-sm">{error}</p>
                <div className="flex gap-3 mt-2 w-full">
                    <button 
                        onClick={onClose} 
                        className="flex-1 px-4 py-3 bg-slate-800 rounded-xl font-medium hover:bg-slate-700 transition-colors"
                    >
                        Close
                    </button>
                    <button 
                        onClick={() => { onClose(); onGalleryClick(); }}
                        className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2"
                    >
                        <ImageIcon size={16} /> Use Gallery
                    </button>
                </div>
            </div>
        ) : (
            <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className={`w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
            />
        )}
        
        {/* Header Controls */}
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start bg-gradient-to-b from-black/50 to-transparent pointer-events-none">
             <button onClick={onClose} className="p-3 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-white/10 transition-colors pointer-events-auto">
                 <X size={24} />
             </button>
        </div>
      </div>

      {/* Footer Controls (Only show if no error) */}
      {!error && (
        <div className="h-32 bg-black/80 backdrop-blur-xl flex items-center justify-around pb-6 pt-2 px-6">
          
          {/* Gallery Button */}
          <button 
            onClick={() => { onClose(); onGalleryClick(); }}
            className="p-4 rounded-full bg-slate-800/50 text-white hover:bg-slate-700 transition-colors"
          >
              <ImageIcon size={24} />
          </button>

          {/* Shutter Button */}
          <button 
            onClick={handleCapture}
            className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center group active:scale-95 transition-transform"
          >
              <div className="w-16 h-16 bg-white rounded-full group-hover:scale-90 transition-transform"></div>
          </button>

          {/* Flip Button */}
          <button 
            onClick={handleSwitch}
            className="p-4 rounded-full bg-slate-800/50 text-white hover:bg-slate-700 transition-colors"
          >
              <SwitchCamera size={24} />
          </button>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
