"use client";

interface SoundWaveProps {
    isAnimating: boolean;
    color?: string;
}

export function SoundWave({ isAnimating, color = "#3B82F6" }: SoundWaveProps) {
    return (
        <div className="flex items-center justify-center gap-1 h-8">
            {[...Array(5)].map((_, i) => (
                <div
                    key={i}
                    className={`w-1 rounded-full ${
                        isAnimating ? "animate-soundwave" : "h-1"
                    }`}
                    style={{
                        backgroundColor: color,
                        animationDelay: `${i * 0.15}s`,
                    }}
                />
            ))}
        </div>
    );
}
