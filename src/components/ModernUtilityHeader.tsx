import React, { useState, useEffect } from "react"
import { Wind, Search, RefreshCw, History, Key, MapPin, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { getAudioMuted, setAudioMuted, playStatusChime } from "@/lib/audio-alerts"

interface ModernUtilityHeaderProps {
  currentStation: string
  coordinates?: { lat: number; lon: number } | null
  onOpenCommandPalette: () => void
  onRefreshLive: () => void
  isRefreshingLive: boolean
  onOpenHistory: () => void
  savedBriefCount: number
  onOpenApiKey: () => void
  hasCustomKey: boolean
  className?: string
}

export const ModernUtilityHeader: React.FC<ModernUtilityHeaderProps> = ({
  currentStation,
  coordinates,
  onOpenCommandPalette,
  onRefreshLive,
  isRefreshingLive,
  onOpenHistory,
  savedBriefCount,
  onOpenApiKey,
  hasCustomKey,
  className = "",
}) => {
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    setIsMuted(getAudioMuted());
  }, []);

  const handleToggleAudio = () => {
    const next = !isMuted;
    setAudioMuted(next);
    setIsMuted(next);
    if (!next) {
      playStatusChime(640, 0.2);
    }
  };

  return (
    <header
      role="banner"
      className={`border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-40 transition-colors ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
        {/* Left Section: Brand & Telemetry Status Pill */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2.5 shrink-0">
            <div
              className="size-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-sm border border-primary/40"
              aria-hidden="true"
            >
              <Wind className="size-4 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <span className="text-xs font-black tracking-tight text-foreground flex items-center gap-1.5">
                CIVIC AQ STUDIO
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-mono">
                  HUD
                </span>
              </span>
            </div>
          </div>

          <div className="h-4 w-px bg-border hidden md:block shrink-0" aria-hidden="true" />

          {/* Live Telemetry Status Pill */}
          <div
            className="flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20 shadow-sm shrink-0"
            title="Active Indian Continuous Ambient Air Quality Monitoring (CAAQMS) Telemetry"
          >
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full size-2 bg-primary" />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider">
              LIVE • 15m ISR • CPCB/Open-Meteo
            </span>
          </div>

          {/* Active Station Pill with Coordinates */}
          <div
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-muted/50 text-foreground border border-border truncate"
            title={`Active Station: ${currentStation}`}
          >
            <MapPin className="size-3 text-primary shrink-0" aria-hidden="true" />
            <span className="font-semibold text-foreground truncate max-w-[150px]">
              {currentStation || "Delhi CAAQMS"}
            </span>
            {coordinates && (
              <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                ({coordinates.lat.toFixed(2)}°N, {coordinates.lon.toFixed(2)}°E)
              </span>
            )}
          </div>
        </div>

        {/* Right Section: Command Palette Trigger, Theme Toggle & Utility Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Button to Open Command Palette (Cmd+K) */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenCommandPalette}
            aria-label="Open Command Palette (Press Ctrl+K or Cmd+K)"
            className="flex items-center gap-2 h-8 px-2.5 sm:px-3 text-xs border-border bg-background hover:bg-accent text-foreground"
          >
            <Search className="size-3.5 text-muted-foreground" aria-hidden="true" />
            <span className="hidden sm:inline font-medium">Commands</span>
            <kbd className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-muted border border-border rounded text-muted-foreground">
              ⌘K
            </kbd>
          </Button>

          {/* Refresh Telemetry Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRefreshLive}
            disabled={isRefreshingLive}
            aria-label={`Refresh live air quality telemetry for ${currentStation}`}
            className="flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold border-border bg-background hover:bg-accent text-foreground"
          >
            <RefreshCw
              className={`size-3.5 text-primary ${
                isRefreshingLive ? "animate-spin" : ""
              }`}
              aria-hidden="true"
            />
            <span className="hidden md:inline">
              {isRefreshingLive ? "Refreshing..." : "Refresh"}
            </span>
          </Button>

          {/* History Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenHistory}
            aria-label="View history and saved brief archives"
            className="flex items-center gap-1.5 h-8 px-2.5 text-xs font-medium border-border bg-background hover:bg-accent text-foreground"
          >
            <History className="size-3.5 text-muted-foreground" aria-hidden="true" />
            <span className="hidden md:inline">History</span>
            {savedBriefCount > 0 && (
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                {savedBriefCount}
              </Badge>
            )}
          </Button>

          {/* API Key Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenApiKey}
            aria-label="Configure API Key for AI synthesis"
            className="flex items-center gap-1.5 h-8 px-2.5 text-xs font-medium border-border bg-background hover:bg-accent text-foreground"
          >
            <Key className="size-3.5 text-muted-foreground" aria-hidden="true" />
            <span className="hidden md:inline">
              {hasCustomKey ? "Custom Key" : "API Key"}
            </span>
            {hasCustomKey && (
              <span
                className="size-1.5 rounded-full bg-primary"
                title="Custom API key configured"
              />
            )}
          </Button>

          {/* Audio Alerts Toggle */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleToggleAudio}
            aria-label={isMuted ? "Enable atmospheric audio alerts" : "Mute atmospheric audio alerts"}
            title={isMuted ? "Audio alerts muted (Click to enable)" : "Audio alerts active (Click to mute)"}
            className="flex items-center gap-1.5 h-8 px-2.5 text-xs font-medium border-border bg-background hover:bg-accent text-foreground"
          >
            {isMuted ? (
              <VolumeX className="size-3.5 text-muted-foreground" aria-hidden="true" />
            ) : (
              <Volume2 className="size-3.5 text-primary animate-pulse" aria-hidden="true" />
            )}
            <span className="hidden md:inline">{isMuted ? "Muted" : "Audio On"}</span>
          </Button>

          {/* Visual Theme Switcher */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
