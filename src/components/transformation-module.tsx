"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Code2, Play, RefreshCw, Download, 
  Image as ImageIcon, BookOpen, Terminal,
  Share2, Waves, Zap, Activity, Copy, Check, X
} from 'lucide-react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion, AnimatePresence } from "framer-motion"
import { TransformationGraph } from "./transformation-graph"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// --- FFT ENGINE ---
function fft(re: Float32Array, im: Float32Array, n: number) {
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1
    for (; j & bit; bit >>= 1) j ^= bit
    j ^= bit
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    let ang = (2 * Math.PI) / len
    let wlen_re = Math.cos(ang), wlen_im = Math.sin(ang)
    for (let i = 0; i < n; i += len) {
      let w_re = 1, w_im = 0
      for (let j = 0; j < len / 2; j++) {
        let u_re = re[i + j], u_im = im[i + j]
        let v_re = re[i + j + len / 2] * w_re - im[i + j + len / 2] * w_im
        let v_im = re[i + j + len / 2] * w_im + im[i + j + len / 2] * w_re
        re[i + j] = u_re + v_re; im[i + j] = u_im + v_im
        re[i + j + len / 2] = u_re - v_re; im[i + j + len / 2] = u_im - v_im
        let n_w_re = w_re * wlen_re - w_im * wlen_im
        w_im = w_re * wlen_im + w_im * wlen_re
        w_re = n_w_re
      }
    }
  }
}

function ifft(re: Float32Array, im: Float32Array, n: number) {
  for (let i = 0; i < n; i++) im[i] = -im[i]
  fft(re, im, n)
  for (let i = 0; i < n; i++) { re[i] /= n; im[i] = -im[i] / n; }
}

interface ModuleProps { id: string; title: string; description: string; theory: string; formula: string; pythonCode: string; image: string | null }

const K_R = new Uint8Array(256), K_G = new Uint8Array(256), K_B = new Uint8Array(256)

