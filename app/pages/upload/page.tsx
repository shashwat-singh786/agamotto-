"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, Save } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import VideoPlayer from "@/components/video-player"
import TimestampList from "@/components/timestamp-list"
import type { Timestamp } from "@/app/types"
import Link from "next/link"

interface VideoEvent {
  isDangerous: boolean;
  timestamp: string;
  description: string;
}

async function analyzeFrame(
  imageData: string,
  timeLabel: string
): Promise<{ events: VideoEvent[]; rawResponse: string; error?: string }> {
  try {
    const res = await fetch("/api/analyze-frame", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageData, timeLabel }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { events: [], rawResponse: "", error: data.error || `HTTP ${res.status}` };
    }
    return { events: data.events || [], rawResponse: data.rawResponse || "" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { events: [], rawResponse: "", error: msg };
  }
}

interface SavedVideo {
  id: string
  name: string
  url: string
  thumbnailUrl: string
  timestamps: Timestamp[]
}

export default function UploadPage() {
  const [videoUrl, setVideoUrl] = useState<string>("")
  const [isUploading, setIsUploading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [timestamps, setTimestamps] = useState<Timestamp[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [videoName, setVideoName] = useState("")
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const captureFrame = async (video: HTMLVideoElement, time: number): Promise<string | null> => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      console.error('Failed to get canvas context');
      return null;
    }

    try {
      if (Math.abs(video.currentTime - time) > 0.01) {
        video.currentTime = time;
        // Wait for video to seek to the specified time with a timeout fallback
        await new Promise<void>((resolve) => {
          let resolved = false;
          const handleSeeked = () => {
            if (!resolved) {
              resolved = true;
              resolve();
            }
          };
          video.addEventListener('seeked', handleSeeked, { once: true });
          setTimeout(() => {
            if (!resolved) {
              resolved = true;
              video.removeEventListener('seeked', handleSeeked);
              resolve();
            }
          }, 2000);
        });
      }
    } catch (error) {
      console.error('Error setting video time:', error);
      return null;
    }

    // Scale down to max 640px wide to keep payload size manageable
    const maxWidth = 640;
    const scale = video.videoWidth > maxWidth ? maxWidth / video.videoWidth : 1;
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/jpeg', 0.5);
  };

  const handleFileUpload = async (e: { target: { files: FileList | null } }) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadProgress(0)
    setTimestamps([])
    setAnalysisError(null)

    try {

      const localUrl = URL.createObjectURL(file)
      setVideoUrl(localUrl)
      setVideoName(file.name)

      // Wait for video element to be available
      while (!videoRef.current) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Set the source and wait for video to load
      const video = videoRef.current
      video.src = localUrl

      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout waiting for video metadata'))
        }, 10000)

        const handleLoad = () => {
          clearTimeout(timeout)
          resolve(true)
        }

        const handleError = () => {
          clearTimeout(timeout)
          reject(new Error('Failed to load video: ' + video.error?.message))
        }

        video.addEventListener('loadeddata', handleLoad)
        video.addEventListener('error', handleError)

        if (video.readyState >= 2) {
          handleLoad()
        }

        return () => {
          video.removeEventListener('loadeddata', handleLoad)
          video.removeEventListener('error', handleError)
        }
      })
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setIsUploading(false)
      setUploadProgress(100)

      // Start analysis
      setIsAnalyzing(true)
      const duration = video.duration

      if (!duration || duration === Infinity || isNaN(duration)) {
        throw new Error('Invalid video duration')
      }

      console.log('Video duration:', duration)
      const interval = 5 // Analyze one frame every 5 seconds to stay within rate limits
      const totalFrames = Math.floor(duration / interval)
      const newTimestamps: Timestamp[] = []

      // Process frames at regular intervals
      let consecutiveErrors = 0
      for (let time = 0; time < duration; time += interval) {
        const progress = Math.floor((time / duration) * 100)
        setUploadProgress(progress)

        const minutes = Math.floor(time / 60)
        const seconds = Math.floor(time % 60)
        const timeLabel = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        console.log(`Analyzing frame at ${timeLabel} (${progress}%)...`)

        const frame = await captureFrame(video, time)
        if (frame) {
          const result = await analyzeFrame(frame, timeLabel)
          console.log('Frame analysis result:', result)

          if (result.error) {
            consecutiveErrors++
            console.warn(`Frame ${timeLabel} error (${consecutiveErrors}):`, result.error)
            // Stop if 3 consecutive frames fail
            if (consecutiveErrors >= 3) {
              setAnalysisError(`Analysis stopped: ${result.error}`)
              break
            }
            // Wait extra time before retrying on error
            await new Promise(r => setTimeout(r, 3000))
          } else {
            consecutiveErrors = 0 // Reset on success
          }

          if (result.events && result.events.length > 0) {
            result.events.forEach((event: VideoEvent) => {
              newTimestamps.push({
                timestamp: event.timestamp,
                description: event.description,
                isDangerous: event.isDangerous
              })
            })
            // Update timestamps live as we analyse
            setTimestamps([...newTimestamps])
          }

          // Small delay between requests to avoid rate limiting
          await new Promise(r => setTimeout(r, 1500))
        }
      }

      console.log('Analysis complete, found timestamps:', newTimestamps)
      setTimestamps(newTimestamps)
      setIsAnalyzing(false)
      setUploadProgress(100)
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      console.error("Error uploading/analyzing video:", error)
      setAnalysisError(msg)
      setIsUploading(false)
      setIsAnalyzing(false)
    }
  }

  const handleTimestampClick = (timestamp: string) => {
    if (!videoRef.current) return

    const [minutes, seconds] = timestamp.split(":").map(Number)
    const timeInSeconds = minutes * 60 + seconds
    videoRef.current.currentTime = timeInSeconds
    videoRef.current.play()
  }

  const handleSaveVideo = () => {
    if (!videoUrl || !videoName) return

    const savedVideos: SavedVideo[] = JSON.parse(localStorage.getItem("savedVideos") || "[]")
    const newVideo: SavedVideo = {
      id: Date.now().toString(),
      name: videoName,
      url: videoUrl,
      thumbnailUrl: videoUrl,
      timestamps: timestamps,
    }
    savedVideos.push(newVideo)
    localStorage.setItem("savedVideos", JSON.stringify(savedVideos))
    alert("Video saved successfully!")
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl relative">
        <div className="relative z-10 p-8">
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2 text-slate-900">
                Video Timestamp Analyzer
              </h1>
              <p className="text-slate-500">Upload a video to analyze key moments and generate timestamps</p>
            </div>

            {!videoUrl && (
              <div className="flex justify-center">
                <div className="w-full max-w-md">
                  <label
                    htmlFor="video-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer border-slate-300 bg-white hover:bg-slate-50 hover:border-blue-400 transition-colors"
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.currentTarget.classList.add('border-blue-500');
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.currentTarget.classList.remove('border-blue-500');
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.currentTarget.classList.remove('border-blue-500');

                      const file = e.dataTransfer.files[0];
                      if (file && file.type.startsWith('video/')) {
                        const input = document.getElementById('video-upload') as HTMLInputElement;
                        if (input) {
                          const dataTransfer = new DataTransfer();
                          dataTransfer.items.add(file);
                          input.files = dataTransfer.files;
                          handleFileUpload({ target: { files: dataTransfer.files } } as any);
                        }
                      }
                    }}
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="h-8 w-8 mb-2 text-slate-400" />
                      <p className="mb-2 text-sm text-slate-400">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                    </div>
                    <input
                      id="video-upload"
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={isUploading || isAnalyzing}
                    />
                  </label>
                </div>
              </div>
            )}

            {analysisError && (
              <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
                <strong>⚠️ Error:</strong> {analysisError}
                <br />
                <span className="text-xs text-red-500 mt-1 block">Check your GOOGLE_API_KEY in .env.local and restart the dev server.</span>
              </div>
            )}

            {(isUploading || isAnalyzing) && (
              <div className="space-y-2">
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-center text-sm text-slate-500">
                  {isUploading ? "Uploading video..." : `Analyzing video content... ${uploadProgress}%`}
                </p>
              </div>
            )}

            {videoUrl && (
              <div className="space-y-4">
                <VideoPlayer url={videoUrl} timestamps={timestamps} ref={videoRef} />
                <TimestampList timestamps={timestamps} onTimestampClick={handleTimestampClick} />
                <div className="flex items-center space-x-2">
                  <Input
                    type="text"
                    placeholder="Video name"
                    value={videoName}
                    onChange={(e) => setVideoName(e.target.value)}
                    className="bg-white border-slate-300 text-slate-900"
                  />
                  <Button onClick={handleSaveVideo} className="bg-blue-600 text-white hover:bg-blue-700">
                    <Save className="w-4 h-4 mr-2" />
                    Save Video
                  </Button>
                </div>
              </div>
            )}

            <div className="text-center">
              <Link href="/pages/saved-videos" className="text-blue-600 hover:text-blue-700">
                View Saved Videos
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
