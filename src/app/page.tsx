"use client"

import React, { useState } from 'react'
import { DIPSidebar } from '@/components/dip-sidebar'
import { TransformationModule } from '@/components/transformation-module'
import { 
  SidebarProvider, 
  SidebarInset, 
  SidebarTrigger 
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Upload, Image as ImageIcon, Plus } from 'lucide-react'
import { motion, AnimatePresence } from "framer-motion"

const modules = {
  negative: {
    title: "Image Negative",
    description: "Inverts intensity levels to produce a spectral negative.",
    theory: "Reverses the intensity levels of an image. Suitable for enhancing white or gray detail embedded in dark regions.",
    formula: "s = (L - 1) - r",
    pythonCode: "def negative(img): return 255 - img"
  },
  log: {
    title: "Log Transformation",
    description: "Expands dark pixels while compressing high-level intensities.",
    theory: "Maps a narrow range of low intensity input values into a wider range of output levels. Used to compress the dynamic range.",
    formula: "s = c * log(1 + r)",
    pythonCode: "def log_transform(img): c = 255 / np.log(1 + np.max(img)); return (c * np.log(1 + img)).astype(np.uint8)"
  },
  power: {
    title: "Power Law (Gamma)",
    description: "Adjusts intensity mapping using a power-law curve.",
    theory: "Used for gamma correction. Maps a narrow range of dark input values into a wider range of output values.",
    formula: "s = c * r^γ",
    pythonCode: "def gamma_transform(img, g): return (255 * (img / 255)**g).astype(np.uint8)"
  },
  threshold: {
    title: "Thresholding",
    description: "Converts image to binary representation.",
    theory: "Simplest method of image segmentation. Creates binary images from grayscale based on intensity cutoff.",
    formula: "s = 255 if r > T else 0",
    pythonCode: "_, thresh = cv2.threshold(img, T, 255, cv2.THRESH_BINARY)"
  },
  contrast: {
    title: "Contrast Stretching",
    description: "Expands intensity levels to span the full spectrum.",
    theory: "Linearly scales the dynamic range of an image to use the full intensity range [0, 255].",
    formula: "s = (r - min) * (255 / (max - min))",
    pythonCode: "def stretch(img): return cv2.normalize(img, None, 0, 255, cv2.NORM_MINMAX)"
  },
  piecewise: {
    title: "Piecewise Linear",
    description: "Selective intensity enhancement in specific ranges.",
    theory: "Applies different linear transformations to segments of the intensity scale for localized enhancement.",
    formula: "s = f(r) in segments",
    pythonCode: "# Define mapping for segments (r1, s1) to (r2, s2)"
  },
  hist_eq: {
    title: "Histogram Equalization",
    description: "Maximizes global contrast via CDF flattening.",
    theory: "Redistributes intensities to achieve a uniform histogram through cumulative distribution mapping.",
    formula: "s = (L-1) * CDF(r)",
    pythonCode: "def equalize(img): return cv2.equalizeHist(img)"
  },
  box_blur: {
    title: "Box Blur (Smoothing)",
    description: "Local neighborhood averaging for noise reduction.",
    theory: "Replaces each pixel with the mean of its neighbors. Suppresses high-frequency noise.",
    formula: "s = (1/k²) Σ Σ r(i,j)",
    pythonCode: "def blur(img, k): return cv2.blur(img, (k,k))"
  },
  gauss_blur: {
    title: "Gaussian Blur",
    description: "Smooth blurring using bell-curve distribution.",
    theory: "Effectively reduces high-frequency noise with better edge preservation than a box filter.",
    formula: "G(x,y) = (1/2πσ²)e^{-(x²+y²)/2σ²}",
    pythonCode: "def gauss(img, k): return cv2.GaussianBlur(img, (k,k), 0)"
  },
  laplacian: {
    title: "Laplacian Filter",
    description: "Second-order derivative for sharpening.",
    theory: "Highlights regions of rapid intensity change. Used for edge detection and sharpening.",
    formula: "∇²f = ∂²f/∂x² + ∂²f/∂y²",
    pythonCode: "def laplacian(img): return cv2.Laplacian(img, cv2.CV_64F)"
  },
  sobel: {
    title: "Sobel Operator",
    description: "First-order directional derivative detection.",
    theory: "Directional gradient detection in horizontal and vertical orientations.",
    formula: "G = √[G_x² + G_y²]",
    pythonCode: "gx = cv2.Sobel(img, cv2.CV_64F, 1, 0); gy = cv2.Sobel(img, cv2.CV_64F, 0, 1)"
  },
  ideal_lpf: { title: "Ideal LPF", description: "Frequency domain sharp cutoff blur.", theory: "Suppresses frequencies outside radius D0.", formula: "H(u,v) = 1 if D ≤ D0", pythonCode: "mask = dist <= d0" },
  ideal_hpf: { title: "Ideal HPF", description: "Frequency domain edge enhancement.", theory: "Suppresses low frequencies within radius D0.", formula: "H(u,v) = 0 if D ≤ D0", pythonCode: "mask = dist > d0" },
  median: { title: "Median Filter", description: "Restoration of Salt & Pepper noise.", theory: "Non-linear neighborhood median replacement.", formula: "s = median({neighbors})", pythonCode: "res = cv2.medianBlur(img, k)" },
  max: { title: "Max / Min Filter", description: "Impulse noise removal.", theory: "Order-statistic filters using extremes.", formula: "s = max(R) | min(R)", pythonCode: "res = ndimage.maximum_filter(img, size=k)" }
}

