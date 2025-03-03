"use client"

import { useState } from "react";
import axios from "axios";
import 'dotenv/config';

interface TTSResponse {
  file_url: string;
}

const Home = () => {
  const [text, setText] = useState<string>("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleConvert = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post<TTSResponse>(
        `/api/tts`,
        { text },
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      setAudioUrl(response.data.file_url);
    } catch (error) {
      console.error("Error converting text to speech:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-purple-900 flex items-center justify-center">
      <div className="max-w-4xl w-full mx-auto p-8">
        <h1 className="text-5xl font-bold text-center text-white mb-8 tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
            Cloud Text-to-Speech App
          </span>
        </h1>
        <div className="backdrop-blur-lg bg-gray-800/50 rounded-2xl shadow-2xl p-8 border border-gray-700/50">
          <div className="space-y-6">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text to convert to speech..."
              className="w-full h-48 p-5 bg-gray-700/50 text-white border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none placeholder-gray-400 text-lg transition-all duration-200 hover:bg-gray-700/70"
            />
            <button
              onClick={handleConvert}
              disabled={isLoading || !text.trim()}
              className={`w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-xl text-lg font-semibold
                ${isLoading ? 'opacity-75 cursor-not-allowed' : 'hover:from-purple-700 hover:to-pink-700'} 
                transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800`}
            >
              {isLoading ? 'Converting...' : 'Convert to Speech'}
            </button>
          </div>

          {audioUrl && (
            <div className="mt-10 animate-fade-in">
              <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
                <span className="mr-2">🎧</span> Your Audio is Ready:
              </h2>
              <div className="bg-gray-700/50 p-6 rounded-xl backdrop-blur-sm">
                <audio
                  controls
                  src={audioUrl}
                  className="w-full custom-audio-player"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
