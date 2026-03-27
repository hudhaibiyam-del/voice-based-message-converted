/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Mic, 
  Square, 
  Upload, 
  FileAudio, 
  Loader2, 
  Copy, 
  Check, 
  Trash2, 
  Play, 
  Pause,
  Volume2,
  Languages,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface TranscriptionResult {
  text: string;
  language?: string;
  summary?: string;
}

export default function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<TranscriptionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      setError(null);
    } catch (err) {
      setError("Microphone access denied or not available.");
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        setError("Please upload an audio file.");
        return;
      }
      const url = URL.createObjectURL(file);
      setAudioBlob(file);
      setAudioUrl(url);
      setError(null);
      setResult(null);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const convertToText = async () => {
    if (!audioBlob) return;

    setIsProcessing(true);
    setError(null);

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(',')[1];
          resolve(base64String);
        };
      });
      reader.readAsDataURL(audioBlob);
      const base64Data = await base64Promise;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              { text: "Transcribe this audio message accurately. Also detect the language and provide a 1-sentence summary at the end in a JSON format with keys 'text', 'language', and 'summary'." },
              { inlineData: { mimeType: audioBlob.type || 'audio/webm', data: base64Data } }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const data = JSON.parse(response.text || '{}');
      setResult(data);
    } catch (err) {
      setError("Failed to process audio. Please try again.");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
    if (result?.text) {
      navigator.clipboard.writeText(result.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const reset = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setResult(null);
    setError(null);
    setRecordingTime(0);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#1A1A1A] font-sans p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Volume2 className="w-8 h-8 text-blue-600" />
              VoxConvert
            </h1>
            <p className="text-muted-foreground mt-1">Voice to text, powered by Gemini AI</p>
          </div>
          <div className="hidden md:block">
            <span className="text-xs font-mono uppercase tracking-widest opacity-50">v1.0.0 / PRO</span>
          </div>
        </header>

        <main className="space-y-6">
          {/* Main Control Card */}
          <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Mic className="w-32 h-32" />
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center space-y-8">
              {!audioBlob ? (
                <>
                  <div className="flex flex-col items-center space-y-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`w-24 h-24 rounded-full flex items-center justify-center transition-colors shadow-lg ${
                        isRecording 
                          ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {isRecording ? <Square className="w-8 h-8" /> : <Mic className="w-10 h-10" />}
                    </motion.button>
                    
                    <div className="text-center">
                      <p className="text-lg font-medium">
                        {isRecording ? "Recording..." : "Tap to Record"}
                      </p>
                      {isRecording && (
                        <p className="text-red-500 font-mono text-xl mt-1">
                          {formatTime(recordingTime)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="w-full flex items-center gap-4">
                    <div className="h-px bg-gray-100 flex-1" />
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">OR</span>
                    <div className="h-px bg-gray-100 flex-1" />
                  </div>

                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:bg-gray-50 transition-colors group">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 text-gray-400 group-hover:text-blue-600 transition-colors mb-2" />
                      <p className="text-sm text-gray-500">Upload audio file (MP3, WAV, M4A)</p>
                    </div>
                    <input type="file" className="hidden" accept="audio/*" onChange={handleFileUpload} />
                  </label>
                </>
              ) : (
                <div className="w-full space-y-6">
                  <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                        <FileAudio className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Audio Message</p>
                        <p className="text-xs text-gray-500">Ready for conversion</p>
                      </div>
                    </div>
                    <button 
                      onClick={reset}
                      className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  {audioUrl && (
                    <div className="bg-gray-50 rounded-2xl p-4">
                      <audio ref={audioRef} src={audioUrl} controls className="w-full h-10" />
                    </div>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={convertToText}
                    disabled={isProcessing}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing with Gemini...
                      </>
                    ) : (
                      <>
                        <Languages className="w-5 h-5" />
                        Convert to Text
                      </>
                    )}
                  </motion.button>
                </div>
              )}
            </div>
          </section>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-sm"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results Section */}
          <AnimatePresence>
            {result && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <h2 className="text-lg font-semibold tracking-tight">Transcription</h2>
                      {result.language && (
                        <span className="text-[10px] uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded-full font-bold text-gray-500">
                          {result.language}
                        </span>
                      )}
                    </div>
                    <button 
                      onClick={copyToClipboard}
                      className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? "Copied!" : "Copy Text"}
                    </button>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-6 min-h-[120px]">
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {result.text}
                    </p>
                  </div>

                  {result.summary && (
                    <div className="pt-4 border-t border-gray-100">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Summary</h3>
                      <p className="text-sm text-gray-600 italic">
                        "{result.summary}"
                      </p>
                    </div>
                  )}
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="mt-12 text-center">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">
            Secure & Private • AI Processing
          </p>
        </footer>
      </div>
    </div>
  );
}