export function TransformationModule({ id, title, description, theory, formula, pythonCode, image }: ModuleProps) {
  const [showCode, setShowCode] = useState(false)
  const [activeTab, setActiveTab] = useState<'preview' | 'theory'>('preview')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const spectrumRef = useRef<HTMLCanvasElement>(null)
  const [processing, setProcessing] = useState(false)
  const [gamma, setGamma] = useState(1.0), [threshold, setThreshold] = useState(127), [ksize, setKsize] = useState(3), [cutoff, setCutoff] = useState(30), [order, setOrder] = useState(2), [noiseLevel, setNoiseLevel] = useState(0.05), [copied, setCopied] = useState(false)

  const copyToClipboard = () => { navigator.clipboard.writeText(pythonCode); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  const processImage = () => {
    if (!image || !canvasRef.current) return
    setProcessing(true)
    const canvas = canvasRef.current, ctx = canvas.getContext('2d', { willReadFrequently: true }), spectrumCtx = spectrumRef.current?.getContext('2d')
    if (!ctx) return
    const img = new Image()
    img.crossOrigin = "anonymous"; img.src = image
    img.onload = () => {
      const w = img.width, h = img.height
      canvas.width = w; canvas.height = h
      if (spectrumRef.current) { spectrumRef.current.width = w; spectrumRef.current.height = h }
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, w, h), data = new Uint8ClampedArray(imageData.data), outputData = ctx.createImageData(w, h), output = outputData.data
      
      if (['median', 'max', 'min'].includes(id)) {
        for (let i = 0; i < data.length; i += 4) {
          const rand = Math.random()
          if (rand < noiseLevel / 2) data[i] = data[i+1] = data[i+2] = 0
          else if (rand < noiseLevel) data[i] = data[i+1] = data[i+2] = 255
        }
      }

      const isFreq = id.includes('_lpf') || id.includes('_hpf')
      if (isFreq) {
        const N = 1 << Math.ceil(Math.log2(w)), M = 1 << Math.ceil(Math.log2(h))
        const re = new Float32Array(N * M), im = new Float32Array(N * M)
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4
            re[y * N + x] = ((data[idx] + data[idx+1] + data[idx+2]) / 3) * (((x + y) % 2 === 0) ? 1 : -1)
          }
        }
        for (let y = 0; y < M; y++) fft(re.subarray(y * N, (y + 1) * N), im.subarray(y * N, (y + 1) * N), N)
        const temp_re = new Float32Array(M), temp_im = new Float32Array(M)
        for (let x = 0; x < N; x++) {
          for (let y = 0; y < M; y++) { temp_re[y] = re[y * N + x]; temp_im[y] = im[y * N + x] }
          fft(temp_re, temp_im, M)
          for (let y = 0; y < M; y++) { re[y * N + x] = temp_re[y]; im[y * N + x] = temp_im[y] }
        }
        if (spectrumCtx) {
          const sData = spectrumCtx.createImageData(w, h)
          for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
              const mag = Math.sqrt(re[y * N + x]**2 + im[y * N + x]**2), val = Math.log(1 + mag) * 15, sidx = (y * w + x) * 4
              sData.data[sidx] = sData.data[sidx+1] = sData.data[sidx+2] = val; sData.data[sidx+3] = 255
            }
          }
          spectrumCtx.putImageData(sData, 0, 0)
        }
        const crow = M / 2, ccol = N / 2
        for (let y = 0; y < M; y++) {
          for (let x = 0; x < N; x++) {
            const d = Math.sqrt((y - crow)**2 + (x - ccol)**2)
            let h_val = 0
            if (id === 'ideal_lpf') h_val = d <= cutoff ? 1 : 0
            else if (id === 'ideal_hpf') h_val = d <= cutoff ? 0 : 1
            else if (id === 'butter_lpf') h_val = 1 / (1 + Math.pow(d / cutoff, 2 * order))
            else if (id === 'butter_hpf') h_val = 1 / (1 + Math.pow(cutoff / Math.max(1, d), 2 * order))
            else if (id === 'gauss_lpf') h_val = Math.exp(-(d * d) / (2 * cutoff * cutoff))
            else if (id === 'gauss_hpf') h_val = 1 - Math.exp(-(d * d) / (2 * cutoff * cutoff))
            re[y * N + x] *= h_val; im[y * N + x] *= h_val
          }
        }
        for (let x = 0; x < N; x++) {
          for (let y = 0; y < M; y++) { temp_re[y] = re[y * N + x]; temp_im[y] = im[y * N + x] }
          ifft(temp_re, temp_im, M)
          for (let y = 0; y < M; y++) { re[y * N + x] = temp_re[y]; im[y * N + x] = temp_im[y] }
        }
        for (let y = 0; y < M; y++) ifft(re.subarray(y * N, (y + 1) * N), im.subarray(y * N, (y + 1) * N), N)
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4, res = re[y * N + x] * (((x + y) % 2 === 0) ? 1 : -1)
            output[idx] = output[idx+1] = output[idx+2] = Math.max(0, Math.min(255, res)); output[idx+3] = 255
          }
        }
      } else {
        const isPoint = ['negative', 'log', 'power', 'threshold', 'contrast', 'hist_eq', 'piecewise', 'hist_stretch'].includes(id)
        if (isPoint) {
          const lut = new Uint8Array(256)
          if (id === 'negative') for (let i = 0; i < 256; i++) lut[i] = 255 - i
          else if (id === 'log') { const s = 255 / Math.log(256); for (let i = 0; i < 256; i++) lut[i] = s * Math.log(1 + i) }
          else if (id === 'power') { const s = 255 / Math.pow(255, gamma); for (let i = 0; i < 256; i++) lut[i] = s * Math.pow(i, gamma) }
          else if (id === 'threshold') for (let i = 0; i < 256; i++) lut[i] = i > threshold ? 255 : 0
          else if (id === 'contrast' || id === 'hist_stretch') {
            let mi = 255, ma = 0
            for (let i = 0; i < data.length; i += 4) { const v = (data[i]+data[i+1]+data[i+2])/3; if (v<mi) mi=v; if (v>ma) ma=v }
            const r = ma - mi || 1
            for (let i = 0; i < 256; i++) lut[i] = Math.max(0, Math.min(255, (i - mi) * (255 / r)))
          }
          else if (id === 'hist_eq') {
            const hist = new Uint32Array(256)
            for (let i = 0; i < data.length; i += 4) hist[((data[i]+data[i+1]+data[i+2])/3)|0]++
            const cdf = new Uint32Array(256); cdf[0] = hist[0]
            for (let i = 1; i < 256; i++) cdf[i] = cdf[i-1] + hist[i]
            const minC = cdf.find(v => v > 0) || 0, den = (w * h) - minC || 1
            for (let i = 0; i < 256; i++) lut[i] = Math.round(((cdf[i] - minC) / den) * 255)
          }
          else if (id === 'piecewise') {
            const r1 = 70, s1 = 20, r2 = 180, s2 = 230
            for (let i = 0; i < 256; i++) { if (i <= r1) lut[i] = (s1/r1) * i; else if (i <= r2) lut[i] = ((s2-s1)/(r2-r1)) * (i-r1) + s1; else lut[i] = ((255-s2)/(255-r2)) * (i-r2) + s2 }
          }
          for (let i = 0; i < data.length; i += 4) { output[i] = lut[data[i]]; output[i+1] = lut[data[i+1]]; output[i+2] = lut[data[i+2]]; output[i+3] = 255 }
        } else {
          const offset = Math.floor(ksize / 2)
          for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
              const idx = (y * w + x) * 4
              if (id === 'sobel') {
                const gx = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], gy = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]]
                let rX = 0, rY = 0
                for (let i = -1; i <= 1; i++) {
                  for (let j = -1; j <= 1; j++) {
                    const py = Math.max(0, Math.min(h-1, y+i)), px = Math.max(0, Math.min(w-1, x+j)), v = (data[(py*w+px)*4] + data[(py*w+px)*4+1] + data[(py*w+px)*4+2])/3
                    rX += v * gx[i+1][j+1]; rY += v * gy[i+1][j+1]
                  }
                }
                output[idx] = output[idx+1] = output[idx+2] = Math.sqrt(rX*rX + rY*rY); output[idx+3] = 255
              } else if (id === 'laplacian') {
                const k = [[0, -1, 0], [-1, 4, -1], [0, -1, 0]]
                let r_sum = 0
                for (let i = -1; i <= 1; i++) {
                  for (let j = -1; j <= 1; j++) {
                    const py = Math.max(0, Math.min(h-1, y+i)), px = Math.max(0, Math.min(w-1, x+j)), r_val = data[(py*w+px)*4]
                    r_sum += r_val * k[i+1][j+1]
                  }
                }
                const res = Math.max(0, Math.min(255, r_sum)); output[idx] = output[idx+1] = output[idx+2] = res; output[idx+3] = 255
              } else if (['median', 'max', 'min'].includes(id)) {
                let count = 0
                for (let i = -offset; i <= offset; i++) {
                  for (let j = -offset; j <= offset; j++) {
                    const py = Math.max(0, Math.min(h-1, y+i)), px = Math.max(0, Math.min(w-1, x+j)), pidx = (py * w + px) * 4
                    K_R[count] = data[pidx]; K_G[count] = data[pidx+1]; K_B[count] = data[pidx+2]; count++
                  }
                }
                if (id === 'median') {
                  const sR = K_R.subarray(0, count).sort(), sG = K_G.subarray(0, count).sort(), sB = K_B.subarray(0, count).sort()
                  output[idx] = sR[count >> 1]; output[idx+1] = sG[count >> 1]; output[idx+2] = sB[count >> 1]
                } else if (id === 'max') {
                  let mr = 0, mg = 0, mb = 0
                  for (let i = 0; i < count; i++) { if (K_R[i] > mr) mr = K_R[i]; if (K_G[i] > mg) mg = K_G[i]; if (K_B[i] > mb) mb = K_B[i] }
                  output[idx] = mr; output[idx+1] = mg; output[idx+2] = mb
                } else if (id === 'min') {
                  let mr = 255, mg = 255, mb = 255
                  for (let i = 0; i < count; i++) { if (K_R[i] < mr) mr = K_R[i]; if (K_G[i] < mg) mg = K_G[i]; if (K_B[i] < mb) mb = K_B[i] }
                  output[idx] = mr; output[idx+1] = mg; output[idx+2] = mb
                }
                output[idx+3] = 255
              } else if (id === 'box_blur' || id === 'gauss_blur') {
                let r = 0, g = 0, b = 0, w_sum = 0
                for (let i = -offset; i <= offset; i++) {
                  for (let j = -offset; j <= offset; j++) {
                    const py = Math.max(0, Math.min(h-1, y+i)), px = Math.max(0, Math.min(w-1, x+j)), pidx = (py * w + px) * 4
                    const w_val = id === 'box_blur' ? 1 : Math.exp(-(i*i + j*j) / 2)
                    r += data[pidx] * w_val; g += data[pidx+1] * w_val; b += data[pidx+2] * w_val; w_sum += w_val
                  }
                }
                output[idx] = r/w_sum; output[idx+1] = g/w_sum; output[idx+2] = b/w_sum; output[idx+3] = 255
              }
            }
          }
        }
      }
      ctx.putImageData(outputData, 0, 0); setProcessing(false)
    }
  }

  useEffect(() => { if (image) processImage() }, [id, image, gamma, threshold, cutoff, order, ksize, noiseLevel])

  return (
    <motion.div key={id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex flex-col gap-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-white/[0.05] pb-8">
        <div className="space-y-3">
          <div className="flex items-center gap-3"><div className="h-5 w-[2px] bg-emerald-500 rounded-full" /><h2 className="text-3xl font-bold tracking-tight text-white/90">{title}</h2></div>
          <p className="text-muted-foreground text-base max-w-2xl font-medium leading-relaxed">{description}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowCode(true)} className="gap-2 border-white/[0.08] bg-white/[0.02] text-xs h-9 px-4 transition-all duration-300 shadow-sm"><Code2 className="size-3.5" />Show Code</Button>
      </div>

      <Dialog open={showCode} onOpenChange={setShowCode}>
        <DialogContent className="max-w-2xl bg-[#08090a] border-white/[0.1] p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="px-6 py-4 border-b border-white/[0.05] bg-white/[0.02] flex flex-row items-center justify-between">
            <div className="flex items-center gap-2.5"><Terminal className="size-4 text-emerald-500" /><div><DialogTitle className="text-sm font-bold text-white/90">Implementation</DialogTitle></div></div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={copyToClipboard} className="h-8 gap-2 border-white/[0.08] bg-white/[0.03] text-xs transition-all">
                {copied ? <><Check className="size-3 text-emerald-500" /> Copied</> : <><Copy className="size-3" /> Copy Code</>}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setShowCode(false)} className="size-8 text-muted-foreground hover:text-white"><X className="size-4" /></Button>
            </div>
          </DialogHeader>
          <ScrollArea className="h-[400px] w-full bg-[#050505]"><pre className="p-8 text-[13px] font-mono text-emerald-400/80 leading-relaxed selection:bg-emerald-500/20"><code>{pythonCode}</code></pre></ScrollArea>
        </DialogContent>
      </Dialog>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-8">
          <div className="flex p-1 bg-white/[0.03] rounded-lg border border-white/[0.05] w-fit shadow-inner">
            <Button variant={activeTab === 'preview' ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveTab('preview')} className={`px-6 h-8 text-xs font-semibold rounded-md transition-all duration-300 ${activeTab === 'preview' ? "bg-white/[0.08] text-white shadow-sm" : "text-muted-foreground hover:text-white"}`}>Workspace</Button>
            <Button variant={activeTab === 'theory' ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveTab('theory')} className={`px-6 h-8 text-xs font-semibold rounded-md transition-all duration-300 ${activeTab === 'theory' ? "bg-white/[0.08] text-white shadow-sm" : "text-muted-foreground hover:text-white"}`}>Theorems</Button>
          </div>

          <div className={activeTab === 'preview' ? 'block' : 'hidden'}>
            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-3"><label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">Source</label><div className="aspect-square rounded-2xl border border-white/[0.05] bg-[#0a0a0a] overflow-hidden shadow-2xl">{image && <img src={image} className="h-full w-full object-contain p-8 transition-transform duration-700 ease-out" />}</div></div>
              <div className="space-y-3">
                <div className="flex justify-between items-center"><label className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500/60">Output</label><button onClick={processImage} className="text-muted-foreground hover:text-emerald-400 p-1"><RefreshCw className={`size-3 ${processing ? 'animate-spin' : ''}`} /></button></div>
                <div className="aspect-square rounded-2xl border border-emerald-500/[0.05] bg-[#0a0a0a] overflow-hidden shadow-2xl relative"><canvas ref={canvasRef} className="h-full w-full object-contain p-8" /></div>
              </div>
              {id.includes('_') && (
                <div className="md:col-span-2 space-y-3 mt-4"><label className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-500/60">FFT Spectrum Visualization</label><div className="h-48 w-full rounded-2xl border border-white/[0.05] bg-[#0a0a0a] flex items-center justify-center bg-gradient-to-br from-[#0a0a0a] to-[#050505] shadow-2xl"><canvas ref={spectrumRef} className="h-full opacity-80" /></div></div>
              )}
            </div>
          </div>

          <div className={activeTab === 'theory' ? 'block' : 'hidden'}>
            <Card className="border-white/[0.05] bg-white/[0.02] backdrop-blur-sm rounded-2xl shadow-2xl"><CardContent className="p-10 space-y-10"><div className="space-y-6"><div className="flex items-center gap-3 text-white/90"><BookOpen className="size-4 text-emerald-500" /><h3 className="font-bold text-lg tracking-tight">Mathematical Foundation</h3></div><p className="text-muted-foreground text-lg italic italic">"{theory}"</p></div><div className="p-10 rounded-2xl bg-black border border-white/[0.05] relative shadow-inner"><div className="absolute top-4 left-5 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/30">Base Formula</div><div className="text-3xl font-mono text-center py-6 text-white tracking-tighter overflow-x-auto">{formula}</div></div></CardContent></Card>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-8">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 ml-1">Control Center</label>
          <Card className="border-white/[0.05] bg-white/[0.01] backdrop-blur-md rounded-2xl shadow-xl"><CardContent className="p-6 space-y-8">
            {image ? (
              <div className="space-y-8">
                {id.includes('_lpf') || id.includes('_hpf') ? (
                  <div className="space-y-6">
                    <div className="space-y-4"><div className="flex justify-between items-center"><span className="text-[11px] font-bold text-white/60 uppercase tracking-[0.15em]">Cutoff (D0)</span><span className="text-xs font-mono bg-white/[0.05] border border-white/[0.08] text-white px-3 py-1.5 rounded-md">{cutoff}</span></div><input type="range" min="5" max="250" step="1" value={cutoff} onChange={(e) => setCutoff(parseInt(e.target.value))} className="w-full accent-emerald-500 h-[3px] bg-white/[0.05] rounded-full appearance-none cursor-pointer" /></div>
                    {id.includes('butter') && (<div className="space-y-4 pt-4 border-t border-white/[0.05]"><div className="flex justify-between items-center"><span className="text-[11px] font-bold text-white/60 uppercase tracking-[0.15em]">Order (n)</span><span className="text-xs font-mono bg-white/[0.05] border border-white/[0.08] text-white px-3 py-1.5 rounded-md">{order}</span></div><input type="range" min="1" max="10" step="1" value={order} onChange={(e) => setOrder(parseInt(e.target.value))} className="w-full accent-emerald-500 h-[3px] bg-white/[0.05] rounded-full appearance-none cursor-pointer" /></div>)}
                    <TransformationGraph id={id} cutoff={cutoff} />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {['box_blur', 'gauss_blur', 'median', 'max', 'min'].includes(id) && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center"><span className="text-[11px] font-bold text-white/60 uppercase tracking-[0.15em]">Kernel Size</span><span className="text-xs font-mono bg-white/[0.05] border border-white/[0.08] text-white px-3 py-1.5 rounded-md">{ksize}x{ksize}</span></div>
                        <input type="range" min="3" max="15" step="2" value={ksize} onChange={(e) => setKsize(parseInt(e.target.value))} className="w-full accent-emerald-500 h-[3px] bg-white/[0.05] rounded-full appearance-none cursor-pointer" />
                      </div>
                    )}
                    {['median', 'max', 'min'].includes(id) && (
                      <div className="space-y-4 pt-4 border-t border-white/[0.05]"><div className="flex justify-between items-center"><span className="text-[11px] font-bold text-white/60 uppercase tracking-[0.15em]">Noise Level</span><span className="text-xs font-mono bg-white/[0.05] border border-white/[0.08] text-white px-3 py-1.5 rounded-md">{(noiseLevel * 100).toFixed(0)}%</span></div><input type="range" min="0.01" max="0.5" step="0.01" value={noiseLevel} onChange={(e) => setNoiseLevel(parseFloat(e.target.value))} className="w-full accent-emerald-500 h-[3px] bg-white/[0.05] rounded-full appearance-none cursor-pointer" /></div>
                    )}
                    {id === 'power' && (<div className="space-y-4"><div className="flex justify-between items-center"><span className="text-[11px] font-bold text-white/60 uppercase tracking-[0.15em]">Gamma (γ)</span><span className="text-xs font-mono bg-white/[0.05] border border-white/[0.08] text-white px-3 py-1.5 rounded-md">{gamma.toFixed(2)}</span></div><input type="range" min="0.1" max="5" step="0.1" value={gamma} onChange={(e) => setGamma(parseFloat(e.target.value))} className="w-full accent-emerald-500 h-[3px] bg-white/[0.05] rounded-full appearance-none cursor-pointer" /></div>)}
                    {id === 'threshold' && (<div className="space-y-4"><div className="flex justify-between items-center"><span className="text-[11px] font-bold text-white/60 uppercase tracking-[0.15em]">Cutoff (T)</span><span className="text-xs font-mono bg-white/[0.05] border border-white/[0.08] text-white px-3 py-1.5 rounded-md">{threshold}</span></div><input type="range" min="0" max="255" step="1" value={threshold} onChange={(e) => setThreshold(parseInt(e.target.value))} className="w-full accent-emerald-500 h-[3px] bg-white/[0.05] rounded-full appearance-none cursor-pointer" /></div>)}
                    {['negative', 'log', 'power', 'threshold', 'contrast', 'piecewise', 'hist_stretch'].includes(id) && (<div className="pt-4 border-t border-white/[0.05]"><TransformationGraph id={id} gamma={gamma} threshold={threshold} /></div>)}
                  </div>
                )}
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-[11px] text-emerald-400/80 italic font-medium leading-relaxed flex gap-3"><Activity className="size-4 shrink-0" /> Academic Hardware Acceleration active.</div>
              </div>
            ) : <div className="text-center py-10 text-muted-foreground text-xs italic">Upload stream to initialize</div>}
          </CardContent></Card>
        </div>
      </div>
    </motion.div>
  )
}
