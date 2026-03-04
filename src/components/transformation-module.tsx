"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Code2, Play, RefreshCw, Download, 
  Image as ImageIcon, BookOpen, Info, 
  Share2, MoreHorizontal, Copy, Check, Terminal 
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
      const data = imageData.data

      // For Contrast Stretch, we need min/max first
      let min = 255, max = 0
      if (id === 'contrast') {
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i+1] + data[i+2]) / 3
          if (avg < min) min = avg
          if (avg > max) max = avg
        }
      }

      for (let i = 0; i < data.length; i += 4) {
        if (id === 'negative') {
          data[i] = 255 - data[i]
          data[i + 1] = 255 - data[i + 1]
          data[i + 2] = 255 - data[i + 2]
        } else if (id === 'log') {
          const scale = 255 / Math.log(256)
          data[i] = scale * Math.log(1 + data[i])
          data[i + 1] = scale * Math.log(1 + data[i + 1])
          data[i + 2] = scale * Math.log(1 + data[i + 2])
        } else if (id === 'power') {
          const scale = 255 / Math.pow(255, gamma)
          data[i] = scale * Math.pow(data[i], gamma)
          data[i + 1] = scale * Math.pow(data[i + 1], gamma)
          data[i + 2] = scale * Math.pow(data[i + 2], gamma)
        } else if (id === 'threshold') {
          const avg = (data[i] + data[i+1] + data[i+2]) / 3
          const val = avg > threshold ? 255 : 0
          data[i] = val
          data[i+1] = val
          data[i+2] = val
        } else if (id === 'contrast') {
          const range = max - min || 1
          data[i] = (data[i] - min) * (255 / range)
          data[i+1] = (data[i+1] - min) * (255 / range)
          data[i+2] = (data[i+2] - min) * (255 / range)
        } else if (id === 'piecewise') {
          // Hardcoded (r1, s1) = (70, 20), (r2, s2) = (180, 230) for demo
          const r1 = 70, s1 = 20, r2 = 180, s2 = 230
          const map = (v: number) => {
            if (v <= r1) return (s1/r1) * v
            if (v <= r2) return ((s2-s1)/(r2-r1)) * (v-r1) + s1
            return ((255-s2)/(255-r2)) * (v-r2) + s2
          }
          data[i] = map(data[i])
          data[i+1] = map(data[i+1])
          data[i+2] = map(data[i+2])
        }
      }
      
      ctx.putImageData(imageData, 0, 0)
      setProcessing(false)
    }
  }

  useEffect(() => {
    if (image) processImage()
  }, [id, image, gamma, threshold])

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
              <div className="absolute top-4 right-4 text-[10px] font-mono text-muted-foreground/20 pointer-events-none group-hover:text-muted-foreground/40 transition-colors">
                UTF-8 // transform.py
              </div>
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
            {/* WORKSPACE - Always mounted, visibility toggled to persist canvas */}
            <div className={activeTab === 'preview' ? 'block' : 'hidden'}>
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="grid gap-8 md:grid-cols-2"
              >
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 ml-1">Input Stream</label>
                  <div className="aspect-square rounded-2xl border border-white/[0.05] bg-[#0a0a0a] overflow-hidden group shadow-2xl relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                    {image ? (
                      <img src={image} alt="Original" className="h-full w-full object-contain p-8 group-hover:scale-[1.03] transition-transform duration-700 ease-out" />
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
                  <div className="aspect-square rounded-2xl border border-emerald-500/[0.05] bg-[#0a0a0a] overflow-hidden group shadow-[0_20px_50px_-20px_rgba(0,0,0,0.5)] relative">
                    <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/[0.01] to-transparent pointer-events-none" />
                    <canvas 
                      ref={canvasRef} 
                      className={`h-full w-full object-contain p-8 group-hover:scale-[1.03] transition-transform duration-700 ease-out ${!image ? 'hidden' : ''}`} 
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

            {/* THEORY - Always mounted, visibility toggled */}
            <div className={activeTab === 'theory' ? 'block' : 'hidden'}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-white/[0.05] bg-white/[0.02] backdrop-blur-sm overflow-hidden rounded-2xl shadow-2xl">
                  <CardContent className="p-10 space-y-10">
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 text-white/90">
                        <BookOpen className="size-4 text-emerald-500" />
                        <h3 className="font-bold text-lg tracking-tight">Mathematical Foundation</h3>
                      </div>
                      <p className="text-muted-foreground text-lg leading-relaxed font-medium italic">
                        "{theory}"
                      </p>
                    </div>
                    
                    <div className="p-10 rounded-2xl bg-black border border-white/[0.05] relative group transition-all duration-500 hover:border-emerald-500/20 shadow-inner">
                      <div className="absolute top-4 left-5 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/30 group-hover:text-emerald-500/40 transition-colors">Base Formula</div>
                      <div className="text-4xl font-mono text-center py-6 text-white tracking-tighter">
                        {formula}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="space-y-4">
             <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 ml-1">Visualization</label>
             <Card className="border-white/[0.05] bg-white/[0.01] backdrop-blur-md rounded-2xl shadow-xl">
              <CardContent className="p-6 space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white/80 uppercase tracking-wider">Transfer Function</span>
                    <Info className="size-3.5 text-muted-foreground/50" />
                  </div>
                  <TransformationGraph id={id} gamma={gamma} threshold={threshold} />
                </div>

                {image && (activeTab === 'preview') && (
                  <div className="space-y-6 pt-8 border-t border-white/[0.05]">
                    {id === 'power' && (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-bold text-white/60 uppercase tracking-[0.15em]">Gamma (γ)</span>
                          <span className="text-xs font-mono bg-white/[0.05] border border-white/[0.08] text-white px-3 py-1.5 rounded-md shadow-sm">{gamma.toFixed(2)}</span>
                        </div>
                        <input 
                          type="range" 
                          min="0.1" 
                          max="5" 
                          step="0.1" 
                          value={gamma}
                          onChange={(e) => setGamma(parseFloat(e.target.value))}
                          className="w-full accent-emerald-500 h-[3px] bg-white/[0.05] rounded-full appearance-none cursor-pointer hover:bg-white/[0.1] transition-all"
                        />
                      </div>
                    )}
                    {id === 'threshold' && (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-bold text-white/60 uppercase tracking-[0.15em]">Cutoff (T)</span>
                          <span className="text-xs font-mono bg-white/[0.05] border border-white/[0.08] text-white px-3 py-1.5 rounded-md shadow-sm">{threshold}</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="255" 
                          step="1" 
                          value={threshold}
                          onChange={(e) => setThreshold(parseInt(e.target.value))}
                          className="w-full accent-emerald-500 h-[3px] bg-white/[0.05] rounded-full appearance-none cursor-pointer hover:bg-white/[0.1] transition-all"
                        />
                      </div>
                    )}
                    {id === 'contrast' && (
                      <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-[11px] text-emerald-400/80 font-medium leading-relaxed italic">
                        Auto-detecting input range [min, max] and mapping to [0, 255] for optimal dynamic stretch.
                      </div>
                    )}
                    {id === 'piecewise' && (
                      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] text-[11px] text-muted-foreground font-medium leading-relaxed">
                        Currently mapping (70, 20) to (180, 230) for localized contrast enhancement.
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
