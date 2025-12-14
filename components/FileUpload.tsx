import React, { useRef, useState } from 'react';
import { UploadCloudIcon, ImageIcon, CheckIcon } from './Icons';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  previewUrl: string | null;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, selectedFile, previewUrl }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onFileSelect(file);
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div 
      className={`relative w-full transition-all duration-300 ease-in-out cursor-pointer group`}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />

      {previewUrl ? (
        <div 
          onClick={handleClick}
          className="relative w-full aspect-video md:aspect-square bg-slate-100 rounded-2xl overflow-hidden border-2 border-slate-200 group-hover:border-indigo-500 transition-colors shadow-sm"
        >
          <img 
            src={previewUrl} 
            alt="Preview" 
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-white font-medium flex items-center gap-2">
              <UploadCloudIcon /> Change Photo
            </span>
          </div>
          <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full shadow-lg">
            <CheckIcon className="w-4 h-4" />
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          className={`
            w-full aspect-video md:aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center p-6 transition-all duration-300
            ${isDragging 
              ? 'border-indigo-500 bg-indigo-50 scale-[1.02]' 
              : 'border-slate-300 bg-white hover:border-indigo-400 hover:bg-slate-50'
            }
          `}
        >
          <div className={`p-4 rounded-full mb-3 ${isDragging ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}>
            <UploadCloudIcon className="w-8 h-8" />
          </div>
          <p className="text-sm font-semibold text-slate-700 mb-1">
            Click to upload or drag & drop
          </p>
          <p className="text-xs text-slate-500">
            SVG, PNG, JPG (max 800x800 recommended)
          </p>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
