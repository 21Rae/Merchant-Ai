export interface GeneratedProductContent {
  productName: string;
  shortDescription: string;
  longDescription: string;
  suggestedPrice: string;
  seoKeywords: string[];
  hashtags: string[];
  socialMediaPost: string;
  targetAudience: string;
}

export enum GenerationStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface AppState {
  status: GenerationStatus;
  data: GeneratedProductContent | null;
  error: string | null;
  selectedImage: File | null;
  imagePreviewUrl: string | null;
  textInput: string;
  // New properties for Image Generation
  isGeneratingImage: boolean;
  marketingImageUrl: string | null;
}