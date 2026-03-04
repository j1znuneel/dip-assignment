"use client"

import React from 'react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'

interface GraphProps {
  id: string
  gamma?: number
  threshold?: number
  cutoff?: number
}

export function TransformationGraph({ id, gamma = 1.0, threshold = 127, cutoff = 30 }: GraphProps) {
  // FREQUENCY DOMAIN CIRCLE VISUALIZATION
  if (id.includes('_lpf') || id.includes('_hpf')) {
    const isHPF = id.includes('_hpf')
    const isButter = id.includes('butter')
    const isGauss = id.includes('gauss')
    
    const normalizedCutoff = (cutoff / 250) * 100
    
    return (
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="relative size-40 rounded-full border border-white/10 bg-black flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <div className="h-full w-px bg-white/50" />
            <div className="w-full h-px bg-white/50" />
          </div>
          
          {/* Main Filter Circle */}
          <div 
            className={`rounded-full transition-all duration-300 border-2 ${isHPF ? 'border-dashed border-cyan-500/50 bg-cyan-500/5' : 'border-emerald-500/50 bg-emerald-500/10'}`}
            style={{ 
              width: `${normalizedCutoff}%`, 
              height: `${normalizedCutoff}%`,
              boxShadow: isHPF ? 'none' : '0 0 20px -5px rgba(16,185,129,0.3)',
              filter: isGauss ? 'blur(4px)' : 'none'
            }}
          />

          {/* Secondary Ring for Butterworth order visualization or Gaussian fade */}
          {(isButter || isGauss) && (
            <div 
              className={`absolute rounded-full border border-white/5`}
              style={{ 
                width: `${normalizedCutoff * 1.2}%`, 
                height: `${normalizedCutoff * 1.2}%`,
                opacity: 0.3
              }}
            />
          )}
          
          <div className="absolute bottom-2 right-2 text-[8px] font-mono text-muted-foreground uppercase">(u,v) plane</div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="text-[10px] font-bold text-white/80 uppercase tracking-widest">
            Cutoff D0 = {cutoff}px
          </div>
          <div className="text-[8px] text-muted-foreground uppercase font-medium">
            {id.replace('_', ' ')} Profile
          </div>
        </div>
      </div>
    )
  }

  // INTENSITY MAPPING GRAPH
  const data = Array.from({ length: 21 }, (_, i) => {
    const r = (i * 12.75) / 255
    let s = 0
    
    if (id === 'negative') s = 1 - r
    else if (id === 'log') s = Math.log(1 + r) / Math.log(2)
    else if (id === 'power') s = Math.pow(r, gamma)
    else if (id === 'threshold') s = (r * 255) > threshold ? 1 : 0
    else if (id === 'contrast') {
      s = (r - 0.2) / 0.6
      s = Math.max(0, Math.min(1, s))
    } else if (id === 'piecewise') {
      const rv = r * 255, r1 = 70, s1 = 20, r2 = 180, s2 = 230
      let sv = 0
      if (rv <= r1) sv = (s1/r1) * rv
      else if (rv <= r2) sv = ((s2-s1)/(r2-r1)) * (rv-r1) + s1
      else sv = ((255-s2)/(255-r2)) * (rv-r2) + s2
      s = sv / 255
    } else {
      s = r // Identity
    }
    
    return {
      r: Math.round(r * 255),
      s: Math.round(s * 255)
    }
  })

  return (
    <div className="h-[180px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
          <XAxis dataKey="r" stroke="#444" fontSize={9} tickFormatter={(v) => v === 0 || v === 255 ? v : ''} />
          <YAxis stroke="#444" fontSize={9} tickFormatter={(v) => v === 0 || v === 255 ? v : ''} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#000', border: '1px solid #333', fontSize: '10px', borderRadius: '8px' }}
            itemStyle={{ color: '#10b981' }}
          />
          <Line type="monotone" dataKey="s" stroke="#10b981" strokeWidth={2} dot={false} animationDuration={400} />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex justify-between px-2 text-[9px] text-muted-foreground/50 uppercase tracking-[0.2em] mt-2">
        <span>Input (r)</span>
        <span>Output (s)</span>
      </div>
    </div>
  )
}
