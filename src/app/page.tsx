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
  // POINT TRANSFORMATIONS
  negative: { 
    title: "Image Negative", 
    description: "Inverts intensity levels to produce a spectral negative.", 
    theory: "s = (L-1) - r. Reverses the intensity levels of an image.", 
    formula: "s = 255 - r", 
    pythonCode: `import cv2
import numpy as np
import matplotlib.pyplot as plt

def apply_negative(img):
    return 255 - img

# Load image
img = cv2.imread('input.jpg', 0)
result = apply_negative(img)

# Show results
cv2.imshow('Original', img)
cv2.imshow('Negative', result)
cv2.waitKey(0)
cv2.destroyAllWindows()` 
  },
  log: { 
    title: "Log Transform", 
    description: "Expands dark pixels while compressing high intensities.", 
    theory: "s = c * log(1 + r). Useful for visualizing wide dynamic ranges.", 
    formula: "s = c * log(1 + r)", 
    pythonCode: `import cv2
import numpy as np

def apply_log(img):
    c = 255 / np.log(1 + np.max(img))
    log_img = c * (np.log(1 + img))
    return log_img.astype(np.uint8)

img = cv2.imread('input.jpg', 0)
result = apply_log(img)

cv2.imshow('Log Transform', result)
cv2.waitKey(0)` 
  },
  power: { 
    title: "Power Law (Gamma)", 
    description: "Adjusts brightness using a power function.", 
    theory: "s = c * r^γ. Used for gamma correction in monitors and cameras.", 
    formula: "s = c * r^γ", 
    pythonCode: `import cv2
import numpy as np

def apply_gamma(img, gamma=1.0):
    invGamma = 1.0 / gamma
    table = np.array([((i / 255.0) ** invGamma) * 255
        for i in np.arange(0, 256)]).astype("uint8")
    return cv2.LUT(img, table)

img = cv2.imread('input.jpg')
result = apply_gamma(img, gamma=2.2)

cv2.imshow('Gamma Corrected', result)
cv2.waitKey(0)` 
  },
  threshold: { 
    title: "Thresholding", 
    description: "Binary image segmentation.", 
    theory: "s = 255 if r > T else 0. Simplest image segmentation method.", 
    formula: "s = 255 if r > T else 0", 
    pythonCode: `import cv2

def apply_threshold(img, T=127):
    ret, thresh = cv2.threshold(img, T, 255, cv2.THRESH_BINARY)
    return thresh

img = cv2.imread('input.jpg', 0)
result = apply_threshold(img, 128)

cv2.imshow('Thresholded', result)
cv2.waitKey(0)` 
  },

  // LINEAR & HISTOGRAM
  contrast: { 
    title: "Contrast Stretch", 
    description: "Expands dynamic range to [0, 255].", 
    theory: "Linearly scales the intensity levels to occupy the full spectrum.", 
    formula: "s = (r - min)/(max - min) * 255", 
    pythonCode: `import cv2
import numpy as np

def contrast_stretch(img):
    r_min, r_max = np.min(img), np.max(img)
    stretched = (img - r_min) * (255 / (r_max - r_min))
    return stretched.astype(np.uint8)

img = cv2.imread('input.jpg')
result = contrast_stretch(img)

cv2.imshow('Stretched', result)
cv2.waitKey(0)` 
  },
  hist_stretch: { 
    title: "Hist Stretching", 
    description: "Global range scaling.", 
    theory: "Normalization technique to improve contrast by stretching intensities.", 
    formula: "s = T(r) linear", 
    pythonCode: `import cv2

# Using OpenCV built-in normalize
img = cv2.imread('input.jpg')
result = cv2.normalize(img, None, 0, 255, cv2.NORM_MINMAX)

cv2.imshow('Histogram Stretched', result)
cv2.waitKey(0)` 
  },
  piecewise: { 
    title: "Piecewise Linear", 
    description: "Selective range enhancement.", 
    theory: "Applies different linear functions to specific intensity ranges.", 
    formula: "s = segments(r)", 
    pythonCode: `import cv2
import numpy as np

def piecewise_linear(img, r1, s1, r2, s2):
    def pixel_map(p):
        if 0 <= p <= r1: return (s1/r1)*p
        elif r1 < p <= r2: return ((s2-s1)/(r2-r1))*(p-r1)+s1
        else: return ((255-s2)/(255-r2))*(p-r2)+s2
    vec_map = np.vectorize(pixel_map)
    return vec_map(img).astype(np.uint8)

img = cv2.imread('input.jpg')
result = piecewise_linear(img, 70, 20, 180, 230)
cv2.imshow('Piecewise', result)
cv2.waitKey(0)` 
  },
  hist_eq: { 
    title: "Hist Equalization", 
    description: "Uniform intensity distribution.", 
    theory: "Maximizes contrast via CDF mapping to achieve a uniform histogram.", 
    formula: "s = (L-1) * CDF(r)", 
    pythonCode: `import cv2

def histogram_equalization(img):
    if len(img.shape) == 3:
        ycrcb = cv2.cvtColor(img, cv2.COLOR_BGR2YCrCb)
        ycrcb[:,:,0] = cv2.equalizeHist(ycrcb[:,:,0])
        return cv2.cvtColor(ycrcb, cv2.COLOR_YCrCb2BGR)
    return cv2.equalizeHist(img)

img = cv2.imread('input.jpg')
result = histogram_equalization(img)
cv2.imshow('Equalized', result)
cv2.waitKey(0)` 
  },

  // SPATIAL FILTERING
  box_blur: { 
    title: "Box Blur", 
    description: "Smoothing via neighborhood averaging.", 
    theory: "A spatial lowpass filter where all coefficients are equal.", 
    formula: "s = mean(neighborhood)", 
    pythonCode: `import cv2

img = cv2.imread('input.jpg')
result = cv2.blur(img, (5, 5))

cv2.imshow('Box Blur', result)
cv2.waitKey(0)` 
  },
  gauss_blur: { 
    title: "Gaussian Blur", 
    description: "Bell-curve smoothing.", 
    theory: "Effective noise reduction while preserving edges better than box blur.", 
    formula: "G(x,y) kernel", 
    pythonCode: `import cv2

img = cv2.imread('input.jpg')
result = cv2.GaussianBlur(img, (5, 5), 0)

cv2.imshow('Gaussian Blur', result)
cv2.waitKey(0)` 
  },
  laplacian: { 
    title: "Laplacian Filter", 
    description: "Second-order sharpening.", 
    theory: "Highlights regions of rapid intensity change. Isotropic measure.", 
    formula: "∇²f", 
    pythonCode: `import cv2
import numpy as np

img = cv2.imread('input.jpg', 0)
lap = cv2.Laplacian(img, cv2.CV_64F)
result = cv2.convertScaleAbs(lap)

cv2.imshow('Laplacian Edges', result)
cv2.waitKey(0)` 
  },
  sobel: { 
    title: "Sobel Operator", 
    description: "Directional gradient detection.", 
    theory: "Uses kernels to approximate horizontal and vertical gradients.", 
    formula: "G = √[Gx²+Gy²]", 
    pythonCode: `import cv2
import numpy as np

img = cv2.imread('input.jpg', 0)
gx = cv2.Sobel(img, cv2.CV_64F, 1, 0, ksize=3)
gy = cv2.Sobel(img, cv2.CV_64F, 0, 1, ksize=3)
mag = np.sqrt(gx**2 + gy**2)
result = cv2.convertScaleAbs(mag)

cv2.imshow('Sobel Magnitude', result)
cv2.waitKey(0)` 
  },

  // FREQUENCY DOMAIN LPF
  ideal_lpf: { 
    title: "Ideal LPF", 
    description: "Sharp frequency domain blur.", 
    theory: "Suppresses all frequency components outside a radius D0.", 
    formula: "H = 1 if D ≤ D0", 
    pythonCode: `import cv2
import numpy as np

def ideal_lpf(img, d0):
    f = np.fft.fftshift(np.fft.fft2(img))
    rows, cols = img.shape
    u, v = np.meshgrid(np.arange(rows), np.arange(cols), indexing='ij')
    mask = (np.sqrt((u-rows//2)**2 + (v-cols//2)**2) <= d0)
    return np.abs(np.fft.ifft2(np.fft.ifftshift(f * mask))).astype(np.uint8)

img = cv2.imread('input.jpg', 0)
result = ideal_lpf(img, 30)
cv2.imshow('Ideal LPF', result)
cv2.waitKey(0)` 
  },
  butter_lpf: { 
    title: "Butterworth LPF", 
    description: "Smooth lowpass cutoff.", 
    theory: "Transition region between passed and suppressed frequencies is smooth.", 
    formula: "H = 1/[1+(D/D0)^2n]", 
    pythonCode: `import numpy as np
import cv2

def butterworth_lpf(img, d0, n=2):
    f = np.fft.fftshift(np.fft.fft2(img))
    rows, cols = img.shape
    u, v = np.meshgrid(np.arange(rows), np.arange(cols), indexing='ij')
    dist = np.sqrt((u-rows//2)**2 + (v-cols//2)**2)
    mask = 1 / (1 + (dist / d0)**(2 * n))
    return np.abs(np.fft.ifft2(np.fft.ifftshift(f * mask))).astype(np.uint8)

img = cv2.imread('input.jpg', 0)
result = butterworth_lpf(img, 30, 2)
cv2.imshow('Butterworth LPF', result)
cv2.waitKey(0)` 
  },
  gauss_lpf: { 
    title: "Gaussian LPF", 
    description: "Perfectly smooth blur.", 
    theory: "No ringing artifacts. Perfectly smooth in frequency and spatial domains.", 
    formula: "H = e^(-D²/2D0²)", 
    pythonCode: `import numpy as np
import cv2

def gaussian_lpf(img, d0):
    f = np.fft.fftshift(np.fft.fft2(img))
    rows, cols = img.shape
    u, v = np.meshgrid(np.arange(rows), np.arange(cols), indexing='ij')
    dist = np.sqrt((u-rows//2)**2 + (v-cols//2)**2)
    mask = np.exp(-(dist**2) / (2 * (d0**2)))
    return np.abs(np.fft.ifft2(np.fft.ifftshift(f * mask))).astype(np.uint8)

img = cv2.imread('input.jpg', 0)
result = gaussian_lpf(img, 30)
cv2.imshow('Gaussian LPF', result)
cv2.waitKey(0)` 
  },

  // FREQUENCY DOMAIN HPF
  ideal_hpf: { 
    title: "Ideal HPF", 
    description: "Sharp frequency domain sharpening.", 
    theory: "Suppresses all low-frequency components within radius D0.", 
    formula: "H = 0 if D ≤ D0", 
    pythonCode: `import numpy as np
import cv2

def ideal_hpf(img, d0):
    f = np.fft.fftshift(np.fft.fft2(img))
    rows, cols = img.shape
    u, v = np.meshgrid(np.arange(rows), np.arange(cols), indexing='ij')
    mask = (np.sqrt((u-rows//2)**2 + (v-cols//2)**2) > d0)
    return np.abs(np.fft.ifft2(np.fft.ifftshift(f * mask))).astype(np.uint8)

img = cv2.imread('input.jpg', 0)
result = ideal_hpf(img, 30)
cv2.imshow('Ideal HPF', result)
cv2.waitKey(0)` 
  },
  butter_hpf: { 
    title: "Butterworth HPF", 
    description: "Smooth highpass sharpness.", 
    theory: "Controlled sharpening with adjustable transition region.", 
    formula: "H = 1/[1+(D0/D)^2n]", 
    pythonCode: `import numpy as np
import cv2

def butterworth_hpf(img, d0, n=2):
    f = np.fft.fftshift(np.fft.fft2(img))
    rows, cols = img.shape
    u, v = np.meshgrid(np.arange(rows), np.arange(cols), indexing='ij')
    dist = np.sqrt((u-rows//2)**2 + (v-cols//2)**2)
    # Avoid div by zero
    mask = 1 / (1 + (d0 / np.maximum(dist, 0.1))**(2 * n))
    return np.abs(np.fft.ifft2(np.fft.ifftshift(f * mask))).astype(np.uint8)

img = cv2.imread('input.jpg', 0)
result = butterworth_hpf(img, 30, 2)
cv2.imshow('Butterworth HPF', result)
cv2.waitKey(0)` 
  },
  gauss_hpf: { 
    title: "Gaussian HPF", 
    description: "Smooth frequency sharpening.", 
    theory: "Fine sharpening without introducing ringing artifacts.", 
    formula: "H = 1 - e^(-D²/2D0²)", 
    pythonCode: `import numpy as np
import cv2

def gaussian_hpf(img, d0):
    f = np.fft.fftshift(np.fft.fft2(img))
    rows, cols = img.shape
    u, v = np.meshgrid(np.arange(rows), np.arange(cols), indexing='ij')
    dist = np.sqrt((u-rows//2)**2 + (v-cols//2)**2)
    mask = 1 - np.exp(-(dist**2) / (2 * (d0**2)))
    return np.abs(np.fft.ifft2(np.fft.ifftshift(f * mask))).astype(np.uint8)

img = cv2.imread('input.jpg', 0)
result = gaussian_hpf(img, 30)
cv2.imshow('Gaussian HPF', result)
cv2.waitKey(0)` 
  },

  // RESTORATION
  median: { 
    title: "Median Filter", 
    description: "Salt & Pepper removal.", 
    theory: "Replaces each pixel with the median of its neighborhood.", 
    formula: "s = median(R)", 
    pythonCode: `import cv2

img = cv2.imread('input.jpg')
# Add S&P noise simulation here if needed
result = cv2.medianBlur(img, 5)

cv2.imshow('Median Restored', result)
cv2.waitKey(0)` 
  },
  max: { 
    title: "Max Filter", 
    description: "Pepper noise removal.", 
    theory: "Order statistic filter (100th percentile). Removes dark impulses.", 
    formula: "s = max(R)", 
    pythonCode: `from scipy import ndimage
import cv2

img = cv2.imread('input.jpg', 0)
result = ndimage.maximum_filter(img, size=3)

cv2.imshow('Max Filtered', result)
cv2.waitKey(0)` 
  },
  min: { 
    title: "Min Filter", 
    description: "Salt noise removal.", 
    theory: "Order statistic filter (0th percentile). Removes bright impulses.", 
    formula: "s = min(R)", 
    pythonCode: `from scipy import ndimage
import cv2

img = cv2.imread('input.jpg', 0)
result = ndimage.minimum_filter(img, size=3)

cv2.imshow('Min Filtered', result)
cv2.waitKey(0)` 
  }
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
            <div className="flex items-center gap-2"><span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 text-nowrap">AetherDIP Engine</span><Separator orientation="vertical" className="h-3 mx-1 bg-white/[0.1]" /><span className="text-sm font-semibold text-white/90 truncate">{currentModule.title}</span></div>
            <div className="flex items-center gap-3"><input type="file" id="image-upload" className="hidden" accept="image/*" onChange={handleImageUpload} /><Button variant="outline" size="sm" className="gap-2 border-white/[0.08] bg-white/[0.02] text-white hover:bg-white/[0.05] h-8 px-4 text-xs" asChild><label htmlFor="image-upload" className="cursor-pointer text-nowrap"><Plus className="size-3.5" /> Load Workspace</label></Button></div>
          </div>
        </header>
        <main className="flex-1 p-8 lg:p-12 overflow-y-auto">
          {!image && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-10">
              <div className="relative"><div className="absolute inset-0 bg-emerald-500/20 blur-[60px] rounded-full animate-pulse" /><div className="relative size-32 rounded-[2.5rem] bg-gradient-to-b from-white/[0.08] to-transparent flex items-center justify-center border border-white/[0.1] shadow-2xl"><ImageIcon className="size-12 text-white/20" /></div></div>
              <div className="space-y-4"><h1 className="text-5xl font-bold tracking-tighter text-white text-nowrap">Academic Engine.</h1><p className="text-muted-foreground max-w-[500px] text-lg font-medium leading-relaxed">Advanced Digital Image Processing workspace for theory and implementation.</p></div>
              <Button size="lg" className="gap-3 px-10 h-14 text-sm font-bold rounded-full bg-white text-black hover:bg-white/90" asChild><label htmlFor="image-upload" className="cursor-pointer"><Upload className="size-4" /> Load Image</label></Button>
            </motion.div>
          )}
          <AnimatePresence mode="wait">
            {image && (
              <TransformationModule key={activeModule} id={activeModule} title={currentModule.title} description={currentModule.description} theory={currentModule.theory} formula={currentModule.formula} pythonCode={currentModule.pythonCode} image={image} />
            )}
          </AnimatePresence>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
