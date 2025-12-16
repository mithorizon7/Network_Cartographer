import { useState } from "react";
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

const responses = [
  {
    id: "investigate",
    label: "Investigate further",
    icon: Eye,
    correct: true,
    feedback:
      "Good choice! Before taking action, it's wise to gather more information. Check your router's admin page to see when this device connected and look for patterns in its behavior.",
  },
  {
    id: "block",
    label: "Block it immediately",
    icon: Ban,
    correct: false,
    feedback:
      "Blocking unknown devices can be appropriate, but doing so without investigation might disconnect a legitimate device you forgot about (like a smart plug or guest's phone). Consider investigating first.",
  },
  {
    id: "ignore",
    label: "Ignore it",
    icon: Shield,
    correct: false,
    feedback:
      "Ignoring unknown devices is risky. It could be a neighbor stealing your Wi-Fi, an attacker, or forgotten smart device with security vulnerabilities. Always investigate unfamiliar devices.",
  },
];

export function UnknownDeviceModal({ device, isOpen, onClose }: UnknownDeviceModalProps) {
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

  const selectedResponseData = responses.find((r) => r.id === selectedResponse);

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
              <DialogTitle>Unknown Device Detected</DialogTitle>
              <DialogDescription>{device.label}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="pt-4">
              <p className="text-sm leading-relaxed">
                You've discovered an unidentified device on your network. This could be a forgotten
                gadget, a guest's device, or something suspicious.
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
              What would you do?
            </p>
            <div className="space-y-2">
              {responses.map((response) => {
                const Icon = response.icon;
                const isSelected = selectedResponse === response.id;
                const showCorrect = showFeedback && response.correct;
                const showWrong = showFeedback && isSelected && !response.correct;

                return (
                  <Button
                    key={response.id}
                    variant={showCorrect ? "default" : showWrong ? "destructive" : "outline"}
                    className="h-auto w-full justify-start gap-3 py-3 text-left"
                    onClick={() => handleSelect(response.id)}
                    disabled={showFeedback}
                    data-testid={`button-response-${response.id}`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{response.label}</span>
                    {showCorrect && <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />}
                  </Button>
                );
              })}
            </div>
          </div>

          {showFeedback && selectedResponseData && (
            <Card
              className={`${
                selectedResponseData.correct
                  ? "border-green-500/30 bg-green-500/5"
                  : "border-chart-5/30 bg-chart-5/5"
              }`}
            >
              <CardContent className="pt-4">
                <p className="text-sm leading-relaxed">{selectedResponseData.feedback}</p>
              </CardContent>
            </Card>
          )}

          {showFeedback && (
            <Button onClick={handleClose} className="w-full" data-testid="button-close-modal">
              Got it
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
