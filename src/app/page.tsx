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
import { Upload, Image as ImageIcon, Sparkles } from 'lucide-react'

const modules = {
  negative: {
    title: "Image Negative",
    description: "Reverses the intensity levels of an image to produce a photographic negative.",
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
    description: "Maps a narrow range of low intensity input values into a wider range of output levels.",
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
    title: "Power Law (Gamma)",
    description: "Gamma correction is used to adjust the brightness of an image using a power function.",
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
      <SidebarInset className="bg-background">
        <header className="flex h-16 shrink-0 items-center gap-2 px-6 border-b border-border/50 sticky top-0 bg-background/80 backdrop-blur-md z-10">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-emerald-500 animate-pulse" />
              <span className="text-sm font-medium text-muted-foreground">Workspace</span>
              <Separator orientation="vertical" className="h-3 mx-1" />
              <span className="text-sm font-semibold">{currentModule.title}</span>
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
                className="gap-2 border-emerald-500/20 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                asChild
              >
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Upload className="size-4" />
                  Upload Image
                </label>
              </Button>
            </div>
          </div>
        </header>
        
        <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
          {!image && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6"
            >
              <div className="size-24 rounded-3xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_30px_-10px_rgba(16,185,129,0.3)]">
                <ImageIcon className="size-12 text-emerald-500" />
              </div>
              <div className="space-y-2">
                <h1 className="text-4xl font-black tracking-tight bg-gradient-to-b from-foreground to-muted-foreground bg-clip-text text-transparent">
                  AetherDIP
                </h1>
                <p className="text-muted-foreground max-w-[450px] text-lg">
                  Advanced workspace for Digital Image Processing theory and practice.
                </p>
              </div>
              <Button size="lg" className="gap-2 px-8 h-12 text-md rounded-full bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/20" asChild>
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Upload className="size-5" />
                  Upload to Begin
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
