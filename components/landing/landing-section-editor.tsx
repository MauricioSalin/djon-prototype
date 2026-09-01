"use client";

import Image from "next/image";
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  ImageUp,
  LoaderCircle,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DjonSelect } from "@/components/djon-select";
import { LandingIconView } from "@/components/landing/landing-options";
import {
  landingColorOptions,
  landingIconOptions,
  type CourseLandingItem,
  type CoursesLandingData,
  type HeroLandingData,
  type HistoryLandingData,
  type LandingColor,
  type LandingIcon,
  type LandingSectionData,
  type LandingSectionDataMap,
  type LandingSectionKey,
  type LifestyleLandingData,
  type ShowcaseLandingData,
  type StatsLandingData,
  type TeamLandingData,
} from "@/lib/landing-content";
import { store } from "@/lib/store";

const field =
  "w-full rounded-xl border border-djon-text/10 bg-djon-text/5 px-3 py-2.5 text-sm text-djon-text outline-none placeholder:text-djon-text/25 focus:border-djon-accent/50";
const labelClass =
  "mb-1.5 block text-[10px] font-black uppercase tracking-[0.16em] text-djon-text/40";

const landingColorSelectOptions = landingColorOptions.map((option) => ({
  value: option.value,
  label: option.label,
  preview: (
    <span
      className="size-3.5 rounded-full border border-current/20"
      style={{ backgroundColor: option.color }}
    />
  ),
}));

const landingIconSelectOptions = landingIconOptions.map((option) => ({
  value: option.value,
  label: option.label,
  preview: <LandingIconView name={option.value} size={16} />,
}));

