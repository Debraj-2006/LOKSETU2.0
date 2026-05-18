import { useCallback, useState, useRef } from 'react';
import { Upload, X, Image, Camera, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PhotoUpload({ onFileChange }) {
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setPreview(URL.createObjectURL(file));
    onFileChange(file);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, []);

  const clearPhoto = (e) => {
    if (e) e.stopPropagation();
    setPreview(null);
    onFileChange(null);
  };

  const startCamera = async () => {
    setCameraLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      setCameraActive(true);
      
      // Wait a microtask to make sure videoRef is mounted
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 50);
    } catch (err) {
      console.error('Camera access error:', err);
      toast.error('Unable to access camera. Please check permissions or upload a file.');
    } finally {
      setCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      
      // Convert Data URL to file object
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `camera_capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
      
      setPreview(dataUrl);
      onFileChange(file);
      stopCamera();
    } catch (err) {
      console.error('Failed to capture picture:', err);
      toast.error('Failed to capture photo. Please try again.');
    }
  };

  return (
    <div className="relative w-full">
      {cameraActive ? (
        <div className="glass rounded-3xl p-4 flex flex-col items-center gap-4 border border-white/10 overflow-hidden">
          <div className="relative w-full h-64 rounded-2xl overflow-hidden bg-black border border-white/10">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />
            <div className="absolute top-3 left-3 bg-red-500/90 text-white text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white block" /> Live Stream
            </div>
          </div>
          
          <div className="w-full flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={stopCamera}
              className="btn-secondary py-2.5 px-4 text-xs font-semibold rounded-xl text-white/70 hover:text-white flex-1"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={capturePhoto}
              className="btn-primary py-2.5 px-5 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 flex-1"
            >
              <Camera size={14} /> Capture Photo
            </button>
          </div>
        </div>
      ) : preview ? (
        <div className="relative border border-white/10 rounded-3xl overflow-hidden bg-white/5 p-2">
          <img src={preview} alt="Complaint Preview" className="w-full h-56 object-cover rounded-2xl" />
          <button
            type="button"
            onClick={clearPhoto}
            className="absolute top-4 right-4 bg-dark-800/90 hover:bg-red-500 border border-white/10 hover:border-transparent p-2 rounded-full text-white/70 hover:text-white transition-all duration-200 shadow-xl"
          >
            <X size={15} />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`relative border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center transition-all duration-300 ${
            dragging ? 'border-primary-400 bg-primary-500/10 scale-[0.99]' : 'border-white/20 hover:border-white/30 hover:bg-white/5'
          }`}
        >
          <input
            type="file"
            accept="image/*"
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
            onChange={(e) => handleFile(e.target.files[0])}
          />

          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
            <Image size={28} className="text-white/30" />
          </div>
          
          <div className="mb-4">
            <p className="text-white/70 text-sm font-semibold">
              Drop photo here or <span className="text-primary-400 hover:underline">browse files</span>
            </p>
            <p className="text-white/30 text-xs mt-1">PNG, JPG up to 5 MB</p>
          </div>

          <div className="w-full border-t border-white/10 my-4 pt-4 flex flex-col items-center z-20">
            <button
              type="button"
              disabled={cameraLoading}
              onClick={startCamera}
              className="btn-secondary py-2 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 hover:bg-white/10 hover:border-white/20 transition-all shadow-md"
            >
              {cameraLoading ? (
                <RefreshCw size={13} className="animate-spin text-white/50" />
              ) : (
                <Camera size={13} className="text-primary-400" />
              )}
              {cameraLoading ? 'Initializing Camera...' : 'Take Live Photo'}
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-white/20 text-[10px] uppercase font-bold tracking-wider">
            <Upload size={11} /> Drag &amp; drop to upload
          </div>
        </div>
      )}
    </div>
  );
}
