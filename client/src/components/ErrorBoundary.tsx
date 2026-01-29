import { Component, type ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import i18n from "@/i18n";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private handleLanguageChange = () => {
    this.forceUpdate();
  };

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }
  }

  componentDidMount(): void {
    i18n.on("languageChanged", this.handleLanguageChange);
  }

  componentWillUnmount(): void {
    i18n.off("languageChanged", this.handleLanguageChange);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex h-full min-h-[200px] items-center justify-center p-4">
          <Card className="max-w-md p-6 text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
            <h2 className="mb-2 text-lg font-semibold">{i18n.t("errorBoundary.title")}</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              {i18n.t("errorBoundary.description")}
            </p>
            {this.state.error && (
              <p className="mb-4 rounded bg-muted p-2 font-mono text-xs text-muted-foreground">
                {this.state.error.message}
              </p>
            )}
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={this.handleReset} data-testid="button-error-retry">
                {i18n.t("errorBoundary.tryAgain")}
              </Button>
              <Button onClick={this.handleReload} data-testid="button-error-reload">
                <RefreshCw className="mr-1.5 h-4 w-4" />
                {i18n.t("errorBoundary.reload")}
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
