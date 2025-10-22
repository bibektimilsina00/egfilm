import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

/**
 * Reusable error state component with optional retry functionality
 */
export function ErrorState({
  title = "Something went wrong",
  message = "We encountered an error while loading the content. Please try again.",
  onRetry,
  showRetry = true
}: ErrorStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Alert className="max-w-md bg-red-900/20 border-red-800">
        <AlertTriangle className="h-4 w-4 text-red-400" />
        <AlertDescription className="text-center">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-red-200 mb-2">{title}</h3>
              <p className="text-red-300 text-sm">{message}</p>
            </div>
            {showRetry && onRetry && (
              <Button
                onClick={onRetry}
                variant="outline"
                size="sm"
                className="gap-2 border-red-600 text-red-200 hover:bg-red-900/30"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}

/**
 * Empty state component for when no content is available
 */
export function EmptyState({
  title = "No content available",
  message = "There's nothing to show here right now.",
  action
}: {
  title?: string;
  message?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-gray-800 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-gray-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-200 mb-2">{title}</h3>
          <p className="text-gray-400 text-sm max-w-sm">{message}</p>
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}