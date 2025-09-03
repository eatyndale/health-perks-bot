import React from 'react';

interface IntensityReading {
  timestamp: Date;
  intensity: number;
  phase: 'initial' | 'mid-session' | 'post-session';
}

interface IntensityProgressChartProps {
  readings: IntensityReading[];
  currentIntensity?: number;
  className?: string;
}

export const IntensityProgressChart: React.FC<IntensityProgressChartProps> = ({
  readings,
  currentIntensity,
  className = '',
}) => {
  const maxIntensity = 10;
  const chartHeight = 120;
  const chartWidth = 300;

  const getIntensityColor = (intensity: number) => {
    if (intensity === 0) return 'hsl(120, 50%, 80%)'; // Light green
    if (intensity <= 3) return 'hsl(120, 60%, 60%)'; // Green
    if (intensity <= 6) return 'hsl(60, 80%, 60%)'; // Yellow
    if (intensity <= 8) return 'hsl(30, 80%, 60%)'; // Orange
    return 'hsl(0, 80%, 60%)'; // Red
  };

  const getPhaseLabel = (phase: string) => {
    switch (phase) {
      case 'initial': return 'Start';
      case 'mid-session': return 'Mid';
      case 'post-session': return 'End';
      default: return phase;
    }
  };

  const calculateImprovement = () => {
    if (readings.length < 2) return null;
    const initial = readings[0].intensity;
    const latest = readings[readings.length - 1].intensity;
    const improvement = initial - latest;
    const percentage = ((improvement / initial) * 100).toFixed(0);
    return { improvement, percentage: parseInt(percentage) };
  };

  const improvement = calculateImprovement();

  return (
    <div className={`bg-card border border-border rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-card-foreground">Intensity Progress</h3>
        {improvement && (
          <div className={`text-xs px-2 py-1 rounded-full ${
            improvement.improvement > 0 
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
          }`}>
            {improvement.improvement > 0 ? '↓' : '→'} {Math.abs(improvement.improvement)} ({Math.abs(improvement.percentage)}%)
          </div>
        )}
      </div>

      {readings.length === 0 ? (
        <div className="text-center text-muted-foreground text-sm py-8">
          No intensity readings yet
        </div>
      ) : (
        <>
          {/* Chart SVG */}
          <svg 
            width={chartWidth} 
            height={chartHeight} 
            className="w-full h-auto mb-4"
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          >
            {/* Grid lines */}
            {Array.from({ length: 6 }, (_, i) => {
              const y = (i * chartHeight) / 5;
              return (
                <line
                  key={i}
                  x1="0"
                  y1={y}
                  x2={chartWidth}
                  y2={y}
                  stroke="hsl(var(--border))"
                  strokeWidth="0.5"
                  opacity="0.3"
                />
              );
            })}

            {/* Intensity line and points */}
            {readings.length > 1 && (
              <>
                {/* Line path */}
                <path
                  d={readings.map((reading, index) => {
                    const x = (index / (readings.length - 1)) * chartWidth;
                    const y = chartHeight - (reading.intensity / maxIntensity) * chartHeight;
                    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2"
                />

                {/* Area fill */}
                <path
                  d={readings.map((reading, index) => {
                    const x = (index / (readings.length - 1)) * chartWidth;
                    const y = chartHeight - (reading.intensity / maxIntensity) * chartHeight;
                    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ') + ` L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`}
                  fill="hsl(var(--primary))"
                  opacity="0.1"
                />
              </>
            )}

            {/* Data points */}
            {readings.map((reading, index) => {
              const x = readings.length === 1 ? chartWidth / 2 : (index / (readings.length - 1)) * chartWidth;
              const y = chartHeight - (reading.intensity / maxIntensity) * chartHeight;
              
              return (
                <g key={index}>
                  <circle
                    cx={x}
                    cy={y}
                    r="4"
                    fill={getIntensityColor(reading.intensity)}
                    stroke="hsl(var(--card))"
                    strokeWidth="2"
                  />
                  <text
                    x={x}
                    y={y - 8}
                    textAnchor="middle"
                    className="text-xs fill-current text-card-foreground font-medium"
                  >
                    {reading.intensity}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Phase labels */}
          <div className="flex justify-between text-xs text-muted-foreground">
            {readings.map((reading, index) => (
              <div key={index} className="text-center">
                <div className="font-medium">{getPhaseLabel(reading.phase)}</div>
                <div className="text-xs opacity-75">
                  {reading.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>

          {/* Current intensity indicator */}
          {currentIntensity !== undefined && (
            <div className="mt-4 pt-3 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current Intensity:</span>
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: getIntensityColor(currentIntensity) }}
                  />
                  <span className="font-semibold text-card-foreground">{currentIntensity}/10</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};