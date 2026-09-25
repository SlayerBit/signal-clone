"use client";

import React from "react";

export type AvatarPreset = {
  id: string;
  label: string;
  defaultColor: string;
  renderIcon: (props: { size: number; className?: string }) => React.JSX.Element;
};

export const AVATAR_COLORS = [
  "#2c6bed", // Signal Blue
  "#7c6bf0", // Royal Purple
  "#e879f9", // Magenta Pink
  "#38bdf8", // Electric Cyan
  "#f97316", // Sunset Orange
  "#4ade80", // Emerald Green
  "#ef4444", // Crimson Red
  "#eab308", // Amber Gold
  "#8b5cf6", // Deep Violet
  "#06b6d4", // Ocean Teal
];

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: "shield",
    label: "Security Shield",
    defaultColor: "#2c6bed",
    renderIcon: ({ size, className }) => (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="currentColor" fillOpacity="0.25" />
        <path d="M12 8v4" />
        <path d="M12 16h.01" />
      </svg>
    ),
  },
  {
    id: "fox",
    label: "Origami Fox",
    defaultColor: "#7c6bf0",
    renderIcon: ({ size, className }) => (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
      >
        <path
          d="M12 17.5L5 9V4l5 4 2-1 2 1 5-4v5l-7 8.5z"
          fill="currentColor"
          fillOpacity="0.9"
        />
        <circle cx="9" cy="11" r="1.2" fill="#fff" />
        <circle cx="15" cy="11" r="1.2" fill="#fff" />
        <polygon points="12,14 10.5,12.5 13.5,12.5" fill="#fff" fillOpacity="0.8" />
      </svg>
    ),
  },
  {
    id: "lotus",
    label: "Zen Lotus",
    defaultColor: "#e879f9",
    renderIcon: ({ size, className }) => (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M12 3c-1.5 3-4 6-4 9a4 4 0 0 0 8 0c0-3-2.5-6-4-9z" fill="currentColor" fillOpacity="0.3" />
        <path d="M4 14c2-1 5-1 7 2-2 3-5 3-7 0a3.5 3.5 0 0 1 0-2z" />
        <path d="M20 14c-2-1-5-1-7 2 2 3 5 3 7 0a3.5 3.5 0 0 0 0-2z" />
        <path d="M8 18c2.5 1.5 5.5 1.5 8 0" />
      </svg>
    ),
  },
  {
    id: "bolt",
    label: "Cyber Bolt",
    defaultColor: "#38bdf8",
    renderIcon: ({ size, className }) => (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
      >
        <path
          d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
          fill="currentColor"
          fillOpacity="0.9"
        />
      </svg>
    ),
  },
  {
    id: "spark",
    label: "Celestial Spark",
    defaultColor: "#f97316",
    renderIcon: ({ size, className }) => (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
      >
        <path
          d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4L12 2z"
          fill="currentColor"
          fillOpacity="0.9"
        />
        <circle cx="19" cy="5" r="1.5" fill="currentColor" fillOpacity="0.7" />
        <circle cx="5" cy="19" r="1.5" fill="currentColor" fillOpacity="0.7" />
      </svg>
    ),
  },
  {
    id: "wave",
    label: "Ocean Swell",
    defaultColor: "#4ade80",
    renderIcon: ({ size, className }) => (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M2 7c3-2 6-2 9 0s6 2 9 0" />
        <path d="M2 12c3-2 6-2 9 0s6 2 9 0" />
        <path d="M2 17c3-2 6-2 9 0s6 2 9 0" />
      </svg>
    ),
  },
  {
    id: "phoenix",
    label: "Wings",
    defaultColor: "#ef4444",
    renderIcon: ({ size, className }) => (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M12 4l3 5-3 10-3-10 3-5z" fill="currentColor" fillOpacity="0.3" />
        <path d="M15 9l6-4-2 7-4 2" />
        <path d="M9 9l-6-4 2 7 4 2" />
      </svg>
    ),
  },
  {
    id: "cat",
    label: "Midnight Cat",
    defaultColor: "#8b5cf6",
    renderIcon: ({ size, className }) => (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M4 10l2-6 4 3 4-3 2 6c1 5-2 10-8 10s-9-5-4-10z" fill="currentColor" fillOpacity="0.25" />
        <circle cx="9" cy="13" r="1" fill="currentColor" />
        <circle cx="15" cy="13" r="1" fill="currentColor" />
        <path d="M11 16l1 .5 1-.5" />
      </svg>
    ),
  },
  {
    id: "owl",
    label: "Night Owl",
    defaultColor: "#06b6d4",
    renderIcon: ({ size, className }) => (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M12 2C8 2 5 5 5 10c0 6 3 11 7 11s7-5 7-11c0-5-3-8-7-8z" fill="currentColor" fillOpacity="0.2" />
        <circle cx="9" cy="10" r="2.5" />
        <circle cx="15" cy="10" r="2.5" />
        <path d="M12 11l-1 2h2l-1-2z" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "bot",
    label: "Signal Bot",
    defaultColor: "#2c6bed",
    renderIcon: ({ size, className }) => (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <rect x="4" y="8" width="16" height="12" rx="3" fill="currentColor" fillOpacity="0.25" />
        <path d="M12 2v4" />
        <circle cx="12" cy="2" r="1" fill="currentColor" />
        <circle cx="9" cy="13" r="1.5" fill="currentColor" />
        <circle cx="15" cy="13" r="1.5" fill="currentColor" />
        <path d="M9 17h6" />
      </svg>
    ),
  },
  {
    id: "orbit",
    label: "Orbit Satellite",
    defaultColor: "#7c6bf0",
    renderIcon: ({ size, className }) => (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <circle cx="12" cy="12" r="5" fill="currentColor" fillOpacity="0.35" />
        <ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(-25 12 12)" />
        <circle cx="19" cy="8" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "mountain",
    label: "Peaks",
    defaultColor: "#eab308",
    renderIcon: ({ size, className }) => (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M3 20l7-12 5 8 2-3 4 7H3z" fill="currentColor" fillOpacity="0.25" />
        <path d="M7.5 12l2.5 4" />
      </svg>
    ),
  },
];

export function getAvatarPreset(id: string | null | undefined): AvatarPreset | undefined {
  if (!id) return undefined;
  return AVATAR_PRESETS.find((p) => p.id === id);
}
