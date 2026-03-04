"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Code2, Play, RefreshCw, Download, Image as ImageIcon, BookOpen, Info } from 'lucide-react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion, AnimatePresence } from "framer-motion"
import { TransformationGraph } from "./transformation-graph"

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

  const processImage = () => {
    if (!image || !canvasRef.current) return
    setProcessing(true)

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
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
        }
      }
      
      ctx.putImageData(imageData, 0, 0)
      setProcessing(false)
    }
  }

  useEffect(() => {
    if (image) processImage()
  }, [id, image, gamma])

  return (
    <motion.div 
      key={id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">
            {title}
          </h2>
          <p className="text-muted-foreground text-sm max-w-2xl">{description}</p>
        </div>
        
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="flex p-1 bg-muted/40 rounded-lg border border-border/50">
            <Button 
              variant={activeTab === 'preview' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => setActiveTab('preview')}
              className="px-3"
            >
              Workspace
            </Button>
            <Button 
              variant={activeTab === 'theory' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => setActiveTab('theory')}
              className="px-3"
            >
              Theory
            </Button>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowCode(!showCode)}
            className="gap-2 border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-500"
          >
            <Code2 className="size-4" />
            {showCode ? "Hide Code" : "Show Code"}
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {showCode && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-border/50 bg-black/60 backdrop-blur-xl">
              <CardHeader className="py-2 px-4 border-b border-border/50 bg-muted/30 flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-1.5">
                  <div className="size-2.5 rounded-full bg-rose-500/80" />
                  <div className="size-2.5 rounded-full bg-amber-500/80" />
                  <div className="size-2.5 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 text-xs font-mono text-muted-foreground">transform.py</span>
                </div>
                <Button variant="ghost" size="icon" className="size-6 text-muted-foreground">
                  <Download className="size-3" />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[250px] w-full">
                  <pre className="p-6 text-xs font-mono text-emerald-400/90 leading-relaxed selection:bg-emerald-500/30">
                    <code>{pythonCode}</code>
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-8 flex flex-col gap-6">
          <AnimatePresence mode="wait">
            {activeTab === 'preview' ? (
              <motion.div 
                key="workspace"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="grid gap-6 md:grid-cols-2"
              >
                <Card className="border-border/50 bg-card/20 overflow-hidden backdrop-blur-sm group">
                  <CardHeader className="py-3 px-4 border-b border-border/20 bg-muted/10">
                    <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <ImageIcon className="size-3" />
                      Original
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 flex items-center justify-center bg-black/40 aspect-square md:aspect-auto md:h-[400px]">
                    {image ? (
                      <img src={image} alt="Original" className="max-h-full max-w-full object-contain p-4 group-hover:scale-[1.02] transition-transform duration-500" />
                    ) : (
                      <div className="text-muted-foreground/30 italic text-sm">No input</div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border/50 bg-card/20 overflow-hidden backdrop-blur-sm relative group">
                  <CardHeader className="py-3 px-4 border-b border-border/20 bg-muted/10 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-xs font-medium uppercase tracking-wider text-emerald-500/70 flex items-center gap-2">
                      <Play className="size-3" />
                      Result
                    </CardTitle>
                    {image && (
                      <Button variant="ghost" size="icon" className="size-6" onClick={processImage}>
                        <RefreshCw className={`size-3 ${processing ? 'animate-spin' : ''}`} />
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="p-0 flex items-center justify-center bg-black/40 aspect-square md:aspect-auto md:h-[400px]">
                    <canvas 
                      ref={canvasRef} 
                      className={`max-h-full max-w-full object-contain p-4 group-hover:scale-[1.02] transition-transform duration-500 ${!image ? 'hidden' : ''}`} 
                    />
                    {!image && (
                      <div className="text-muted-foreground/30 italic text-sm">Waiting for input</div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="theory"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card className="border-border/50 bg-card/10 backdrop-blur-sm">
                  <CardContent className="p-8 space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-emerald-400">
                        <BookOpen className="size-5" />
                        <h3 className="font-semibold text-lg">Theoretical Concept</h3>
                      </div>
                      <p className="text-muted-foreground leading-relaxed italic">"{theory}"</p>
                    </div>
                    
                    <div className="p-6 rounded-xl bg-muted/20 border border-border/50 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Transformation Formula</h4>
                      <div className="text-2xl font-mono text-center py-4 bg-black/20 rounded-lg border border-border/20">
                        {formula}
                      </div>
                      <p className="text-xs text-center text-muted-foreground/60 italic">Where r = input intensity, s = output intensity</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="md:col-span-4 flex flex-col gap-6">
          <Card className="border-border/50 bg-card/20 backdrop-blur-sm h-fit">
            <CardHeader className="py-4 px-5 border-b border-border/20">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Info className="size-4 text-emerald-500" />
                Control & Logic
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-6">
              <div className="space-y-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Mapping Function</span>
                <TransformationGraph id={id} gamma={gamma} />
              </div>

              {id === 'power' && image && (
                <div className="space-y-4 pt-4 border-t border-border/20">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Gamma Correction (γ)</span>
                    <span className="text-xs font-mono bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">{gamma.toFixed(2)}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.1" 
                    max="5" 
                    step="0.1" 
                    value={gamma}
                    onChange={(e) => setGamma(parseFloat(e.target.value))}
                    className="w-full accent-emerald-500 h-1.5 bg-muted rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Darken (γ &gt; 1)</span>
                    <span>Lighten (γ &lt; 1)</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  )
}
