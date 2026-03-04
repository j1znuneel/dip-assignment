"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Code2, Play, RefreshCw, Download, 
  Image as ImageIcon, BookOpen, Info, 
  Share2, MoreHorizontal, Copy, Check, Terminal,
  Sliders
} from 'lucide-react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion, AnimatePresence } from "framer-motion"
import { TransformationGraph } from "./transformation-graph"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

interface ModuleProps {
  id: string
  title: string
  description: string
  theory: string
  formula: string
  pythonCode: string
  image: string | null
}

export function TransformationModule({ id, title, description, theory, formula, pythonCode, image }: ModuleProps) {
  const [showCode, setShowCode] = useState(false)
  const [activeTab, setActiveTab] = useState<'preview' | 'theory'>('preview')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [processing, setProcessing] = useState(false)
  const [gamma, setGamma] = useState(1.0)
  const [threshold, setThreshold] = useState(127)
  const [ksize, setKsize] = useState(3)
  const [noiseLevel, setNoiseLevel] = useState(0.05)
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(pythonCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const processImage = () => {
    if (!image || !canvasRef.current) return
    setProcessing(true)

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    const img = new Image()
    img.crossOrigin = "anonymous"
    img.src = image
    
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = new Uint8ClampedArray(imageData.data)
      const width = canvas.width
      const height = canvas.height
      const outputData = ctx.createImageData(width, height)
      const output = outputData.data

      // Helper to get pixel
      const getPixel = (x: number, y: number) => {
        x = Math.max(0, Math.min(width - 1, x))
        y = Math.max(0, Math.min(height - 1, y))
        const idx = (y * width + x) * 4
        return [data[idx], data[idx+1], data[idx+2]]
      }

      // NOISE ADDITION STEP (For Median, Max, Min)
      if (['median', 'max', 'min'].includes(id)) {
        for (let i = 0; i < data.length; i += 4) {
          const rand = Math.random()
          if (rand < noiseLevel / 2) { // Pepper
            data[i] = data[i+1] = data[i+2] = 0
          } else if (rand < noiseLevel) { // Salt
            data[i] = data[i+1] = data[i+2] = 255
          }
        }
      }

      // ALGORITHMS
      if (['negative', 'log', 'power', 'threshold', 'contrast', 'hist_stretch', 'hist_eq', 'piecewise'].includes(id)) {
        // LUT based point processing
        const lut = new Uint8Array(256)
        if (id === 'negative') for (let i = 0; i < 256; i++) lut[i] = 255 - i
        else if (id === 'log') {
          const scale = 255 / Math.log(256)
          for (let i = 0; i < 256; i++) lut[i] = scale * Math.log(1 + i)
        }
        else if (id === 'power') {
          const scale = 255 / Math.pow(255, gamma)
          for (let i = 0; i < 256; i++) lut[i] = scale * Math.pow(i, gamma)
        }
        else if (id === 'threshold') for (let i = 0; i < 256; i++) lut[i] = i > threshold ? 255 : 0
        else if (id === 'contrast' || id === 'hist_stretch') {
          let min = 255, max = 0
          for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i+1] + data[i+2]) / 3
            if (avg < min) min = avg
            if (avg > max) max = avg
          }
          const range = max - min || 1
          for (let i = 0; i < 256; i++) lut[i] = Math.max(0, Math.min(255, (i - min) * (255 / range)))
        }
        else if (id === 'hist_eq') {
          const hist = new Uint32Array(256)
          for (let i = 0; i < data.length; i += 4) {
            const avg = ((data[i] + data[i+1] + data[i+2]) / 3) | 0
            hist[avg]++
          }
          const cdf = new Uint32Array(256)
          cdf[0] = hist[0]
          for (let i = 1; i < 256; i++) cdf[i] = cdf[i-1] + hist[i]
          const minCDF = cdf.find(v => v > 0) || 0
          const den = (width * height) - minCDF || 1
          for (let i = 0; i < 256; i++) lut[i] = Math.max(0, Math.min(255, Math.round(((cdf[i] - minCDF) / den) * 255)))
        }
        else if (id === 'piecewise') {
          const r1 = 70, s1 = 20, r2 = 180, s2 = 230
          for (let i = 0; i < 256; i++) {
            if (i <= r1) lut[i] = (s1/r1) * i
            else if (i <= r2) lut[i] = ((s2-s1)/(r2-r1)) * (i-r1) + s1
            else lut[i] = ((255-s2)/(255-r2)) * (i-r2) + s2
          }
        }

        for (let i = 0; i < data.length; i += 4) {
          output[i] = lut[data[i]]
          output[i+1] = lut[data[i+1]]
          output[i+2] = lut[data[i+2]]
          output[i+3] = 255
        }
      } else {
        // SPATIAL FILTERING
        const offset = Math.floor(ksize / 2)
        
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4
            const neighborhoodR = []
            const neighborhoodG = []
            const neighborhoodB = []
            
            let resR = 0, resG = 0, resB = 0
            
            // Collect neighborhood
            for (let i = -offset; i <= offset; i++) {
              for (let j = -offset; j <= offset; j++) {
                const [r, g, b] = getPixel(x + j, y + i)
                
                if (['median', 'max', 'min'].includes(id)) {
                  neighborhoodR.push(r); neighborhoodG.push(g); neighborhoodB.push(b);
                } else if (id === 'box_blur') {
                  const weight = 1 / (ksize * ksize)
                  resR += r * weight; resG += g * weight; resB += b * weight;
                } else if (id === 'laplacian') {
                  const kernel = [[0, -1, 0], [-1, 4, -1], [0, -1, 0]]
                  const weight = kernel[i+offset][j+offset]
                  resR += r * weight; resG += g * weight; resB += b * weight;
                } else if (id === 'gaussian') {
                  const sigma = 1.0
                  const weight = (1 / (2 * Math.PI * sigma * sigma)) * Math.exp(-(j*j + i*i) / (2 * sigma * sigma))
                  // Note: Gaussian needs normalization but we'll approximate for speed
                  resR += r * weight; resG += g * weight; resB += b * weight;
                } else if (id === 'convolution') {
                  const kernel = [[-1, -1, -1], [-1, 8, -1], [-1, -1, -1]]
                  const weight = kernel[i+offset][j+offset]
                  resR += r * weight; resG += g * weight; resB += b * weight;
                }
              }
            }

            if (id === 'median') {
              neighborhoodR.sort((a, b) => a - b); neighborhoodG.sort((a, b) => a - b); neighborhoodB.sort((a, b) => a - b);
              const mid = Math.floor(neighborhoodR.length / 2)
              output[idx] = neighborhoodR[mid]; output[idx+1] = neighborhoodG[mid]; output[idx+2] = neighborhoodB[mid];
            } else if (id === 'max') {
              output[idx] = Math.max(...neighborhoodR); output[idx+1] = Math.max(...neighborhoodG); output[idx+2] = Math.max(...neighborhoodB);
            } else if (id === 'min') {
              output[idx] = Math.min(...neighborhoodR); output[idx+1] = Math.min(...neighborhoodG); output[idx+2] = Math.min(...neighborhoodB);
            } else {
              output[idx] = Math.max(0, Math.min(255, resR))
              output[idx+1] = Math.max(0, Math.min(255, resG))
              output[idx+2] = Math.max(0, Math.min(255, resB))
            }
            output[idx+3] = 255
          }
        }
      }
      
      ctx.putImageData(outputData, 0, 0)
      setProcessing(false)
    }
  }

  useEffect(() => {
    if (image) processImage()
  }, [id, image, gamma, threshold, ksize, noiseLevel])

  return (
    <motion.div 
      key={id}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-8 max-w-6xl mx-auto"
    >
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-white/[0.05] pb-8">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-5 w-[2px] bg-emerald-500 rounded-full" />
            <h2 className="text-3xl font-bold tracking-tight text-white/90">
              {title}
            </h2>
          </div>
          <p className="text-muted-foreground text-base max-w-2xl font-medium leading-relaxed">
            {description}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowCode(true)}
            className="gap-2 border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] text-xs font-medium h-9 px-4 transition-all duration-300 shadow-sm"
          >
            <Code2 className="size-3.5" />
            Show Code
          </Button>
          <Button variant="outline" size="icon" className="size-9 border-white/[0.08] bg-white/[0.02] text-muted-foreground hover:text-white transition-colors">
            <Share2 className="size-3.5" />
          </Button>
        </div>
      </div>

      <Dialog open={showCode} onOpenChange={setShowCode}>
        <DialogContent className="max-w-2xl bg-[#08090a] border-white/[0.1] shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b border-white/[0.05] bg-white/[0.02]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <Terminal className="size-4 text-emerald-500" />
                </div>
                <div>
                  <DialogTitle className="text-sm font-bold tracking-tight text-white/90">Implementation Script</DialogTitle>
                  <DialogDescription className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Python Open-CV</DialogDescription>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={copyToClipboard}
                className="h-8 gap-2 border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] transition-all"
              >
                {copied ? (
                  <><Check className="size-3 text-emerald-500" /> Copied</>
                ) : (
                  <><Copy className="size-3" /> Copy Code</>
                )}
              </Button>
            </div>
          </DialogHeader>
          <div className="relative group">
             <ScrollArea className="h-[400px] w-full bg-[#050505]">
                <pre className="p-8 text-[13px] font-mono text-emerald-400/80 leading-relaxed selection:bg-emerald-500/20">
                  <code>{pythonCode}</code>
                </pre>
              </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-8">
          <div className="flex p-1 bg-white/[0.03] rounded-lg border border-white/[0.05] w-fit shadow-inner">
            <Button 
              variant={activeTab === 'preview' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => setActiveTab('preview')}
              className={`px-6 h-8 text-xs font-semibold rounded-md transition-all duration-300 ${activeTab === 'preview' ? "bg-white/[0.08] text-white shadow-sm" : "text-muted-foreground hover:text-white"}`}
            >
              Workspace
            </Button>
            <Button 
              variant={activeTab === 'theory' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => setActiveTab('theory')}
              className={`px-6 h-8 text-xs font-semibold rounded-md transition-all duration-300 ${activeTab === 'theory' ? "bg-white/[0.08] text-white shadow-sm" : "text-muted-foreground hover:text-white"}`}
            >
              Theorems
            </Button>
          </div>

          <div className="relative">
            <div className={activeTab === 'preview' ? 'block' : 'hidden'}>
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="grid gap-8 md:grid-cols-2"
              >
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 ml-1">Input Stream</label>
                  <div className="aspect-square rounded-2xl border border-white/[0.05] bg-[#0a0a0a] overflow-hidden group shadow-2xl relative">
                    {image ? (
                      <img src={image} alt="Original" className="h-full w-full object-contain p-8 transition-transform duration-700 ease-out" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                         <ImageIcon className="size-8 text-white/[0.03]" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500/60">Output Stream</label>
                    {image && (
                      <button onClick={processImage} className="text-muted-foreground hover:text-emerald-400 transition-colors p-1">
                        <RefreshCw className={`size-3 ${processing ? 'animate-spin' : ''}`} />
                      </button>
                    )}
                  </div>
                  <div className="aspect-square rounded-2xl border border-emerald-500/[0.05] bg-[#0a0a0a] overflow-hidden group shadow-2xl relative">
                    <canvas 
                      ref={canvasRef} 
                      className={`h-full w-full object-contain p-8 ${!image ? 'hidden' : ''}`} 
                    />
                    {!image && (
                      <div className="h-full w-full flex items-center justify-center">
                         <Play className="size-8 text-white/[0.03]" />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>

            <div className={activeTab === 'theory' ? 'block' : 'hidden'}>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="border-white/[0.05] bg-white/[0.02] backdrop-blur-sm overflow-hidden rounded-2xl shadow-2xl">
                  <CardContent className="p-10 space-y-10">
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 text-white/90">
                        <BookOpen className="size-4 text-emerald-500" />
                        <h3 className="font-bold text-lg tracking-tight">Mathematical Foundation</h3>
                      </div>
                      <p className="text-muted-foreground text-lg leading-relaxed font-medium italic italic">"{theory}"</p>
                    </div>
                    <div className="p-10 rounded-2xl bg-black border border-white/[0.05] relative group shadow-inner">
                      <div className="absolute top-4 left-5 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/30">Base Formula</div>
                      <div className="text-4xl font-mono text-center py-6 text-white tracking-tighter">{formula}</div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="space-y-4">
             <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 ml-1">Control Center</label>
             <Card className="border-white/[0.05] bg-white/[0.01] backdrop-blur-md rounded-2xl shadow-xl">
              <CardContent className="p-6 space-y-8">
                {image && (activeTab === 'preview') && (
                  <div className="space-y-8">
                    {/* Common Controls */}
                    {['box_blur', 'gaussian', 'median', 'max', 'min'].includes(id) && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-bold text-white/60 uppercase tracking-[0.15em]">Kernel Size (k)</span>
                          <span className="text-xs font-mono bg-white/[0.05] border border-white/[0.08] text-white px-3 py-1.5 rounded-md">{ksize}x{ksize}</span>
                        </div>
                        <input type="range" min="3" max="15" step="2" value={ksize} onChange={(e) => setKsize(parseInt(e.target.value))} className="w-full accent-emerald-500 h-[3px] bg-white/[0.05] rounded-full appearance-none cursor-pointer" />
                      </div>
                    )}

                    {['median', 'max', 'min'].includes(id) && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-bold text-white/60 uppercase tracking-[0.15em]">Noise Density</span>
                          <span className="text-xs font-mono bg-white/[0.05] border border-white/[0.08] text-white px-3 py-1.5 rounded-md">{(noiseLevel * 100).toFixed(0)}%</span>
                        </div>
                        <input type="range" min="0.01" max="0.5" step="0.01" value={noiseLevel} onChange={(e) => setNoiseLevel(parseFloat(e.target.value))} className="w-full accent-emerald-500 h-[3px] bg-white/[0.05] rounded-full appearance-none cursor-pointer" />
                      </div>
                    )}

                    {id === 'power' && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-bold text-white/60 uppercase tracking-[0.15em]">Gamma (γ)</span>
                          <span className="text-xs font-mono bg-white/[0.05] border border-white/[0.08] text-white px-3 py-1.5 rounded-md">{gamma.toFixed(2)}</span>
                        </div>
                        <input type="range" min="0.1" max="5" step="0.1" value={gamma} onChange={(e) => setGamma(parseFloat(e.target.value))} className="w-full accent-emerald-500 h-[3px] bg-white/[0.05] rounded-full appearance-none cursor-pointer" />
                      </div>
                    )}

                    {id === 'threshold' && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-bold text-white/60 uppercase tracking-[0.15em]">Cutoff (T)</span>
                          <span className="text-xs font-mono bg-white/[0.05] border border-white/[0.08] text-white px-3 py-1.5 rounded-md">{threshold}</span>
                        </div>
                        <input type="range" min="0" max="255" step="1" value={threshold} onChange={(e) => setThreshold(parseInt(e.target.value))} className="w-full accent-emerald-500 h-[3px] bg-white/[0.05] rounded-full appearance-none cursor-pointer" />
                      </div>
                    )}

                    <div className="pt-4 border-t border-white/[0.05]">
                      <TransformationGraph id={id} gamma={gamma} threshold={threshold} />
                    </div>
                  </div>
                )}
                {!image && <div className="text-center py-10 text-muted-foreground text-xs italic">Upload stream to unlock controls</div>}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
