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
  threshold: {
    title: "Thresholding",
    description: "Converts an image into a binary representation based on a specific intensity cutoff.",
    theory: "Thresholding is the simplest method of image segmentation. From a grayscale image, thresholding can be used to create binary images. If the intensity of a pixel r is greater than a threshold T, the output is 1 (white), otherwise it is 0 (black).",
    formula: "s = 255 if r > T else 0",
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
  hist_stretch: {
    title: "Histogram Stretching",
    description: "Linearly maps the dynamic range of an image to the full [0, 255] spectrum.",
    theory: "Histogram stretching (normalization) improves the contrast in an image by stretching the range of intensity values it contains. Unlike contrast stretching which can be piecewise, histogram stretching usually refers to the linear scaling of the entire range from [min, max] to [0, 255].",
    formula: "s = (r - r_min) * (255 / (r_max - r_min))",
    pythonCode: `import cv2
import numpy as np

def hist_stretch(image):
    # Linear Normalization
    res = cv2.normalize(image, None, 0, 255, cv2.NORM_MINMAX)
    return res

# Usage
img = cv2.imread('input.jpg')
result = hist_stretch(img)
cv2.imwrite('output.jpg', result)`
  },
  hist_eq: {
    title: "Histogram Equalization",
    description: "Uses cumulative distribution to flatten the intensity histogram, maximizing global contrast.",
    theory: "Histogram Equalization is a method in image processing of contrast adjustment using the image's histogram. It maps the intensity levels to a new set of levels such that the resulting histogram is approximately flat (uniform). This is achieved by using the Cumulative Distribution Function (CDF) as a transformation function.",
    formula: "s = (L-1) * CDF(r)",
    pythonCode: `import cv2
import numpy as np

def hist_equalization(image):
    # Equalize the histogram of the Y channel in YUV for color images
    if len(image.shape) == 3:
        img_yuv = cv2.cvtColor(image, cv2.COLOR_BGR2YUV)
        img_yuv[:,:,0] = cv2.equalizeHist(img_yuv[:,:,0])
        img_output = cv2.cvtColor(img_yuv, cv2.COLOR_YUV2BGR)
        return img_output
    else:
        return cv2.equalizeHist(image)

# Usage
img = cv2.imread('input.jpg')
result = hist_equalization(img)
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
  },
  box_blur: {
    title: "Box Blur (Smoothing)",
    description: "Smooths an image by replacing each pixel value with the average of its neighbors in a square kernel.",
    theory: "Smoothing filters are used for blurring and for noise reduction. Blurring is used in preprocessing tasks, such as removal of small details from an image prior to object extraction. A box filter is a spatial lowpass filter where all coefficients are equal (1/n^2).",
    formula: "s = (1/k^2) * Σ Σ r(i,j)",
    pythonCode: `import cv2
import numpy as np

def box_blur(image, ksize=5):
    # Apply average blur
    blur = cv2.blur(image, (ksize, ksize))
    return blur

# Usage
img = cv2.imread('input.jpg')
result = box_blur(img, 5)
cv2.imwrite('output.jpg', result)`
  },
  gaussian: {
    title: "Gaussian Blur",
    description: "Applies a Gaussian kernel to smooth an image, effectively reducing high-frequency noise.",
    theory: "Gaussian filtering is a linear filtering process used to blur images and reduce noise. It uses a kernel based on the Gaussian distribution (bell curve). It is more effective at preserving edges than a box filter for the same amount of blurring.",
    formula: "G(x,y) = (1/2πσ^2) * e^-(x^2+y^2)/2σ^2",
    pythonCode: `import cv2
import numpy as np

def gaussian_blur(image, ksize=5, sigma=1.0):
    # Apply Gaussian blur
    blur = cv2.GaussianBlur(image, (ksize, ksize), sigma)
    return blur

# Usage
img = cv2.imread('input.jpg')
result = gaussian_blur(img, 5, 1.0)
cv2.imwrite('output.jpg', result)`
  },
  laplacian: {
    title: "Laplacian Filtering",
    description: "A second-order derivative filter used for edge detection and image sharpening.",
    theory: "The Laplacian is an isotropic measure of the 2nd spatial derivative of an image. The Laplacian of an image highlights regions of rapid intensity change and is therefore used for edge detection. It is often applied to an image that has first been smoothed with something like a Gaussian filter.",
    formula: "∇²f = ∂²f/∂x² + ∂²f/∂y²",
    pythonCode: `import cv2
import numpy as np

def laplacian_filter(image):
    # Apply Laplacian
    lap = cv2.Laplacian(image, cv2.CV_64F).astype('uint8')
    return lap

# Usage
img = cv2.imread('input.jpg', 0)
result = laplacian_filter(img)
cv2.imwrite('output.jpg', result)`
  },
  convolution: {
    title: "Correlation & Convolution",
    description: "Performs general spatial filtering using a custom or predefined kernel.",
    theory: "Convolution is the process of adding each element of the image to its local neighbors, weighted by the kernel. Correlation is similar but without flipping the kernel. In DIP, these are the fundamental operations for almost all spatial filters.",
    formula: "s(x,y) = Σ Σ w(i,j)f(x+i, y+j)",
    pythonCode: `import cv2
import numpy as np

def custom_convolution(image, kernel):
    # Apply filter2D for convolution
    res = cv2.filter2D(image, -1, kernel)
    return res

# Usage
img = cv2.imread('input.jpg')
kernel = np.array([[-1, -1, -1], [-1, 8, -1], [-1, -1, -1]]) # Sharpness
result = custom_convolution(img, kernel)
cv2.imwrite('output.jpg', result)`
  },
  median: {
    title: "Median (Order Static)",
    description: "Removes Salt & Pepper noise by replacing each pixel with the median of its neighborhood.",
    theory: "Median filtering is a non-linear digital filtering technique, often used to remove noise. Such noise reduction is a typical pre-processing step to improve the results of later processing. Median filtering is very effective at removing salt and pepper noise.",
    formula: "s = median({r(i,j)})",
    pythonCode: `import cv2
import numpy as np

def median_filter(image, ksize=5):
    # Add salt and pepper noise for demonstration
    # ... (noise addition logic)
    # Apply median blur
    res = cv2.medianBlur(image, ksize)
    return res

# Usage
img = cv2.imread('input.jpg')
result = median_filter(img, 5)
cv2.imwrite('output.jpg', result)`
  },
  max: {
    title: "Max Filter",
    description: "Replaces each pixel with the maximum value in its neighborhood, effective for removing pepper noise.",
    theory: "Order-statistic filters are spatial filters whose response is based on ordering the pixels contained in the image area encompassed by the filter. The 100th percentile (Max) filter is useful for finding the brightest points in an image and removing pepper noise.",
    formula: "s = max({r(i,j)})",
    pythonCode: `import cv2
import numpy as np
from scipy import ndimage

def max_filter(image, ksize=3):
    # Apply max filter
    res = ndimage.maximum_filter(image, size=ksize)
    return res

# Usage
img = cv2.imread('input.jpg')
result = max_filter(img, 3)
cv2.imwrite('output.jpg', result)`
  },
  min: {
    title: "Min Filter",
    description: "Replaces each pixel with the minimum value in its neighborhood, effective for removing salt noise.",
    theory: "The 0th percentile (Min) filter is useful for finding the darkest points in an image. It is effective for reducing salt noise (white impulses) by replacing them with the minimum intensity in the neighborhood.",
    formula: "s = min({r(i,j)})",
    pythonCode: `import cv2
import numpy as np
from scipy import ndimage

def min_filter(image, ksize=3):
    # Apply min filter
    res = ndimage.minimum_filter(image, size=ksize)
    return res

# Usage
img = cv2.imread('input.jpg')
result = min_filter(img, 3)
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
