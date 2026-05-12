import { ChangeEvent, FormEvent, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, MapPin, Loader2, Check, Wand2 } from 'lucide-react';
import { WasteType } from '../types';
import { cn } from '../lib/utils';
import { GoogleGenAI } from '@google/genai';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { wasteType: WasteType; description: string; imageUrl: string; lat: number; lng: number }) => Promise<void>;
  currentCoords: { lat: number; lng: number; accuracy?: number | null } | null;
}

const WASTE_TYPES: WasteType[] = ['Plastic', 'Organic', 'Electronic', 'Metal', 'Other'];

export default function ReportModal({ isOpen, onClose, onSubmit, currentCoords }: ReportModalProps) {
  const [wasteType, setWasteType] = useState<WasteType>('Plastic');
  const [description, setDescription] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analyzeImage = async () => {
    if (!imagePreview) return;
    setIsAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const base64Data = imagePreview.split(',')[1];
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            { text: "Identify the type of waste in this image. Choose ONLY one from this list: Plastic, Organic, Electronic, Metal, Other. Return ONLY the category name. Also provide a brief 1-sentence description of the hazard." },
            { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
          ]
        }
      });

      const text = response.text || "";
      const lines = text.split('\n');
      const category = lines[0].trim();
      const desc = lines.slice(1).join(' ').trim() || text;

      if (WASTE_TYPES.includes(category as WasteType)) {
        setWasteType(category as WasteType);
      }
      if (desc) setDescription(desc);
    } catch (error) {
      console.error("AI Analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentCoords || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        wasteType,
        description,
        imageUrl: imagePreview || '',
        lat: currentCoords.lat,
        lng: currentCoords.lng,
      });
      // Reset and close
      setWasteType('Plastic');
      setDescription('');
      setImagePreview(null);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden overflow-y-auto max-h-[90vh]"
      >
        <div className="p-6 border-b border-stone-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-serif font-bold text-stone-900">New Spot Report</h2>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-stone-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Photo Section */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-stone-700 uppercase tracking-wider">Witness Photo</label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "w-full h-48 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden",
                imagePreview ? "border-stone-200" : "border-stone-300 hover:border-orange-500 hover:bg-orange-50/50"
              )}
            >
              {imagePreview ? (
                <img src={imagePreview || undefined} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <>
                  <Camera className="w-10 h-10 text-stone-400 mb-2" />
                  <p className="text-sm text-stone-500">Tap to capture or upload photo</p>
                  <p className="text-[10px] text-stone-400 mt-1 uppercase">Max size: 500KB recommended</p>
                </>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageChange}
            />
            {imagePreview && (
              <button
                type="button"
                onClick={analyzeImage}
                disabled={isAnalyzing}
                className="mt-2 w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Analyzing Waste...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3 h-3" />
                    Categorize with AI
                  </>
                )}
              </button>
            )}
          </div>

          {/* Waste Type Selection */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-stone-700 uppercase tracking-wider">Waste Category</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {WASTE_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setWasteType(type)}
                  className={cn(
                    "px-4 py-3 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2",
                    wasteType === type 
                      ? "bg-orange-600 border-orange-600 text-white shadow-md shadow-orange-200" 
                      : "bg-white border-stone-200 text-stone-600 hover:border-stone-400"
                  )}
                >
                  {wasteType === type && <Check className="w-4 h-4" />}
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-stone-700 uppercase tracking-wider">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us what you see..."
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none h-24"
            />
          </div>

          {/* Location Info */}
          <div className="p-4 bg-stone-50 rounded-2xl flex items-center gap-4 relative">
            <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center text-stone-500">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-widest leading-none flex items-center gap-2">
                GPS Coordinates
                {currentCoords?.accuracy && (
                  <span className={cn(
                    "px-1.5 py-0.5 rounded text-[8px] uppercase tracking-tighter",
                    currentCoords.accuracy < 15 ? "bg-green-100 text-green-700" :
                    currentCoords.accuracy < 50 ? "bg-orange-100 text-orange-700" :
                    "bg-red-100 text-red-700"
                  )}>
                    ±{Math.round(currentCoords.accuracy)}m
                  </span>
                )}
              </p>
              <p className="text-sm font-mono text-stone-700 mt-1">
                {currentCoords ? `${currentCoords.lat.toFixed(6)}, ${currentCoords.lng.toFixed(6)}` : 'Detecting location...'}
              </p>
            </div>
            {!currentCoords && <Loader2 className="w-4 h-4 text-orange-600 animate-spin" />}
            {currentCoords?.accuracy && currentCoords.accuracy > 50 && (
              <div className="absolute bottom-full mb-2 left-0 right-0 px-4 py-2 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-[10px] font-bold text-red-600">
                <AlertCircle className="w-3.5 h-3.5" />
                Low accuracy. Try moving to an open area for better GPS lock.
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !currentCoords}
            className={cn(
              "w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3",
              isSubmitting || !currentCoords 
                ? "bg-stone-200 text-stone-400 cursor-not-allowed" 
                : "bg-orange-600 text-white hover:bg-orange-700 shadow-xl shadow-orange-200"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Sending Report...
              </>
            ) : (
              'Submit Report'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
