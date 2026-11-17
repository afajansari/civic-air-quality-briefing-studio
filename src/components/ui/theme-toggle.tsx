import * as React from "react"
import { useTheme } from "next-themes"
import { Moon, Sun, ShieldAlert, Laptop } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="outline" size="sm" className="size-8 p-0" aria-label="Theme toggle loading">
        <Sun className="size-4" />
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="size-8 p-0 border-border bg-background hover:bg-accent text-foreground"
          aria-label="Toggle visual theme"
        >
          {theme === "light" && <Sun className="size-4 text-amber-500" />}
          {theme === "dark" && <Moon className="size-4 text-sky-400" />}
          {theme === "theme-cpcb" && <ShieldAlert className="size-4 text-rose-500 animate-pulse" />}
          {theme !== "light" && theme !== "dark" && theme !== "theme-cpcb" && (
            <Laptop className="size-4 text-muted-foreground" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>Visual Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setTheme("dark")} className="gap-2 cursor-pointer">
          <Moon className="size-3.5 text-sky-400" />
          <span>Obsidian Dark</span>
          {theme === "dark" && <span className="ml-auto text-[10px] text-primary font-bold">Active</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("light")} className="gap-2 cursor-pointer">
          <Sun className="size-3.5 text-amber-500" />
          <span>Clean Light</span>
          {theme === "light" && <span className="ml-auto text-[10px] text-primary font-bold">Active</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("theme-cpcb")} className="gap-2 cursor-pointer">
          <ShieldAlert className="size-3.5 text-rose-500" />
          <span>CPCB Alert Mode</span>
          {theme === "theme-cpcb" && <span className="ml-auto text-[10px] text-primary font-bold">Active</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} className="gap-2 cursor-pointer">
          <Laptop className="size-3.5 text-muted-foreground" />
          <span>System Default</span>
          {theme === "system" && <span className="ml-auto text-[10px] text-primary font-bold">Active</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
