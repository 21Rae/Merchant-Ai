import React, { useState, useRef, useEffect } from 'react';
import { GeneratedProductContent } from '../types';
import { CopyIcon, CheckIcon, TagIcon, ImageIcon, LoaderIcon, SparklesIcon, DownloadIcon, RefreshIcon, PaletteIcon, UploadCloudIcon } from './Icons';

interface ResultCardProps {
  data: GeneratedProductContent;
  marketingImageUrl: string | null;
  isGeneratingImage: boolean;
  onGenerateImage: (editInstruction?: string) => void;
}

const CopyButton: React.FC<{ text: string; label?: string; className?: string }> = ({ text, label, className }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button 
      onClick={handleCopy}
      className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 sm:py-1.5 rounded-lg transition-all active:scale-95 touch-manipulation ${copied ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'} ${className}`}
    >
      {copied ? <CheckIcon className="w-3.5 h-3.5" /> : <CopyIcon className="w-3.5 h-3.5" />}
      {copied ? 'Copied' : (label || 'Copy')}
    </button>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode; action?: React.ReactNode }> = ({ title, children, action }) => (
  <div className="mb-4 sm:mb-6 p-4 sm:p-5 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-center mb-3">
      <h3 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider">{title}</h3>
      {action}
    </div>
    <div className="text-slate-800 leading-relaxed text-sm sm:text-base">
      {children}
    </div>
  </div>
);

const ResultCard: React.FC<ResultCardProps> = ({ data, marketingImageUrl, isGeneratingImage, onGenerateImage }) => {
  const [customPrice, setCustomPrice] = useState(data.suggestedPrice);
  const [editPrompt, setEditPrompt] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update local price if data changes
  useEffect(() => {
    setCustomPrice(data.suggestedPrice);
  }, [data.suggestedPrice]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setLogoUrl(url);
    }
  };

  const handleDownload = () => {
    if (!marketingImageUrl) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.crossOrigin = "anonymous";
    img.onload = async () => {
      // Set canvas size to match image
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw Main Image
      ctx?.drawImage(img, 0, 0);
      
      if (!ctx) return;

      const scaleFactor = img.width / 1000; // Base scaling on 1000px width

      // --- Draw Branding (Top Left) ---
      let brandingY = 40 * scaleFactor;
      const brandingX = 40 * scaleFactor;
      
      // Draw Logo if exists
      if (logoUrl) {
        const logoImg = new Image();
        logoImg.crossOrigin = "anonymous";
        logoImg.src = logoUrl;
        await new Promise((resolve) => { logoImg.onload = resolve; logoImg.onerror = resolve; });
        
        const logoSize = 120 * scaleFactor;
        const aspectRatio = logoImg.width / logoImg.height;
        let drawWidth = logoSize;
        let drawHeight = logoSize / aspectRatio;
        
        // Ensure square-ish logos don't get too tall
        if (drawHeight > logoSize) {
            drawHeight = logoSize;
            drawWidth = logoSize * aspectRatio;
        }

        // Add a slight drop shadow for visibility
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 10 * scaleFactor;
        
        ctx.drawImage(logoImg, brandingX, brandingY, drawWidth, drawHeight);
        
        brandingY += drawHeight + (20 * scaleFactor); // Move Y down for text
      }

      // Draw Business Name if exists
      if (businessName) {
        const fontSize = 40 * scaleFactor;
        ctx.font = `bold ${fontSize}px Inter, sans-serif`;
        
        // Text Shadow for readability on any background
        ctx.shadowColor = "rgba(0,0,0,0.8)";
        ctx.shadowBlur = 8 * scaleFactor;
        ctx.fillStyle = "white";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(businessName, brandingX, brandingY);
      }

      // --- Draw Price Tag (Bottom Right) ---
      const fontSize = Math.max(20, img.width * 0.05);
      const padding = fontSize * 0.6;
      const x = img.width * 0.95;
      const y = img.height * 0.95;
      
      ctx.font = `bold ${fontSize}px Inter, sans-serif`;
      const textMetrics = ctx.measureText(customPrice);
      const textWidth = textMetrics.width;
      
      // Draw Shadow/Bg for Price
      ctx.shadowColor = "rgba(0,0,0,0.3)";
      ctx.shadowBlur = 10;
      ctx.fillStyle = "white";
      
      // Use roundRect if available (modern browsers), else rect
      if (ctx.roundRect) {
        ctx.roundRect(x - textWidth - (padding * 2), y - fontSize - padding, textWidth + (padding * 2), fontSize + (padding * 1.5), 12);
      } else {
        ctx.fillRect(x - textWidth - (padding * 2), y - fontSize - padding, textWidth + (padding * 2), fontSize + (padding * 1.5));
      }
      ctx.fill();
      
      // Draw Price Text
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#4f46e5"; // Indigo-600
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.fillText(customPrice, x - padding, y);
      
      // Trigger Download
      const link = document.createElement('a');
      link.download = `merchant-ai-${data.productName.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = marketingImageUrl;
  };

  const handleEditGenerate = () => {
      onGenerateImage(editPrompt);
      setEditPrompt(""); // Clear after sending
  };

  return (
    <div className="animate-fade-in pb-12">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-2xl shadow-lg mb-6 text-white relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-xl sm:text-2xl font-bold mb-1 leading-tight">{data.productName}</h2>
          <p className="opacity-90 text-sm mb-4 line-clamp-1">{data.targetAudience}</p>
          <div className="inline-block bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
            <span className="text-xs uppercase tracking-wide opacity-80 block mb-0.5">Estimated Price</span>
            <span className="text-lg sm:text-xl font-bold text-white">{data.suggestedPrice}</span>
          </div>
        </div>
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
      </div>

      {/* Smart Image Editor Section */}
      <div className="mb-6 p-4 sm:p-5 bg-indigo-50 rounded-xl border border-indigo-100">
        <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs sm:text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                <ImageIcon className="w-4 h-4" /> Smart Image Editor
            </h3>
        </div>
        
        {!marketingImageUrl ? (
            <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg border border-dashed border-indigo-200">
                <p className="text-sm text-slate-600 mb-4 text-center">
                    Generate a high-quality, professional lifestyle shot of this product.
                </p>
                <button
                    onClick={() => onGenerateImage()}
                    disabled={isGeneratingImage}
                    className={`
                        px-4 py-2.5 rounded-lg font-semibold text-sm shadow-sm flex items-center gap-2 transition-all
                        ${isGeneratingImage 
                            ? 'bg-indigo-100 text-indigo-400 cursor-wait' 
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
                        }
                    `}
                >
                    {isGeneratingImage ? (
                        <>
                            <LoaderIcon className="w-4 h-4" /> Creating Magic...
                        </>
                    ) : (
                        <>
                            <SparklesIcon className="w-4 h-4" /> Generate AI Photo
                        </>
                    )}
                </button>
            </div>
        ) : (
            <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-sm space-y-4">
                {/* Image Canvas Area */}
                <div className="relative w-full aspect-square rounded-lg overflow-hidden group border border-slate-100 bg-slate-100">
                    <img 
                        src={marketingImageUrl} 
                        alt="AI Generated Marketing" 
                        className="w-full h-full object-cover"
                    />
                    
                    {/* Branding Overlay (Preview) */}
                    <div className="absolute top-4 left-4 flex flex-col items-start gap-2 max-w-[50%]">
                        {logoUrl && (
                            <img src={logoUrl} alt="Logo" className="w-16 h-16 sm:w-24 sm:h-24 object-contain drop-shadow-lg" />
                        )}
                        {businessName && (
                            <span className="text-white font-bold text-lg sm:text-xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] break-words leading-tight">
                                {businessName}
                            </span>
                        )}
                    </div>

                    {/* Editable Price Tag Overlay */}
                    <div className="absolute bottom-4 right-4 bg-white shadow-lg rounded-xl px-3 py-1.5 flex items-center gap-1 border border-slate-100 transform transition-transform hover:scale-105">
                        <span className="text-slate-400 text-xs font-semibold">₦</span>
                        <input 
                            type="text" 
                            value={customPrice.replace(/[^0-9.,]/g, '')}
                            onChange={(e) => setCustomPrice(`₦${e.target.value}`)}
                            className="w-20 text-indigo-600 font-bold text-lg bg-transparent border-none p-0 focus:ring-0 text-right"
                            aria-label="Edit Price"
                        />
                    </div>
                </div>

                {/* Personalization Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Business Name</label>
                        <input 
                            type="text" 
                            placeholder="Your Brand Name" 
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Logo</label>
                        <div className="flex gap-2">
                            <input 
                                type="file" 
                                accept="image/*"
                                ref={fileInputRef}
                                onChange={handleLogoUpload}
                                className="hidden"
                            />
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 flex items-center justify-center gap-2"
                            >
                                <UploadCloudIcon className="w-4 h-4" /> 
                                {logoUrl ? 'Change Logo' : 'Upload Logo'}
                            </button>
                            {logoUrl && (
                                <button 
                                    onClick={() => setLogoUrl(null)}
                                    className="px-3 py-2 text-sm border border-red-200 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="h-px bg-slate-100 my-2"></div>

                {/* Edit & Download Controls */}
                <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <PaletteIcon className="w-4 h-4" />
                            </div>
                            <input 
                                type="text" 
                                placeholder="Edit AI Image (e.g. 'Add a luxury background')" 
                                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                                value={editPrompt}
                                onChange={(e) => setEditPrompt(e.target.value)}
                            />
                        </div>
                        <button 
                            onClick={handleEditGenerate}
                            disabled={isGeneratingImage || !editPrompt.trim()}
                            className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                           {isGeneratingImage ? <LoaderIcon className="w-4 h-4"/> : <RefreshIcon className="w-4 h-4" />}
                           Update Photo
                        </button>
                    </div>

                    <button 
                        onClick={handleDownload}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 active:scale-95 transition-all shadow-indigo-200 shadow-lg"
                    >
                        <DownloadIcon className="w-4 h-4" /> Download Final Image
                    </button>
                </div>
            </div>
        )}
      </div>

      <Section 
        title="Social Media Caption" 
        action={<CopyButton text={data.socialMediaPost} label="Copy Post" />}
      >
        <div className="whitespace-pre-wrap font-medium text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm">
            {data.socialMediaPost}
        </div>
      </Section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Section 
            title="Short Description" 
            action={<CopyButton text={data.shortDescription} />}
        >
            <p className="text-sm">{data.shortDescription}</p>
        </Section>
        <Section 
            title="SEO Keywords" 
            action={<CopyButton text={data.seoKeywords.join(', ')} />}
        >
            <div className="flex flex-wrap gap-2">
            {data.seoKeywords.map((kw, i) => (
                <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md border border-blue-100">
                {kw}
                </span>
            ))}
            </div>
        </Section>
      </div>

      <Section 
        title="Long Description" 
        action={<CopyButton text={data.longDescription} />}
      >
        <p className="text-sm text-slate-600 whitespace-pre-wrap">{data.longDescription}</p>
      </Section>

      <Section 
        title="Hashtags" 
        action={<CopyButton text={data.hashtags.join(' ')} label="Copy All" />}
      >
        <div className="flex flex-wrap gap-2 text-indigo-600 font-medium text-sm">
          {data.hashtags.map((tag, i) => (
            <span key={i} className="hover:text-indigo-800 cursor-pointer">
              {tag.startsWith('#') ? tag : `#${tag}`}
            </span>
          ))}
        </div>
      </Section>
    </div>
  );
};

export default ResultCard;