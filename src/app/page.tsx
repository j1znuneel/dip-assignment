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
import { Upload, Image as ImageIcon, Sparkles, Plus } from 'lucide-react'
import { motion, AnimatePresence } from "framer-motion"

const modules = {
  negative: {
    title: "Image Negative",
    description: "Inverts the intensity levels of the image domain to produce a spectral negative.",
    theory: "The negative of an image with intensity levels in the range [0, L-1] is obtained by using the negative transformation, which is given by the expression s = L - 1 - r. This transformation reverses the intensity levels of an image, which is useful for enhancing white or gray detail embedded in dark regions of an image.",
    formula: "s = (L - 1) - r",
    pythonCode: `import cv2
import numpy as np

def image_negative(image):
    # s = L - 1 - r
    negative_img = 255 - image
    return negative_img

# Usage
img = cv2.imread('input.jpg')
result = image_negative(img)
cv2.imwrite('output.jpg', result)`
  },
  log: {
    title: "Log Transformation",
    description: "Expands the dark pixel range while compressing high-level intensity values.",
    theory: "Log transformations are used to expand the values of dark pixels in an image while compressing the higher-level values. This is particularly useful when the dynamic range of the data exceeds the capability of the display device (e.g., Fourier spectrum).",
    formula: "s = c * log(1 + r)",
    pythonCode: `import cv2
import numpy as np

def log_transform(image):
    # s = c * log(1 + r)
    c = 255 / np.log(1 + np.max(image))
    log_image = c * (np.log(image + 1))
    
    log_image = np.array(log_image, dtype = np.uint8)
    return log_image

# Usage
img = cv2.imread('input.jpg')
result = log_transform(img)
cv2.imwrite('output.jpg', result)`
  },
  power: {
    title: "Power Law",
    description: "Applies gamma correction to adjust the intensity mapping curve of the input stream.",
    theory: "Power-law transformations have the basic form s = c * r^γ. This transformation is used for gamma correction. By varying γ, we can either enhance dark regions (γ < 1) or compress them (γ > 1). Many display devices have a power-law response, and gamma correction is used to counteract this effect.",
    formula: "s = c * r^γ",
    pythonCode: `import cv2
import numpy as np

def gamma_transform(image, gamma=1.0):
    # s = c * r^γ
    image_norm = image / 255.0
    gamma_corrected = np.power(image_norm, gamma)
    
    return np.array(gamma_corrected * 255, dtype=np.uint8)

# Usage
img = cv2.imread('input.jpg')
result = gamma_transform(img, gamma=2.2)
cv2.imwrite('output.jpg', result)`
  },
  contrast: {
    title: "Contrast Stretching",
    description: "Expands the range of intensity levels in an image to span the full available spectrum.",
    theory: "Contrast stretching is a simple piecewise linear transformation that expands the range of intensity levels in an image so that it spans the full intensity range of the recording medium or display device. It increases the dynamic range of the gray levels in the image being processed.",
    formula: "s = (r - min) * (255 / (max - min))",
    pythonCode: `import cv2
import numpy as np

def contrast_stretching(image):
    # s = (r - min) * (255 / (max - min))
    xp = [np.min(image), np.max(image)]
    fp = [0, 255]
    x = np.arange(256)
    table = np.interp(x, xp, fp).astype('uint8')
    stretched = cv2.LUT(image, table)
    return stretched

# Usage
img = cv2.imread('input.jpg')
result = contrast_stretching(img)
cv2.imwrite('output.jpg', result)`
  },
  threshold: {
    title: "Thresholding",
    description: "Converts an image into a binary representation based on a specific intensity cutoff.",
    theory: "Thresholding is the simplest method of image segmentation. From a grayscale image, thresholding can be used to create binary images. If the intensity of a pixel r is greater than a threshold T, the output is 1 (white), otherwise it is 0 (black).",
    formula: "s = 1 if r > T else 0",
    pythonCode: `import cv2
import numpy as np

def thresholding(image, T=127):
    # s = 255 if r > T else 0
    _, thresh_img = cv2.threshold(image, T, 255, cv2.THRESH_BINARY)
    return thresh_img

# Usage
img = cv2.imread('input.jpg', 0) # Grayscale
result = thresholding(img, T=128)
cv2.imwrite('output.jpg', result)`
  },
  piecewise: {
    title: "Piecewise Linear",
    description: "Applies different linear transformations to specific intensity ranges for selective enhancement.",
    theory: "Piecewise-linear transformation functions can be arbitrarily complex. They are used to implement operations like contrast stretching, intensity-level slicing, and bit-plane slicing. A common form is to increase contrast in a specific range [r1, r2] while leaving other ranges unchanged.",
    formula: "s = f(r) in segments",
    pythonCode: `import cv2
import numpy as np

def piecewise_linear(image, r1, s1, r2, s2):
    # Define the mapping function
    def pixel_map(pixel):
        if 0 <= pixel <= r1:
            return (s1 / r1) * pixel
        elif r1 < pixel <= r2:
            return ((s2 - s1) / (r2 - r1)) * (pixel - r1) + s1
        else:
            return ((255 - s2) / (255 - r2)) * (pixel - r2) + s2

    # Vectorize and apply
    vec_pixel_map = np.vectorize(pixel_map)
    stretched = vec_pixel_map(image).astype('uint8')
    return stretched

# Usage
img = cv2.imread('input.jpg')
result = piecewise_linear(img, 70, 0, 200, 255)
cv2.imwrite('output.jpg', result)`
  }
}

