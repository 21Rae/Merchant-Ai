import React, { useState, useCallback } from 'react';
import { AppState, GenerationStatus } from './types';
import { generateProductContent, generateLifestyleImage } from './services/geminiService';
import FileUpload from './components/FileUpload';
import ResultCard from './components/ResultCard';
import { SparklesIcon, TypeIcon, LoaderIcon } from './components/Icons';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    status: GenerationStatus.IDLE,
    data: null,
    error: null,
    selectedImage: null,
    imagePreviewUrl: null,
    textInput: "",
    isGeneratingImage: false,
    marketingImageUrl: null,
  });

  const handleFileSelect = useCallback((file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setState(prev => ({
      ...prev,
      selectedImage: file,
      imagePreviewUrl: previewUrl,
      error: null
    }));
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setState(prev => ({ ...prev, textInput: e.target.value }));
  };

  const handleGenerate = async () => {
    if (!state.selectedImage && !state.textInput.trim()) {
      setState(prev => ({ ...prev, error: "Please upload an image or enter a description first." }));
      return;
    }

    setState(prev => ({ 
      ...prev, 
      status: GenerationStatus.LOADING, 
      error: null, 
      marketingImageUrl: null, // Reset previous image
      isGeneratingImage: false 
    }));

    try {
      const result = await generateProductContent(state.selectedImage, state.textInput);
      setState(prev => ({
        ...prev,
        status: GenerationStatus.SUCCESS,
        data: result
      }));
      // Scroll to top on mobile when results load
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        status: GenerationStatus.ERROR,
        error: err.message || "Something went wrong. Please try again."
      }));
    }
  };

  const handleGenerateImage = async (editInstruction: string = "") => {
    if (!state.data) return;

    setState(prev => ({ ...prev, isGeneratingImage: true }));

    try {
      const imageUrl = await generateLifestyleImage(
        state.selectedImage, 
        state.data.productName,
        state.data.shortDescription,
        editInstruction
      );
      
      setState(prev => ({
        ...prev,
        isGeneratingImage: false,
        marketingImageUrl: imageUrl
      }));
    } catch (err: any) {
        alert("Could not generate image: " + err.message);
        setState(prev => ({ ...prev, isGeneratingImage: false }));
    }
  };

  const resetApp = () => {
    setState({
        status: GenerationStatus.IDLE,
        data: null,
        error: null,
        selectedImage: null,
        imagePreviewUrl: null,
        textInput: "",
        isGeneratingImage: false,
        marketingImageUrl: null,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      {/* Header */}
      <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 sm:py-4 flex justify-between items-center">
          <div 
            className="flex items-center gap-2 cursor-pointer group active:scale-95 transition-transform" 
            onClick={resetApp}
          >
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg group-hover:rotate-12 transition-transform">
              <SparklesIcon className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Merchant<span className="text-indigo-600">AI</span></h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-5xl px-4 py-4 md:py-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* LEFT COLUMN: Inputs */}
          <div className={`lg:col-span-5 flex flex-col gap-5 md:gap-6 ${state.status === GenerationStatus.SUCCESS ? 'hidden lg:flex' : ''}`}>
            
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                1. Product Image
              </h2>
              <p className="text-sm text-slate-500">Upload a clear photo of your item.</p>
              <FileUpload 
                onFileSelect={handleFileSelect} 
                selectedFile={state.selectedImage}
                previewUrl={state.imagePreviewUrl}
              />
            </div>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-slate-50 px-2 text-sm text-slate-400 font-medium">AND / OR</span>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                2. Details <span className="text-xs font-normal text-slate-400">(Optional if image provided)</span>
              </h2>
              <div className="relative group">
                <div className="absolute top-3 left-3 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                    <TypeIcon className="w-5 h-5" />
                </div>
                <textarea
                  className="w-full min-h-[120px] pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all resize-none text-slate-700 text-sm appearance-none"
                  placeholder="E.g. Men's traditional kaftan, embroidery detail, blue color. High quality fabric."
                  value={state.textInput}
                  onChange={handleTextChange}
                />
              </div>
            </div>

            {state.error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 flex items-start gap-2 animate-shake">
                <span className="shrink-0">⚠️</span> 
                <span>{state.error}</span>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={state.status === GenerationStatus.LOADING}
              className={`
                w-full py-4 rounded-xl font-bold text-white shadow-lg shadow-indigo-200
                flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] touch-manipulation
                ${state.status === GenerationStatus.LOADING 
                  ? 'bg-indigo-400 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-300'
                }
              `}
            >
              {state.status === GenerationStatus.LOADING ? (
                <>
                  <LoaderIcon className="w-5 h-5" /> Generating...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5" /> Generate Listing
                </>
              )}
            </button>
            <p className="text-center text-xs text-slate-400 lg:hidden">
                Prices will be estimated in ₦ based on Jumia rates.
            </p>
          </div>

          {/* RIGHT COLUMN: Results */}
          <div className="lg:col-span-7">
            {state.status === GenerationStatus.IDLE && (
              <div className="h-full hidden lg:flex flex-col items-center justify-center text-center p-8 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 min-h-[400px]">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <SparklesIcon className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-semibold text-slate-600">Ready to Create?</h3>
                <p className="text-sm max-w-xs mx-auto mt-2">Upload an image or type a description to instantly generate professional sales copy.</p>
              </div>
            )}

            {state.status === GenerationStatus.LOADING && (
              <div className="h-[50vh] lg:h-full flex flex-col items-center justify-center min-h-[300px] animate-pulse">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
                <h3 className="text-lg font-semibold text-slate-700">Analyzing your product...</h3>
                <p className="text-sm text-slate-500 mt-2">Checking Jumia prices & crafting copy.</p>
              </div>
            )}

            {state.status === GenerationStatus.SUCCESS && state.data && (
              <>
                <div className="lg:hidden mb-4 sticky top-[70px] z-40 bg-slate-50/95 backdrop-blur py-2">
                    <button 
                        onClick={resetApp}
                        className="w-full bg-white border border-slate-200 text-slate-700 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm active:bg-slate-50"
                    >
                        ← Create New Listing
                    </button>
                </div>
                <ResultCard 
                    data={state.data} 
                    marketingImageUrl={state.marketingImageUrl}
                    isGeneratingImage={state.isGeneratingImage}
                    onGenerateImage={handleGenerateImage}
                />
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 text-center text-slate-400 text-xs border-t border-slate-200 bg-white">
        <p>© {new Date().getFullYear()} MerchantAI. Built for Nigerian sellers.</p>
      </footer>
    </div>
  );
};

export default App;