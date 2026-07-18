import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// Custom @theme font-size tokens must merge as font-size, not color — otherwise
// twMerge drops the paired text color (e.g. text-primary-foreground) as a "conflict".
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "display",
            "h1",
            "h2",
            "h3",
            "h4",
            "flow",
            "cta-title",
            "quote",
            "micro",
            "caption",
            "button",
          ],
        },
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
