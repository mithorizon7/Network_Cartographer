import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Device } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, Shield, Ban, Eye, CheckCircle2 } from "lucide-react";

interface UnknownDeviceModalProps {
  device: Device | null;
  isOpen: boolean;
  onClose: () => void;
}

const responseIds = ["investigate", "block", "ignore"] as const;
const responseIcons = {
  investigate: Eye,
  block: Ban,
  ignore: Shield,
};
const responseCorrect = {
  investigate: true,
  block: false,
  ignore: false,
};

export function UnknownDeviceModal({ device, isOpen, onClose }: UnknownDeviceModalProps) {
  const { t } = useTranslation();
  const [selectedResponse, setSelectedResponse] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const handleSelect = (responseId: string) => {
    setSelectedResponse(responseId);
    setShowFeedback(true);
  };

  const handleClose = () => {
    setSelectedResponse(null);
    setShowFeedback(false);
    onClose();
  };

  if (!device) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md" data-testid="modal-unknown-device">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-destructive/10 p-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>{t('unknownDevice.title')}</DialogTitle>
              <DialogDescription>{device.label}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="pt-4">
              <p className="text-sm leading-relaxed">
                {t('unknownDevice.description')}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="secondary" className="font-mono text-xs">
                  IP: {device.ip}
                </Badge>
                <Badge variant="secondary" className="font-mono text-xs">
                  MAC: {device.localId.slice(-8)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <div>
            <p className="mb-3 text-sm font-medium" data-testid="text-what-would-you-do">
              {t('unknownDevice.whatWouldYouDo')}
            </p>
            <div className="space-y-2">
              {responseIds.map((responseId) => {
                const Icon = responseIcons[responseId];
                const isCorrect = responseCorrect[responseId];
                const isSelected = selectedResponse === responseId;
                const showCorrect = showFeedback && isCorrect;
                const showWrong = showFeedback && isSelected && !isCorrect;

                return (
                  <Button
                    key={responseId}
                    variant={showCorrect ? "default" : showWrong ? "destructive" : "outline"}
                    className="h-auto w-full justify-start gap-3 py-3 text-left"
                    onClick={() => handleSelect(responseId)}
                    disabled={showFeedback}
                    data-testid={`button-response-${responseId}`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{t(`unknownDevice.${responseId}.label`)}</span>
                    {showCorrect && <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />}
                  </Button>
                );
              })}
            </div>
          </div>

          {showFeedback && selectedResponse && (
            <Card
              className={`${
                responseCorrect[selectedResponse as keyof typeof responseCorrect]
                  ? "border-green-500/30 bg-green-500/5"
                  : "border-chart-5/30 bg-chart-5/5"
              }`}
            >
              <CardContent className="pt-4">
                <p className="text-sm leading-relaxed">{t(`unknownDevice.${selectedResponse}.feedback`)}</p>
              </CardContent>
            </Card>
          )}

          {showFeedback && (
            <Button onClick={handleClose} className="w-full" data-testid="button-close-modal">
              {t('unknownDevice.gotIt')}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
