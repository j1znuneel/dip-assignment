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
}

export function TransformationGraph({ id, gamma = 1.0 }: GraphProps) {
  const data = Array.from({ length: 26 }, (_, i) => {
    const r = (i * 10) / 255
    let s = 0
    
    if (id === 'negative') {
      s = 1 - r
    } else if (id === 'log') {
      // s = log(1+r) / log(2) normalized
      s = Math.log(1 + r) / Math.log(2)
    } else if (id === 'power') {
      s = Math.pow(r, gamma)
    }
    
    return {
      r: Math.round(r * 255),
      s: Math.round(s * 255)
    }
  })

  return (
    <div className="h-[200px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
          <XAxis 
            dataKey="r" 
            stroke="#666" 
            fontSize={10} 
            tickFormatter={(value) => value === 0 || value === 250 ? value : ''}
          />
          <YAxis 
            stroke="#666" 
            fontSize={10} 
            tickFormatter={(value) => value === 0 || value === 250 ? value : ''}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontSize: '12px' }}
            itemStyle={{ color: '#10b981' }}
            labelStyle={{ color: '#888' }}
          />
          <Line 
            type="monotone" 
            dataKey="s" 
            stroke="#10b981" 
            strokeWidth={2} 
            dot={false}
            animationDuration={500}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex justify-between px-2 text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
        <span>Input Intensity (r)</span>
        <span>Output (s)</span>
      </div>
    </div>
  )
}
