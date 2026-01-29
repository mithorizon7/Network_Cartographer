import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { scenarioSchema, type Scenario } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, FileJson, Check, AlertCircle, Copy, FileUp } from "lucide-react";
import { scenarioIdToKey } from "@/lib/scenarioUtils";

interface ScenarioExportImportProps {
  scenario: Scenario | null;
  onImport: (scenario: Scenario) => void;
}

function validateScenario(
  data: unknown,
  t: TFunction,
): { valid: boolean; error?: string; scenario?: Scenario } {
  const result = scenarioSchema.safeParse(data);

  if (!result.success) {
    const firstError = result.error.errors[0];
    const path =
      firstError.path.length > 0
        ? firstError.path.join(".")
        : t("scenarioExportImport.validationRoot");
    return {
      valid: false,
      error: t("scenarioExportImport.validationError", { path }),
    };
  }

  const scenario = result.data;

  if (scenario.devices.length === 0) {
    return { valid: false, error: t("scenarioExportImport.requiresDevice") };
  }

  if (scenario.networks.length === 0) {
    return { valid: false, error: t("scenarioExportImport.requiresNetwork") };
  }

  const hasRouter = scenario.devices.some((d) => d.type === "router");
  if (!hasRouter) {
    return { valid: false, error: t("scenarioExportImport.requiresRouter") };
  }

  return { valid: true, scenario };
}