export default function DIPPage() {
  const [activeModule, setActiveModule] = useState<string>('negative')
  const [image, setImage] = useState<string | null>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => setImage(event.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const currentModule = modules[activeModule as keyof typeof modules] || modules.negative

  return (
    <SidebarProvider>
      <DIPSidebar activeModule={activeModule} setActiveModule={setActiveModule} />
      <SidebarInset className="bg-[#0c0d0e]">
        <header className="flex h-16 shrink-0 items-center gap-2 px-8 border-b border-white/[0.05] sticky top-0 bg-[#0c0d0e]/80 backdrop-blur-xl z-10">
          <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-white transition-colors" />
          <Separator orientation="vertical" className="mr-2 h-4 bg-white/[0.1]" />
          <div className="flex flex-1 items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 text-nowrap">AetherDIP Engine</span>
              <Separator orientation="vertical" className="h-3 mx-1 bg-white/[0.1]" />
              <span className="text-sm font-semibold text-white/90 truncate">{currentModule.title}</span>
            </div>
            <div className="flex items-center gap-3">
              <input type="file" id="image-upload" className="hidden" accept="image/*" onChange={handleImageUpload} />
              <Button variant="outline" size="sm" className="gap-2 border-white/[0.08] bg-white/[0.02] text-white hover:bg-white/[0.05] h-8 px-4 text-xs" asChild>
                <label htmlFor="image-upload" className="cursor-pointer text-nowrap"><Plus className="size-3.5" /> Initialize Stream</label>
              </Button>
            </div>
          </div>
        </header>
        <main className="flex-1 p-8 lg:p-12 overflow-y-auto">
          {!image && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-10">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/20 blur-[60px] rounded-full animate-pulse" />
                <div className="relative size-32 rounded-[2.5rem] bg-gradient-to-b from-white/[0.08] to-transparent flex items-center justify-center border border-white/[0.1] shadow-2xl">
                  <ImageIcon className="size-12 text-white/20" />
                </div>
              </div>
              <div className="space-y-4">
                <h1 className="text-5xl font-bold tracking-tighter text-white">Advanced DIP.</h1>
                <p className="text-muted-foreground max-w-[500px] text-lg font-medium leading-relaxed">Real-time digital image processing engine for theoretical modeling and research.</p>
              </div>
              <Button size="lg" className="gap-3 px-10 h-14 text-sm font-bold rounded-full bg-white text-black hover:bg-white/90" asChild>
                <label htmlFor="image-upload" className="cursor-pointer"><Upload className="size-4" /> Load Workspace</label>
              </Button>
            </motion.div>
          )}
          <AnimatePresence mode="wait">
            {image && (
              <TransformationModule
                key={activeModule}
                id={activeModule}
                title={currentModule.title}
                description={currentModule.description}
                theory={currentModule.theory}
                formula={currentModule.formula}
                pythonCode={currentModule.pythonCode}
                image={image}
              />
            )}
          </AnimatePresence>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