const sectionNames: Record<LandingSectionKey, string> = {
  hero: "Hero principal",
  lifestyle: "Apresentação",
  courses: "Cursos",
  stats: "DJ ON em números",
  showcase: "Showcase",
  team: "Nosso time",
  history: "Nossa história",
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function move<T>(items: T[], from: number, to: number) {
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function TextInput({
  label,
  value,
  onChange,
  maxLength,
  multiline = false,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  multiline?: boolean;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {multiline ? (
        <textarea
          required
          rows={rows}
          maxLength={maxLength}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${field} resize-y`}
        />
      ) : (
        <input
          required
          maxLength={maxLength}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={field}
        />
      )}
      <span className="mt-1 block text-right text-[9px] text-djon-text/25">
        {value.length}/{maxLength}
      </span>
    </label>
  );
}

function ColorSelect({ value, onChange }: { value: LandingColor; onChange: (value: LandingColor) => void }) {
  return (
    <div className="block">
      <span className={labelClass}>Cor</span>
      <DjonSelect
        value={value}
        onChange={(nextValue) => onChange(nextValue as LandingColor)}
        options={landingColorSelectOptions}
        ariaLabel="Cor"
      />
    </div>
  );
}

function IconSelect({ value, onChange }: { value: LandingIcon; onChange: (value: LandingIcon) => void }) {
  return (
    <div className="block">
      <span className={labelClass}>Ícone da biblioteca Lucide</span>
      <DjonSelect
        value={value}
        onChange={(nextValue) => onChange(nextValue as LandingIcon)}
        options={landingIconSelectOptions}
        ariaLabel="Ícone da biblioteca Lucide"
      />
    </div>
  );
}

function SortableTextList({
  label,
  items,
  maximum,
  maxLength,
  onChange,
}: {
  label: string;
  items: string[];
  maximum: number;
  maxLength: number;
  onChange: (items: string[]) => void;
}) {
  const dragIndex = useRef<number | null>(null);
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className={labelClass}>{label} ({items.length}/{maximum})</span>
        {items.length < maximum ? (
          <button type="button" onClick={() => onChange([...items, "Novo item"])} className="inline-flex items-center gap-1 text-[10px] font-black text-djon-accent">
            <Plus size={12} /> ADICIONAR
          </button>
        ) : null}
      </div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={`${index}:${item}`}
            draggable
            onDragStart={() => { dragIndex.current = index; }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (dragIndex.current !== null) onChange(move(items, dragIndex.current, index));
              dragIndex.current = null;
            }}
            className="flex items-center gap-2"
          >
            <GripVertical size={15} className="shrink-0 cursor-grab text-djon-text/25" />
            <input required maxLength={maxLength} value={item} onChange={(event) => onChange(items.map((value, itemIndex) => itemIndex === index ? event.target.value : value))} className={`${field} min-w-0`} />
            <div className="flex shrink-0 flex-col">
              <button type="button" aria-label="Mover para cima" onClick={() => onChange(move(items, index, index - 1))} className="text-djon-text/35"><ChevronUp size={13} /></button>
              <button type="button" aria-label="Mover para baixo" onClick={() => onChange(move(items, index, index + 1))} className="text-djon-text/35"><ChevronDown size={13} /></button>
            </div>
            <button type="button" aria-label="Remover item" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))} className="shrink-0 text-djon-warning-red/70"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ImagePicker({
  value,
  label,
  recommendation,
  aspect,
  compact = false,
  onUpload,
}: {
  value: string;
  label: string;
  recommendation: string;
  aspect: "1:1" | "4:5" | "4:3";
  compact?: boolean;
  onUpload: (file: File) => void;
}) {
  const aspectClass = {
    "1:1": "aspect-square",
    "4:5": "aspect-[4/5]",
    "4:3": "aspect-[4/3]",
  }[aspect];

  return (
    <label className="block cursor-pointer">
      <span className={labelClass}>{label}</span>
      <span
        data-site-aspect={aspect}
        className={`group relative block overflow-hidden rounded-2xl border border-djon-text/10 bg-djon-black ${aspectClass} ${compact ? "max-w-sm" : ""}`}
      >
        {value ? <Image loader={({ src }) => src} unoptimized src={value} alt="" fill sizes="480px" className="object-cover" /> : null}
        <span className="absolute inset-0 flex items-center justify-center bg-djon-black/60 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="inline-flex items-center gap-2 rounded-full bg-djon-accent px-4 py-2 text-xs font-black text-djon-ink"><ImageUp size={15} /> TROCAR IMAGEM</span>
        </span>
      </span>
      <span className="mt-1.5 block text-[10px] text-djon-text/30">Recomendado: {recommendation}. JPG, PNG, WebP ou GIF.</span>
      <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(event) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (file) onUpload(file);
      }} />
    </label>
  );
}

function Card({ children, title, onRemove }: { children: React.ReactNode; title: string; onRemove?: () => void }) {
  return (
    <div className="rounded-2xl border border-djon-text/10 bg-djon-text/3 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-xs font-black text-djon-text">{title}</p>
        {onRemove ? <button type="button" onClick={onRemove} className="text-djon-warning-red/70"><Trash2 size={15} /></button> : null}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function EditorItemTabs({
  ariaLabel,
  items,
  activeId,
  onChange,
}: {
  ariaLabel: string;
  items: readonly { id: string; label: string }[];
  activeId: string;
  onChange: (id: string) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="djon-scroll flex gap-2 overflow-x-auto pb-2"
      data-lenis-prevent
      data-lenis-prevent-wheel
      data-lenis-prevent-touch
    >
      {items.map((item, index) => {
        const active = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={`shrink-0 rounded-full border px-4 py-2 text-xs font-black transition-colors ${
              active
                ? "border-djon-accent bg-djon-accent text-djon-ink"
                : "border-djon-text/10 bg-djon-text/4 text-djon-text/45 hover:text-djon-text"
            }`}
          >
            {index + 1}. {item.label}
          </button>
        );
      })}
    </div>
  );
}

export function LandingSectionEditor({
  sectionKey,
  data,
  onClose,
  onSaved,
}: {
  sectionKey: LandingSectionKey;
  data: LandingSectionData;
  onClose: () => void;
  onSaved: <K extends LandingSectionKey>(key: K, data: LandingSectionDataMap[K]) => void;
}) {
  const [draft, setDraft] = useState<LandingSectionData>(() => clone(data));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const pendingIds = useRef(new Set<string>());
  const committed = useRef(false);

  useEffect(() => {
    const ids = pendingIds.current;
    return () => {
      if (committed.current) return;
      ids.forEach((id) => void store.deleteFile(id, { silent: true, keepalive: true }).catch(() => undefined));
    };
  }, []);

  const uploadImage = async (file: File, current: string, apply: (url: string) => void) => {
    setUploading(true);
    try {
      const uploaded = await store.uploadFile(file, "site-image");
      const previousId = [...pendingIds.current].find((id) => current.includes(id));
      if (previousId) {
        await store.deleteFile(previousId, { silent: true }).catch(() => undefined);
        pendingIds.current.delete(previousId);
      }
      pendingIds.current.add(uploaded.id);
      apply(uploaded.url);
    } finally {
      setUploading(false);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const saved = await store.updateLandingContent(sectionKey, draft as never);
      committed.current = true;
      pendingIds.current.clear();
      onSaved(saved.key, saved.data as never);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !saving && !uploading) onClose(); }}>
      <DialogContent data-lenis-prevent data-lenis-prevent-wheel data-lenis-prevent-touch overlayClassName="bg-djon-black/85 backdrop-blur-sm" className="djon-scroll max-h-[calc(100svh-2rem)] overflow-y-auto border-djon-text/10 bg-djon-surface p-0 text-djon-text sm:max-w-3xl">
        <form onSubmit={submit}>
          <DialogHeader className="border-b border-djon-text/8 px-5 py-5 pr-12 sm:px-6">
            <p className="text-xs font-black tracking-[0.22em] text-djon-accent">EDIÇÃO DO SITE PRINCIPAL</p>
            <DialogTitle className="text-2xl font-black tracking-tight text-djon-text">{sectionNames[sectionKey]}</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-djon-text/45">As alterações só aparecem para visitantes depois de salvar.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 px-5 py-5 sm:px-6">
            {sectionKey === "hero" ? <HeroEditor value={draft as HeroLandingData} onChange={setDraft} /> : null}
            {sectionKey === "lifestyle" ? <LifestyleEditor value={draft as LifestyleLandingData} onChange={setDraft} upload={uploadImage} /> : null}
            {sectionKey === "courses" ? <CoursesEditor value={draft as CoursesLandingData} onChange={setDraft} upload={uploadImage} /> : null}
            {sectionKey === "stats" ? <StatsEditor value={draft as StatsLandingData} onChange={setDraft} /> : null}
            {sectionKey === "showcase" ? <ShowcaseEditor value={draft as ShowcaseLandingData} onChange={setDraft} upload={uploadImage} /> : null}
            {sectionKey === "team" ? <TeamEditor value={draft as TeamLandingData} onChange={setDraft} upload={uploadImage} /> : null}
            {sectionKey === "history" ? <HistoryEditor value={draft as HistoryLandingData} onChange={setDraft} /> : null}
          </div>
          <DialogFooter className="border-t border-djon-text/8 px-5 py-4 sm:px-6">
            <button type="button" disabled={saving || uploading} onClick={onClose} className="min-h-11 rounded-full px-5 text-xs font-black tracking-widest text-djon-text/45 disabled:opacity-50">CANCELAR</button>
            <button type="submit" disabled={saving || uploading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-djon-accent px-6 text-xs font-black tracking-widest text-djon-ink disabled:opacity-50">
              {saving || uploading ? <LoaderCircle size={15} className="animate-spin" /> : null}
              {uploading ? "ENVIANDO IMAGEM..." : saving ? "SALVANDO..." : "SALVAR ALTERAÇÕES"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function HeroEditor({ value, onChange }: { value: HeroLandingData; onChange: (value: HeroLandingData) => void }) {
  return <><TextInput label="Título" value={value.title} onChange={(title) => onChange({ ...value, title })} maxLength={120} multiline /><TextInput label="Descrição" value={value.description} onChange={(description) => onChange({ ...value, description })} maxLength={600} multiline rows={4} /><SortableTextList label="Tags" items={value.tags} maximum={4} maxLength={60} onChange={(tags) => onChange({ ...value, tags })} /></>;
}

function LifestyleEditor({ value, onChange, upload }: { value: LifestyleLandingData; onChange: (value: LifestyleLandingData) => void; upload: (file: File, current: string, apply: (url: string) => void) => void }) {
  return <><TextInput label="Texto do badge" value={value.badge} onChange={(badge) => onChange({ ...value, badge })} maxLength={50} /><TextInput label="Título" value={value.title} onChange={(title) => onChange({ ...value, title })} maxLength={140} multiline /><TextInput label="Descrição" value={value.description} onChange={(description) => onChange({ ...value, description })} maxLength={700} multiline rows={4} /><SortableTextList label="Itens — arraste para reordenar" items={value.items} maximum={6} maxLength={110} onChange={(items) => onChange({ ...value, items })} /><div className="grid gap-4 sm:grid-cols-2">{value.images.map((item, index) => <Card key={index} title={`Imagem ${index + 1}`}><ImagePicker value={item.image} label="Imagem" recommendation="1200 × 1200 px" aspect="1:1" onUpload={(file) => void upload(file, item.image, (image) => onChange({ ...value, images: value.images.map((current, itemIndex) => itemIndex === index ? { ...current, image } : current) }))} /><TextInput label="Label da imagem" value={item.label} onChange={(label) => onChange({ ...value, images: value.images.map((current, itemIndex) => itemIndex === index ? { ...current, label } : current) })} maxLength={60} /></Card>)}</div></>;
}

function CoursesEditor({ value, onChange, upload }: { value: CoursesLandingData; onChange: (value: CoursesLandingData) => void; upload: (file: File, current: string, apply: (url: string) => void) => void }) {
  const [activeCourseId, setActiveCourseId] = useState(value.courses[0]?.id ?? "");
  const activeIndex = Math.max(0, value.courses.findIndex((course) => course.id === activeCourseId));
  const activeCourse = value.courses[activeIndex];

  useEffect(() => {
    if (!value.courses.some((course) => course.id === activeCourseId)) {
      setActiveCourseId(value.courses[0]?.id ?? "");
    }
  }, [activeCourseId, value.courses]);

  if (!activeCourse) return null;

  const update = (changes: Partial<CourseLandingItem>) =>
    onChange({
      courses: value.courses.map((item, itemIndex) =>
        itemIndex === activeIndex ? { ...item, ...changes } : item,
      ),
    });

  const addCourse = () => {
    const course: CourseLandingItem = {
      id: crypto.randomUUID(),
      color: "accent",
      label: "Novo módulo",
      title: "Novo curso",
      description: "Descreva o curso.",
      image: "/images/djon-course-dj.png",
      items: [],
    };
    onChange({ courses: [...value.courses, course] });
    setActiveCourseId(course.id);
  };

  const removeActiveCourse = () => {
    const courses = value.courses.filter((_, index) => index !== activeIndex);
    setActiveCourseId(courses[Math.min(activeIndex, courses.length - 1)]?.id ?? "");
    onChange({ courses });
  };

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className={labelClass}>Itens do carrossel ({value.courses.length})</p>
        <button
          type="button"
          onClick={addCourse}
          className="inline-flex shrink-0 items-center gap-1 text-[10px] font-black text-djon-accent"
        >
          <Plus size={12} /> ADICIONAR CURSO
        </button>
      </div>

      <EditorItemTabs
        ariaLabel="Cursos configurados"
        items={value.courses.map((course) => ({ id: course.id, label: course.title }))}
        activeId={activeCourse.id}
        onChange={setActiveCourseId}
      />

      <div role="tabpanel">
        <Card
          title={`${activeIndex + 1}. ${activeCourse.title}`}
          onRemove={value.courses.length > 1 ? removeActiveCourse : undefined}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <ColorSelect value={activeCourse.color} onChange={(color) => update({ color })} />
            <TextInput label="Label" value={activeCourse.label} onChange={(label) => update({ label })} maxLength={60} />
          </div>
          <TextInput label="Título" value={activeCourse.title} onChange={(title) => update({ title })} maxLength={70} />
          <TextInput label="Descrição" value={activeCourse.description} onChange={(description) => update({ description })} maxLength={700} multiline rows={4} />
          <ImagePicker value={activeCourse.image} label="Imagem" recommendation="1200 × 1500 px" aspect="4:5" compact onUpload={(file) => void upload(file, activeCourse.image, (image) => update({ image }))} />
          <SortableTextList label="O que você vai aprender" items={activeCourse.items} maximum={8} maxLength={64} onChange={(items) => update({ items })} />
        </Card>
      </div>
    </>
  );
}

function StatsEditor({ value, onChange }: { value: StatsLandingData; onChange: (value: StatsLandingData) => void }) {
  const update = (index: number, changes: Partial<StatsLandingData["items"][number]>) => onChange({ ...value, items: value.items.map((item, itemIndex) => itemIndex === index ? { ...item, ...changes } : item) });
  return <><TextInput label="Label da seção" value={value.label} onChange={(label) => onChange({ ...value, label })} maxLength={60} /><TextInput label="Título da seção" value={value.title} onChange={(title) => onChange({ ...value, title })} maxLength={100} /><div className="flex justify-end">{value.items.length < 6 ? <button type="button" onClick={() => onChange({ ...value, items: [...value.items, { id: crypto.randomUUID(), color: "accent", icon: "sparkles", value: "+1", title: "Novo destaque", description: "Descrição" }] })} className="inline-flex items-center gap-1 text-[10px] font-black text-djon-accent"><Plus size={12} /> ADICIONAR CARD</button> : null}</div>{value.items.map((item, index) => <Card key={item.id} title={`${index + 1}. ${item.title}`} onRemove={value.items.length > 1 ? () => onChange({ ...value, items: value.items.filter((_, itemIndex) => itemIndex !== index) }) : undefined}><div className="grid gap-4 sm:grid-cols-2"><ColorSelect value={item.color} onChange={(color) => update(index, { color })} /><IconSelect value={item.icon} onChange={(icon) => update(index, { icon })} /></div><div className="grid gap-4 sm:grid-cols-2"><TextInput label="Valor em destaque" value={item.value} onChange={(valueText) => update(index, { value: valueText })} maxLength={24} /><TextInput label="Título do card" value={item.title} onChange={(title) => update(index, { title })} maxLength={70} /></div><TextInput label="Descrição" value={item.description} onChange={(description) => update(index, { description })} maxLength={180} multiline /></Card>)}</>;
}

function ShowcaseEditor({ value, onChange, upload }: { value: ShowcaseLandingData; onChange: (value: ShowcaseLandingData) => void; upload: (file: File, current: string, apply: (url: string) => void) => void }) {
  return <><ImagePicker value={value.image} label="Imagem" recommendation="1600 × 1200 px" aspect="4:3" onUpload={(file) => void upload(file, value.image, (image) => onChange({ ...value, image }))} /><TextInput label="Label da imagem" value={value.imageLabel} onChange={(imageLabel) => onChange({ ...value, imageLabel })} maxLength={60} /><TextInput label="Label da seção" value={value.label} onChange={(label) => onChange({ ...value, label })} maxLength={70} /><TextInput label="Título" value={value.title} onChange={(title) => onChange({ ...value, title })} maxLength={90} /><TextInput label="Descrição" value={value.description} onChange={(description) => onChange({ ...value, description })} maxLength={1200} multiline rows={6} />{value.items.map((item, index) => <Card key={index} title={`Destaque ${index + 1}`}><IconSelect value={item.icon} onChange={(icon) => onChange({ ...value, items: value.items.map((current, itemIndex) => itemIndex === index ? { ...current, icon } : current) })} /><TextInput label="Texto" value={item.text} onChange={(text) => onChange({ ...value, items: value.items.map((current, itemIndex) => itemIndex === index ? { ...current, text } : current) })} maxLength={70} /></Card>)}</>;
}

function TeamEditor({ value, onChange, upload }: { value: TeamLandingData; onChange: (value: TeamLandingData) => void; upload: (file: File, current: string, apply: (url: string) => void) => void }) {
  const [activeMemberId, setActiveMemberId] = useState(value.members[0]?.id ?? "");
  const activeIndex = Math.max(0, value.members.findIndex((member) => member.id === activeMemberId));
  const activeMember = value.members[activeIndex];

  useEffect(() => {
    if (!value.members.some((member) => member.id === activeMemberId)) {
      setActiveMemberId(value.members[0]?.id ?? "");
    }
  }, [activeMemberId, value.members]);

  const update = (changes: Partial<TeamLandingData["members"][number]>) =>
    onChange({
      ...value,
      members: value.members.map((item, itemIndex) =>
        itemIndex === activeIndex ? { ...item, ...changes } : item,
      ),
    });

  const addMember = () => {
    const member: TeamLandingData["members"][number] = {
      id: crypto.randomUUID(),
      color: "accent",
      image: "/images/djon-team-segredo.png",
      name: "Novo integrante",
      role: "Função",
      description: "Descrição",
    };
    onChange({ ...value, members: [...value.members, member] });
    setActiveMemberId(member.id);
  };

  const removeActiveMember = () => {
    const members = value.members.filter((_, index) => index !== activeIndex);
    setActiveMemberId(members[Math.min(activeIndex, members.length - 1)]?.id ?? "");
    onChange({ ...value, members });
  };

  return (
    <>
      <TextInput label="Label da seção" value={value.label} onChange={(label) => onChange({ ...value, label })} maxLength={70} />
      <TextInput label="Título da seção" value={value.title} onChange={(title) => onChange({ ...value, title })} maxLength={100} />
      <TextInput label="Descrição" value={value.description} onChange={(description) => onChange({ ...value, description })} maxLength={700} multiline rows={4} />

      <div className="flex items-center justify-between gap-3">
        <p className={labelClass}>Integrantes ({value.members.length})</p>
        <button
          type="button"
          onClick={addMember}
          className="inline-flex shrink-0 items-center gap-1 text-[10px] font-black text-djon-accent"
        >
          <Plus size={12} /> ADICIONAR INTEGRANTE
        </button>
      </div>

      <EditorItemTabs
        ariaLabel="Integrantes configurados"
        items={value.members.map((member) => ({ id: member.id, label: member.name }))}
        activeId={activeMember?.id ?? ""}
        onChange={setActiveMemberId}
      />

      {activeMember ? (
        <div role="tabpanel">
          <Card title={`${activeIndex + 1}. ${activeMember.name}`} onRemove={removeActiveMember}>
            <div className="grid gap-4 sm:grid-cols-2">
              <ColorSelect value={activeMember.color} onChange={(color) => update({ color })} />
              <TextInput label="Nome" value={activeMember.name} onChange={(name) => update({ name })} maxLength={70} />
            </div>
            <ImagePicker value={activeMember.image} label="Foto" recommendation="1000 × 1000 px" aspect="1:1" compact onUpload={(file) => void upload(file, activeMember.image, (image) => update({ image }))} />
            <TextInput label="Função" value={activeMember.role} onChange={(role) => update({ role })} maxLength={100} />
            <TextInput label="Descrição" value={activeMember.description} onChange={(description) => update({ description })} maxLength={220} multiline />
          </Card>
        </div>
      ) : null}
    </>
  );
}

function HistoryEditor({ value, onChange }: { value: HistoryLandingData; onChange: (value: HistoryLandingData) => void }) {
  return <><TextInput label="Label" value={value.label} onChange={(label) => onChange({ ...value, label })} maxLength={70} /><TextInput label="Título" value={value.title} onChange={(title) => onChange({ ...value, title })} maxLength={120} multiline /><TextInput label="Texto" value={value.description} onChange={(description) => onChange({ ...value, description })} maxLength={2400} multiline rows={9} />{value.items.map((item, index) => <Card key={index} title={`Marco ${index + 1}`}><TextInput label="Título / ano" value={item.title} onChange={(title) => onChange({ ...value, items: value.items.map((current, itemIndex) => itemIndex === index ? { ...current, title } : current) })} maxLength={30} /><TextInput label="Descrição" value={item.description} onChange={(description) => onChange({ ...value, items: value.items.map((current, itemIndex) => itemIndex === index ? { ...current, description } : current) })} maxLength={120} /></Card>)}</>;
}