export function ScenarioExportImport({ scenario, onImport }: ScenarioExportImportProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timeoutRefs = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    const timeouts = timeoutRefs.current;
    return () => {
      timeouts.forEach(clearTimeout);
      timeouts.clear();
    };
  }, []);

  const exportJson = scenario ? JSON.stringify(scenario, null, 2) : "";
  const scenarioKey = scenario ? scenarioIdToKey[scenario.id] : null;
  const scenarioTitle = scenario
    ? scenarioKey
      ? t(`scenarioContent.${scenarioKey}.title`, { defaultValue: scenario.title })
      : scenario.title
    : "";

  const handleCopy = useCallback(async () => {
    if (!exportJson) return;

    try {
      await navigator.clipboard.writeText(exportJson);
      setCopied(true);
      toast({
        title: t("scenarioExportImport.copyToastTitle"),
        description: t("scenarioExportImport.copyToastDescription"),
      });
      const timeout = setTimeout(() => {
        setCopied(false);
        timeoutRefs.current.delete(timeout);
      }, 2000);
      timeoutRefs.current.add(timeout);
    } catch {
      toast({
        title: t("scenarioExportImport.copyFailedTitle"),
        description: t("scenarioExportImport.copyFailedDescription"),
        variant: "destructive",
      });
    }
  }, [exportJson, toast, t]);

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
      title: t("scenarioExportImport.exportToastTitle"),
      description: t("scenarioExportImport.exportToastDescription", { title: scenarioTitle }),
    });
  }, [scenario, exportJson, toast, t, scenarioTitle]);

  const handleImportText = useCallback(() => {
    setImportError(null);
    setImportSuccess(false);

    if (!importText.trim()) {
      setImportError(t("scenarioExportImport.pasteJsonError"));
      return;
    }

    try {
      const parsed = JSON.parse(importText);
      const validation = validateScenario(parsed, t);

      if (!validation.valid) {
        setImportError(validation.error || t("scenarioExportImport.invalidFormatError"));
        return;
      }

      if (validation.scenario) {
        const importedKey = scenarioIdToKey[validation.scenario.id];
        const importedTitle = importedKey
          ? t(`scenarioContent.${importedKey}.title`, { defaultValue: validation.scenario.title })
          : validation.scenario.title;
        onImport(validation.scenario);
        setImportSuccess(true);
        toast({
          title: t("scenarioExportImport.importToastTitle"),
          description: t("scenarioExportImport.importToastDescription", { title: importedTitle }),
        });
        const timeout = setTimeout(() => {
          setIsOpen(false);
          setImportText("");
          setImportSuccess(false);
          timeoutRefs.current.delete(timeout);
        }, 1500);
        timeoutRefs.current.add(timeout);
      }
    } catch {
      setImportError(t("scenarioExportImport.invalidJsonError"));
    }
  }, [importText, onImport, toast, t]);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setImportError(null);
      setImportSuccess(false);

      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (!content) {
          setImportError(t("scenarioExportImport.readFileError"));
          return;
        }

        try {
          const parsed = JSON.parse(content);
          const validation = validateScenario(parsed, t);

          if (!validation.valid) {
            setImportError(validation.error || t("scenarioExportImport.invalidFormatError"));
            return;
          }

          if (validation.scenario) {
            const importedKey = scenarioIdToKey[validation.scenario.id];
            const importedTitle = importedKey
              ? t(`scenarioContent.${importedKey}.title`, {
                  defaultValue: validation.scenario.title,
                })
              : validation.scenario.title;
            onImport(validation.scenario);
            setImportSuccess(true);
            toast({
              title: t("scenarioExportImport.importToastTitle"),
              description: t("scenarioExportImport.importToastDescriptionFile", {
                title: importedTitle,
              }),
            });
            const timeout = setTimeout(() => {
              setIsOpen(false);
              setImportText("");
              setImportSuccess(false);
              timeoutRefs.current.delete(timeout);
            }, 1500);
            timeoutRefs.current.add(timeout);
          }
        } catch {
          setImportError(t("scenarioExportImport.invalidJsonFileError"));
        }
      };

      reader.onerror = () => {
        setImportError(t("scenarioExportImport.failedReadFileError"));
      };

      reader.readAsText(file);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [onImport, toast, t],
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid="button-export-import">
          <FileJson className="mr-1.5 h-4 w-4" />
          {t("scenarioExportImport.trigger")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("scenarioExportImport.title")}</DialogTitle>
          <DialogDescription>{t("scenarioExportImport.description")}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="export" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export" data-testid="tab-export">
              <Download className="mr-1.5 h-4 w-4" />
              {t("scenarioExportImport.exportTab")}
            </TabsTrigger>
            <TabsTrigger value="import" data-testid="tab-import">
              <Upload className="mr-1.5 h-4 w-4" />
              {t("scenarioExportImport.importTab")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="mt-4 space-y-4">
            {scenario ? (
              <>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    <FileJson className="mr-1 h-3 w-3" />
                    {scenarioTitle}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {t("scenarioExportImport.deviceCount", { count: scenario.devices.length })},{" "}
                    {t("scenarioExportImport.networkCount", { count: scenario.networks.length })}
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
                        {t("scenarioExportImport.copied")}
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1.5 h-4 w-4" />
                        {t("scenarioExportImport.copyJson")}
                      </>
                    )}
                  </Button>
                  <Button onClick={handleDownload} data-testid="button-download-json">
                    <Download className="mr-1.5 h-4 w-4" />
                    {t("scenarioExportImport.downloadFile")}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex h-40 items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <FileJson className="mx-auto mb-2 h-12 w-12 opacity-30" />
                  <p>{t("common.selectScenarioToExport")}</p>
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
                  {t("scenarioExportImport.uploadJsonFile")}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {t("scenarioExportImport.orPaste")}
                </span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="import-json">{t("scenarioExportImport.scenarioJsonLabel")}</Label>
                <Textarea
                  id="import-json"
                  placeholder={t("scenarioExportImport.placeholder")}
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
                <div
                  className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  data-testid="import-error"
                >
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {importError}
                </div>
              )}

              {importSuccess && (
                <div
                  className="flex items-center gap-2 rounded-md border border-green-500/50 bg-green-500/10 px-3 py-2 text-sm text-green-600 dark:text-green-400"
                  data-testid="import-success"
                >
                  <Check className="h-4 w-4 flex-shrink-0" />
                  {t("scenarioExportImport.importSuccess")}
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
                {t("scenarioExportImport.importButton")}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
