import React from "react";

interface AvatarProps {
    name: string;
    imageUrl?: string;
    size?: number;
    className?: string;
    colorSeed?: string;
}

const COLORS = [
    "bg-blue-200 text-blue-700",
    "bg-green-200 text-green-700",
    "bg-purple-200 text-purple-700",
    "bg-pink-200 text-pink-700",
    "bg-yellow-200 text-yellow-700",
    "bg-teal-200 text-teal-700",
    "bg-orange-200 text-orange-700",
    "bg-red-200 text-red-700",
];

function pickColor(seed: string): string {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    return COLORS[Math.abs(hash) % COLORS.length];
}

const Avatar: React.FC<AvatarProps> = ({ name, imageUrl, size = 48, className = "", colorSeed }) => {
    const initial = name?.trim()?.charAt(0)?.toUpperCase() || "؟";
    const colorClass = pickColor(colorSeed || name || "?");
    const style = { width: size, height: size };

    if (imageUrl) {
        return (
            <img
                src={imageUrl}
                alt={name}
                style={style}
                className={`rounded-full object-cover flex-shrink-0 ${className}`}
            />
        );
    }

    return (
        <div
            style={style}
            className={`rounded-full flex items-center justify-center font-bold flex-shrink-0 shadow-sm ${colorClass} ${className}`}
        >
            <span style={{ fontSize: size * 0.4 }}>{initial}</span>
        </div>
    );
};

export default Avatar;