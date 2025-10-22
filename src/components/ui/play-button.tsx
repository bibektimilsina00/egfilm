import * as React from "react"
import { Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PlayButtonProps extends React.ComponentPropsWithoutRef<typeof Button> {
    children?: React.ReactNode
}

/**
 * Primary play button with consistent styling across the application
 * Based on the movie detail page design with blue gradient
 */
const PlayButton = React.forwardRef<HTMLButtonElement, PlayButtonProps>(
    ({ className, children = "Play Now", size = "lg", ...props }, ref) => {
        return (
            <Button
                ref={ref}
                className={cn("gap-2 bg-blue-600 hover:bg-blue-700 text-white", className)}
                size={size}
                {...props}
            >
                <Play className="w-5 h-5 fill-white" />
                {children}
            </Button>
        )
    }
)

PlayButton.displayName = "PlayButton"

export { PlayButton }
