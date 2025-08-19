"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, MotionValue, useInView, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Clock, Save, Sparkles, Plus, ChevronLeft, ArrowRight, Layers, ChevronRight } from "lucide-react";
import Sidebar from '@/components/Sidebar';

/**
 * EMAIL PATHWAY BOARD
 * A visually unique, scroll-driven sequence editor.
 *
 * - Cinematic vertical "pathway": each step reveals as you scroll.
 * - Delay chips float between steps with subtle animation.
 * - Background gradient subtly shifts with the active step.
 * - Sticky header with progress + actions.
 * - LocalStorage autosave; "Next" preserves your original redirect.
 *
 * Required shadcn components:
 *   button input textarea separator badge
 *
 * Install:
 *   npx shadcn-ui add button input textarea separator badge
 *   npm i framer-motion lucide-react
 */

type Step = {
  id: string;
  subject: string;
  body: string;
  delayDays: number;
};

const mkStep = (subject = "", body = "", delayDays = 1): Step => ({
  id: crypto.randomUUID(),
  subject,
  body,
  delayDays,
});

export default function EmailPathwayBoard() {
  const router = useRouter();
  const [steps, setSteps] = useState<Step[]>([
    mkStep("", "", 1),
    mkStep("<Follow-up subject>", "", 2),
  ]);
  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");

  // Active block detection for BG gradient + progress
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ container: containerRef as any });
  const hue = useTransform(scrollYProgress, [0, 1], [220, 280]); // subtle hue shift while scrolling

  const totalFields = steps.length * 2; // subject + body per step
  const completedFields = steps.reduce(
    (acc, s) => acc + (s.subject.trim() ? 1 : 0) + (s.body.trim() ? 1 : 0),
    0
  );
  const progressPct = Math.round((completedFields / Math.max(1, totalFields)) * 100);

  // Load/save draft
  useEffect(() => {
    const cached = localStorage.getItem("pathwayDraft");
    if (cached) {
      try {
        const parsed: Step[] = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length) setSteps(parsed);
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (!steps.length) return;
    setSaving("saving");
    const t = setTimeout(() => {
      localStorage.setItem("pathwayDraft", JSON.stringify(steps));
      setSaving("saved");
      setTimeout(() => setSaving("idle"), 800);
    }, 400);
    return () => clearTimeout(t);
  }, [steps]);

  const addStepAfter = (afterId?: string) => {
    const idx = afterId ? steps.findIndex((s) => s.id === afterId) : steps.length - 1;
    const insertAt = Math.max(0, idx + 1);
    const next = [...steps.slice(0, insertAt), mkStep("<New step subject>", "", 1), ...steps.slice(insertAt)];
    setSteps(next);
  };

  const removeStep = (id: string) => {
    if (steps.length <= 1) return;
    setSteps((prev) => prev.filter((s) => s.id !== id));
  };

  const updateStep = (id: string, patch: Partial<Step>) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const onSave = () => {
    localStorage.setItem("pathwayDraft", JSON.stringify(steps));
  };

  const onNext = () => {
    // Preserve your existing flow/key so your next page can read it.
    localStorage.setItem("generatedPitches", JSON.stringify(steps));
    router.push("/campaigns/create/review");
  };

  const backgroundGradient = useTransform(hue as MotionValue<number>, (h: number) => {
    return `linear-gradient(180deg, hsl(${h} 80% 98%) 0%, white 40%)`;
  });

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar Component */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {/* Dynamic BG gradient driven by scroll */}
        <motion.div
          aria-hidden
          className="fixed inset-0 -z-10"
          style={{
            background:
              "radial-gradient(1200px 800px at 20% -10%, rgba(124, 58, 237, 0.12), transparent), radial-gradient(1200px 800px at 110% 110%, rgba(59, 130, 246, 0.12), transparent)",
            filter: "saturate(1.1)",
          }}
        />
        <motion.div
          aria-hidden
          className="fixed inset-0 -z-10 opacity-60"
          style={{
            background: backgroundGradient,
          }}
        />

{/* Sticky Header */}
<header className="sticky top-0 z-20 backdrop-blur-md bg-[#F3F4F6] border-b">
  <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white" variant="secondary" size="sm" onClick={() => history.back()}>
      <ChevronLeft className=" mr-1 h-4 w-4" />
      Back
    </Button>
    
    <Button size="sm" onClick={onNext} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
      Next
      <ChevronRight className=" mr-1 h-4 w-4" />
    </Button>
  </div>
</header>


        {/* Scrollable Content */}
        <div ref={containerRef} className="mx-auto h-[calc(100vh-56px)] max-w-6xl overflow-y-auto px-4 py-8">
          <div className="mx-auto max-w-4xl">


            {/* Steps */}
            <div className="relative">
              {steps.map((s, idx) => (
                <StepCard
                  key={s.id}
                  step={s}
                  index={idx}
                  total={steps.length}
                  onUpdate={updateStep}
                  onAddAfter={() => addStepAfter(s.id)}
                  onRemove={() => removeStep(s.id)}
                />
              ))}

              {/* Add at end */}
              <div className="mt-6 flex justify-center">
                <Button variant="outline" onClick={() => addStepAfter(steps.at(-1)?.id)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add another step
                </Button>
              </div>
            </div>

            {/* Footer tip */}
            <div className="mt-10 text-center text-xs text-slate-500">
              Pro tip: Use <Sparkles className="mx-1 inline h-3.5 w-3.5 text-fuchsia-600" /> AI Tools to seed a solid
              subject line, then humanize the body.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepCard({
  step,
  index,
  total,
  onUpdate,
  onAddAfter,
  onRemove,
}: {
  step: Step;
  index: number;
  total: number;
  onUpdate: (id: string, patch: Partial<Step>) => void;
  onAddAfter: () => void;
  onRemove: () => void;
}) {
  // Reveal + parallax tilt per card
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { amount: 0.35, once: false });

  return (
    <div className="relative">
      {/* Delay chip before this step (for step > 0) */}
      {index > 0 && (
        <DelayChip
          days={Math.max(0, step.delayDays)}
          onChange={(n) => onUpdate(step.id, { delayDays: n })}
        />
      )}

      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 24, rotateX: -8 }}
        animate={
          inView
            ? { opacity: 1, y: 0, rotateX: 0 }
            : { opacity: 0.45, y: 24, rotateX: -6 }
        }
        transition={{ type: "spring", stiffness: 140, damping: 18 }}
        className="mb-10 rounded-3xl border bg-white/90 shadow-md backdrop-blur-sm"
        style={{ transformStyle: "preserve-3d" }}
      >
        <div className="flex items-center justify-between gap-3 rounded-t-3xl border-b bg-gradient-to-r from-indigo-50 to-fuchsia-50 px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-white shadow-sm">
              {index + 1}
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">Step {index + 1}</div>
              <div className="text-xs text-slate-600">Craft your subject and message</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onAddAfter}>
              <Plus className="mr-1 h-4 w-4" />
              Add after
            </Button>
            <Button variant="ghost" size="sm" onClick={onRemove} disabled={total <= 1} className="text-rose-600">
              Remove
            </Button>
          </div>
        </div>

        <div className="grid gap-4 px-5 pb-5 pt-4">
          <div>
            <div className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-800">
              Subject
              <Badge variant="secondary" className="rounded-md">Unique</Badge>
            </div>
            <Input
              placeholder={index === 0 ? "Your opening subject…" : "Leave empty to reuse previous subject"}
              value={step.subject}
              onChange={(e) => onUpdate(step.id, { subject: e.target.value })}
            />
            {index > 0 && (
              <div className="mt-1 text-xs text-slate-500">
                Tip: Keep empty to inherit Step {index}&rsquo;s subject.
              </div>
            )}
          </div>

          <div className="mt-1">
            <div className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-800">
              Message
              <Badge variant="outline" className="rounded-md">
                Focus on value
              </Badge>
            </div>
            <Textarea
              placeholder="Write your email body…"
              className="min-h-[180px] resize-y"
              value={step.body}
              onChange={(e) => onUpdate(step.id, { body: e.target.value })}
            />
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <Button variant="outline" size="sm">
                <Sparkles className="mr-1 h-4 w-4" />
                AI Tools
              </Button>
              <Button variant="outline" size="sm">
                Templates
              </Button>
              <Button variant="outline" size="sm">
                Variables
              </Button>
              <span className="ml-auto text-xs text-slate-500">
                {step.body.length} chars
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function DelayChip({
  days,
  onChange,
}: {
  days: number;
  onChange: (n: number) => void;
}) {
  // Decorative floating delay chip
  return (
    <div className="relative -mb-2 -mt-2 flex items-center justify-center">
      <div className="pointer-events-none absolute left-0 right-0 top-1/2 -z-10 h-[2px] -translate-y-1/2 bg-gradient-to-r from-indigo-100 via-slate-200 to-fuchsia-100" />
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ margin: "-20% 0px -20% 0px", once: false }}
        transition={{ duration: 0.25 }}
        className="group inline-flex items-center gap-2 rounded-full border bg-white/90 px-3 py-1 shadow-sm"
      >
        <Clock className="h-4 w-4 text-slate-600" />
        <span className="text-sm text-slate-700">Wait</span>
        <input
          type="number"
          min={0}
          value={days}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value || 0)))}
          className="h-7 w-16 rounded-md border bg-white px-2 text-center text-sm outline-none transition-colors focus-visible:border-blue-500"
        />
        <span className="text-sm text-slate-700">days</span>
      </motion.div>
    </div>
  );
}
