import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { LearningPrompt } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Lightbulb, ChevronRight, RotateCcw } from "lucide-react";
import { promptIdToKey } from "@/lib/scenarioUtils";

interface LearningPromptsProps {
  prompts: LearningPrompt[];
  onComplete?: () => void;
}

export function LearningPrompts({ prompts, onComplete }: LearningPromptsProps) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [completedPrompts, setCompletedPrompts] = useState<Set<string>>(new Set());
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [promptResults, setPromptResults] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setCompletedPrompts(new Set());
    setCorrectAnswers(0);
    setShowSummary(false);
    setPromptResults({});
  }, [prompts]);

  if (prompts.length === 0) {
    return (
      <Card data-testid="panel-learning-empty">
        <CardHeader className="pb-4 text-center">
          <div className="text-muted-foreground">
            <Lightbulb className="mx-auto mb-3 h-10 w-10 opacity-50" />
            <p className="text-sm">{t("learning.noPrompts")}</p>
          </div>
        </CardHeader>
      </Card>
    );
  }

  const safeIndex = currentIndex < prompts.length ? currentIndex : 0;
  const currentPrompt = prompts[safeIndex];
  const progress = (completedPrompts.size / prompts.length) * 100;
  const isComplete = completedPrompts.size === prompts.length;
  const isLastPrompt = safeIndex === prompts.length - 1;
  const promptKey = promptIdToKey[currentPrompt.id];
  const explanationText = promptKey
    ? t(`learningPrompts.${promptKey}.explanation`, { defaultValue: currentPrompt.explanation })
    : currentPrompt.explanation;
  const whyText = promptKey
    ? t(`learningPrompts.${promptKey}.why`, { defaultValue: currentPrompt.why || "" })
    : currentPrompt.why;
  const nextStepText = promptKey
    ? t(`learningPrompts.${promptKey}.nextStep`, { defaultValue: currentPrompt.nextStep || "" })
    : currentPrompt.nextStep;
  const resolvedWhy = whyText || explanationText;
  const resolvedNextStep = nextStepText || t("learning.defaultNextStep");

  const handleAnswerSelect = (answerIndex: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(answerIndex);
    setShowExplanation(true);

    const isCorrect = currentPrompt.answers[answerIndex].isCorrect;
    if (isCorrect) {
      setCorrectAnswers((prev) => prev + 1);
    }
    setPromptResults((prev) => ({ ...prev, [currentPrompt.id]: isCorrect }));
    setCompletedPrompts((prev) => new Set(prev).add(currentPrompt.id));
  };

  const handleNext = () => {
    if (currentIndex < prompts.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  const handleFinish = () => {
    if (!isComplete) return;
    setShowSummary(true);
    onComplete?.();
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setCompletedPrompts(new Set());
    setCorrectAnswers(0);
    setShowSummary(false);
    setPromptResults({});
  };

  if (showSummary) {
    const scorePercent = Math.round((correctAnswers / prompts.length) * 100);
    const incorrectPrompts = prompts.filter((prompt) => promptResults[prompt.id] === false);
    return (
      <Card data-testid="panel-learning-complete">
        <CardContent className="pt-6 text-center">
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-green-500" />
          <h3 className="mb-2 text-lg font-semibold">{t("learning.allComplete")}</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            {t("learning.scoreResult", { correct: correctAnswers, total: prompts.length })}
          </p>
          <Badge
            variant={correctAnswers === prompts.length ? "default" : "secondary"}
            className="mb-6"
          >
            {t("learning.scorePercent", { percent: scorePercent })}
          </Badge>
          {incorrectPrompts.length > 0 ? (
            <div className="mb-6 text-left">
              <h4 className="text-sm font-semibold">{t("learning.summaryTitle")}</h4>
              <p className="mt-1 text-xs text-muted-foreground">{t("learning.summaryIntro")}</p>
              <div className="mt-3 space-y-2">
                {incorrectPrompts.map((prompt) => {
                  const promptKey = promptIdToKey[prompt.id];
                  const questionText = promptKey
                    ? t(`learningPrompts.${promptKey}.question`, { defaultValue: prompt.question })
                    : prompt.question;
                  const nextStepText = promptKey
                    ? t(`learningPrompts.${promptKey}.nextStep`, {
                        defaultValue: prompt.nextStep || t("learning.defaultNextStep"),
                      })
                    : prompt.nextStep || t("learning.defaultNextStep");
                  return (
                    <div
                      key={prompt.id}
                      className="rounded-md border border-chart-5/30 bg-chart-5/5 p-3"
                    >
                      <p className="text-sm font-medium">{questionText}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{nextStepText}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="mb-6 text-sm text-muted-foreground">{t("learning.summaryAllCorrect")}</p>
          )}
          <div>
            <Button variant="outline" onClick={handleReset} data-testid="button-restart-prompts">
              <RotateCcw className="mr-2 h-4 w-4" />
              {t("learning.tryAgain")}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="learning-prompts">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-chart-5" />
            <span className="text-sm font-medium">{t("learning.title")}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {t("learning.progress", { completed: completedPrompts.size, total: prompts.length })}
          </span>
        </div>
        <Progress value={progress} className="mt-2 h-1.5" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          {currentPrompt.relatedLayer && (
            <Badge variant="secondary" className="mb-2 text-xs capitalize">
              {t("learning.layer", { layer: t(`layers.${currentPrompt.relatedLayer}`) })}
            </Badge>
          )}
          <p className="text-sm font-medium leading-relaxed" data-testid="text-prompt-question">
            {promptKey
              ? t(`learningPrompts.${promptKey}.question`, { defaultValue: currentPrompt.question })
              : currentPrompt.question}
          </p>
        </div>

        <div className="space-y-2">
          {currentPrompt.answers.map((answer, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = answer.isCorrect;
            const showResult = selectedAnswer !== null;

            let buttonVariant: "outline" | "default" | "destructive" = "outline";
            let statusIcon = null;

            if (showResult) {
              if (isCorrect) {
                buttonVariant = "default";
                statusIcon = <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />;
              } else if (isSelected && !isCorrect) {
                buttonVariant = "destructive";
                statusIcon = <XCircle className="h-4 w-4 shrink-0" />;
              }
            }

            const translatedAnswer = promptKey
              ? t(`learningPrompts.${promptKey}.answers.${index}`, { defaultValue: answer.text })
              : answer.text;

            return (
              <Button
                key={index}
                variant={buttonVariant}
                className="h-auto w-full justify-start gap-3 whitespace-normal py-3 text-left"
                onClick={() => handleAnswerSelect(index)}
                disabled={selectedAnswer !== null}
                data-testid={`button-answer-${index}`}
              >
                <span className="flex-1">{translatedAnswer}</span>
                {showResult && statusIcon}
              </Button>
            );
          })}
        </div>

        {showExplanation && (
          <div className="rounded-md border border-chart-2/30 bg-chart-2/5 p-3">
            <p className="text-sm leading-relaxed text-foreground">{explanationText}</p>
            <div className="mt-3 space-y-2 border-t border-chart-2/20 pt-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("learning.whyMatters")}
                </p>
                <p className="text-sm leading-relaxed text-foreground">{resolvedWhy}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("learning.whatToDoNext")}
                </p>
                <p className="text-sm leading-relaxed text-foreground">{resolvedNextStep}</p>
              </div>
            </div>
          </div>
        )}

        {showExplanation && currentIndex < prompts.length - 1 && (
          <Button onClick={handleNext} className="w-full" data-testid="button-next-prompt">
            {t("learning.nextQuestion")}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}

        {showExplanation && isLastPrompt && (
          <Button onClick={handleFinish} className="w-full" data-testid="button-finish-prompts">
            {t("learning.finish")}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