export default function DIPPage() {
  const [activeModule, setActiveModule] = useState<string>('negative')
  const [image, setImage] = useState<string | null>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setImage(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const currentModule = modules[activeModule as keyof typeof modules]

  return (
    <SidebarProvider>
      <DIPSidebar activeModule={activeModule} setActiveModule={setActiveModule} />
      <SidebarInset className="bg-[#0c0d0e]">
        <header className="flex h-16 shrink-0 items-center gap-2 px-8 border-b border-white/[0.05] sticky top-0 bg-[#0c0d0e]/80 backdrop-blur-xl z-10">
          <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-white transition-colors" />
          <Separator orientation="vertical" className="mr-2 h-4 bg-white/[0.1]" />
          <div className="flex flex-1 items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">Projects</span>
              <Separator orientation="vertical" className="h-3 mx-1 bg-white/[0.1]" />
              <span className="text-sm font-semibold text-white/90">{currentModule.title}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <input
                type="file"
                id="image-upload"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 border-white/[0.08] bg-white/[0.02] text-white hover:bg-white/[0.05] h-8 px-4 text-xs"
                asChild
              >
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Plus className="size-3.5" />
                  New Stream
                </label>
              </Button>
            </div>
          </div>
        </header>
        
        <main className="flex-1 p-8 lg:p-12 overflow-y-auto">
          {!image && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-10"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/20 blur-[60px] rounded-full animate-pulse" />
                <div className="relative size-32 rounded-[2.5rem] bg-gradient-to-b from-white/[0.08] to-transparent flex items-center justify-center border border-white/[0.1] shadow-2xl">
                  <ImageIcon className="size-12 text-white/20" />
                </div>
              </div>
              
              <div className="space-y-4">
                <h1 className="text-5xl font-bold tracking-tighter text-white">
                  Design the invisible.
                </h1>
                <p className="text-muted-foreground max-w-[500px] text-lg font-medium leading-relaxed">
                  AetherDIP provides the precision tools needed for advanced image domain transformations.
                </p>
              </div>
              
              <Button size="lg" className="gap-3 px-10 h-14 text-sm font-bold rounded-full bg-white text-black hover:bg-white/90 transition-all duration-300 shadow-[0_20px_40px_-15px_rgba(255,255,255,0.2)]" asChild>
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Upload className="size-4" />
                  Initialize Workspace
                </label>
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
