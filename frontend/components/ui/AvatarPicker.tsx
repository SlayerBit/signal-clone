"use client";

import { AVATAR_PRESETS, AVATAR_COLORS, getAvatarPreset } from "@/components/ui/AvatarPresets";
import { Check } from "lucide-react";

export function AvatarPicker({
  selectedPresetId,
  selectedColor,
  onPresetChange,
  onColorChange,
  displayName,
}: {
  selectedPresetId: string | null;
  selectedColor: string;
  onPresetChange: (presetId: string | null) => void;
  onColorChange: (color: string) => void;
  displayName: string;
}) {
  const activePreset = getAvatarPreset(selectedPresetId);
  const initial = displayName?.trim()?.charAt(0)?.toUpperCase() || "?";

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      {/* Live Preview */}
      <div className="flex flex-col items-center gap-2">
        <div
          className="flex items-center justify-center rounded-full text-white shadow-md transition-all duration-200"
          style={{
            width: 80,
            height: 80,
            backgroundColor: selectedColor,
            fontSize: 32,
            fontWeight: 600,
          }}
          aria-label="Avatar preview"
        >
          {activePreset ? (
            activePreset.renderIcon({ size: 46, className: "text-white drop-shadow-xs" })
          ) : (
            <span>{initial}</span>
          )}
        </div>
        <p className="text-xs text-[var(--muted)] font-medium">
          {activePreset ? activePreset.label : "Monogram avatar"}
        </p>
      </div>

      {/* Preset Illustrations Grid */}
      <div className="w-full space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] block text-center">
          Choose Avatar Style
        </label>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5 justify-items-center max-w-sm mx-auto">
          {AVATAR_PRESETS.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  if (isSelected) {
                    onPresetChange(null);
                  } else {
                    onPresetChange(preset.id);
                    // Also suggest preset's default harmonious color if user hasn't customized
                    if (!selectedColor || selectedColor === "#2c6bed") {
                      onColorChange(preset.defaultColor);
                    }
                  }
                }}
                className={`relative flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-150 ${
                  isSelected
                    ? "bg-[var(--accent-light)] text-[var(--accent)] ring-2 ring-[var(--accent)] scale-105 shadow-sm"
                    : "bg-[var(--hover)] text-[var(--text-secondary)] hover:bg-[var(--selected)] hover:text-[var(--text)] hover:scale-102"
                }`}
                title={preset.label}
                aria-label={`Select ${preset.label} avatar`}
                aria-pressed={isSelected}
              >
                {preset.renderIcon({ size: 24 })}
                {isSelected && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-xs">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Color Palette Swatches */}
      <div className="w-full space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] block text-center">
          Background Color
        </label>
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-sm mx-auto">
          {AVATAR_COLORS.map((color) => {
            const isSelected = selectedColor === color;
            return (
              <button
                key={color}
                type="button"
                onClick={() => onColorChange(color)}
                className={`relative flex h-7 w-7 items-center justify-center rounded-full transition-transform duration-150 ${
                  isSelected ? "scale-115 ring-2 ring-offset-2 ring-[var(--accent)] ring-offset-[var(--card-bg)] shadow-xs" : "hover:scale-110"
                }`}
                style={{ backgroundColor: color }}
                title={`Color ${color}`}
                aria-label={`Choose background color ${color}`}
                aria-pressed={isSelected}
              >
                {isSelected && <Check className="h-3.5 w-3.5 text-white stroke-[3]" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
