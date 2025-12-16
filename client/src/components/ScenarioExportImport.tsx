import { useState, useRef, useCallback } from "react";
import { scenarioSchema, type Scenario } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, FileJson, Check, AlertCircle, Copy, FileUp } from "lucide-react";

interface ScenarioExportImportProps {
  scenario: Scenario | null;
  onImport: (scenario: Scenario) => void;
}

function validateScenario(data: unknown): { valid: boolean; error?: string; scenario?: Scenario } {
  const result = scenarioSchema.safeParse(data);
  
  if (!result.success) {
    const firstError = result.error.errors[0];
    const path = firstError.path.length > 0 ? firstError.path.join('.') : 'root';
    return { 
      valid: false, 
      error: `Validation error at '${path}': ${firstError.message}` 
    };
  }

  const scenario = result.data;

  if (scenario.devices.length === 0) {
    return { valid: false, error: "Scenario must have at least one device" };
  }

  if (scenario.networks.length === 0) {
    return { valid: false, error: "Scenario must have at least one network" };
  }

  const hasRouter = scenario.devices.some(d => d.type === "router");
  if (!hasRouter) {
    return { valid: false, error: "Scenario must have a router device" };
  }

  return { valid: true, scenario };
}

export function ScenarioExportImport({ scenario, onImport }: ScenarioExportImportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const exportJson = scenario ? JSON.stringify(scenario, null, 2) : "";

  const handleCopy = useCallback(async () => {
    if (!exportJson) return;
    
    try {
      await navigator.clipboard.writeText(exportJson);
      setCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "Scenario JSON has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard. Please select and copy manually.",
        variant: "destructive",
      });
    }
  }, [exportJson, toast]);

  const handleDownload = useCallback(() => {
    if (!scenario) return;

    const blob = new Blob([exportJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${scenario.id}-scenario.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Scenario exported",
      description: `${scenario.title} has been downloaded as JSON.`,
    });
  }, [scenario, exportJson, toast]);

  const handleImportText = useCallback(() => {
    setImportError(null);
    setImportSuccess(false);

    if (!importText.trim()) {
      setImportError("Please paste scenario JSON");
      return;
    }

    try {
      const parsed = JSON.parse(importText);
      const validation = validateScenario(parsed);

      if (!validation.valid) {
        setImportError(validation.error || "Invalid scenario format");
        return;
      }

      if (validation.scenario) {
        onImport(validation.scenario);
        setImportSuccess(true);
        toast({
          title: "Scenario imported",
          description: `${validation.scenario.title} has been loaded.`,
        });
        setTimeout(() => {
          setIsOpen(false);
          setImportText("");
          setImportSuccess(false);
        }, 1500);
      }
    } catch (e) {
      setImportError("Invalid JSON format. Please check your input.");
    }
  }, [importText, onImport, toast]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportSuccess(false);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) {
        setImportError("Could not read file");
        return;
      }

      try {
        const parsed = JSON.parse(content);
        const validation = validateScenario(parsed);

        if (!validation.valid) {
          setImportError(validation.error || "Invalid scenario format");
          return;
        }

        if (validation.scenario) {
          onImport(validation.scenario);
          setImportSuccess(true);
          toast({
            title: "Scenario imported",
            description: `${validation.scenario.title} has been loaded from file.`,
          });
          setTimeout(() => {
            setIsOpen(false);
            setImportText("");
            setImportSuccess(false);
          }, 1500);
        }
      } catch {
        setImportError("Invalid JSON file. Please check the file format.");
      }
    };

    reader.onerror = () => {
      setImportError("Failed to read file");
    };

    reader.readAsText(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [onImport, toast]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid="button-export-import">
          <FileJson className="mr-1.5 h-4 w-4" />
          Export / Import
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Scenario Export / Import</DialogTitle>
          <DialogDescription>
            Export scenarios to share with others or import custom network configurations
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="export" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export" data-testid="tab-export">
              <Download className="mr-1.5 h-4 w-4" />
              Export
            </TabsTrigger>
            <TabsTrigger value="import" data-testid="tab-import">
              <Upload className="mr-1.5 h-4 w-4" />
              Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="mt-4 space-y-4">
            {scenario ? (
              <>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    <FileJson className="mr-1 h-3 w-3" />
                    {scenario.title}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {scenario.devices.length} devices, {scenario.networks.length} networks
                  </span>
                </div>

                <div className="relative">
                  <Textarea
                    readOnly
                    value={exportJson}
                    className="h-64 resize-none font-mono text-xs"
                    data-testid="textarea-export"
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleCopy} variant="outline" data-testid="button-copy-json">
                    {copied ? (
                      <>
                        <Check className="mr-1.5 h-4 w-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1.5 h-4 w-4" />
                        Copy JSON
                      </>
                    )}
                  </Button>
                  <Button onClick={handleDownload} data-testid="button-download-json">
                    <Download className="mr-1.5 h-4 w-4" />
                    Download File
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex h-40 items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <FileJson className="mx-auto mb-2 h-12 w-12 opacity-30" />
                  <p>Select a scenario to export</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="import" className="mt-4 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                  data-testid="input-file-upload"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="button-upload-file"
                >
                  <FileUp className="mr-1.5 h-4 w-4" />
                  Upload JSON File
                </Button>
                <span className="text-sm text-muted-foreground">or paste JSON below</span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="import-json">Scenario JSON</Label>
                <Textarea
                  id="import-json"
                  placeholder='{"id": "custom", "title": "My Network", ...}'
                  value={importText}
                  onChange={(e) => {
                    setImportText(e.target.value);
                    setImportError(null);
                    setImportSuccess(false);
                  }}
                  className="h-48 resize-none font-mono text-xs"
                  data-testid="textarea-import"
                />
              </div>

              {importError && (
                <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive" data-testid="import-error">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {importError}
                </div>
              )}

              {importSuccess && (
                <div className="flex items-center gap-2 rounded-md border border-green-500/50 bg-green-500/10 px-3 py-2 text-sm text-green-600 dark:text-green-400" data-testid="import-success">
                  <Check className="h-4 w-4 flex-shrink-0" />
                  Scenario imported successfully
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                onClick={handleImportText}
                disabled={!importText.trim() || importSuccess}
                data-testid="button-import-json"
              >
                <Upload className="mr-1.5 h-4 w-4" />
                Import Scenario
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
