"use client";

import { usePortalRevision } from "@/hooks/use-portal-revision";
import Image from "next/image";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ImageIcon, LoaderCircle, Pencil, Trash2, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { notifySuccess } from "@/lib/feedback";
import type {
  PortalHeroDefaults,
  PortalHeroEditorSection,
} from "@/lib/portal-hero-groups";
import {
  hasPermission,
  store,
  type PortalHeroContent,
  type PortalHeroKey,
} from "@/lib/store";

type EditablePortalHeroProps = {
  heroKey: PortalHeroKey;
  defaults: PortalHeroDefaults;
  bannerKey?: PortalHeroKey;
  bannerDefaults?: PortalHeroDefaults;
  editorSections?: readonly PortalHeroEditorSection[];
  editable?: boolean;
  variables?: Record<string, string>;
  accentLines?: number[];
  showDivider?: boolean;
  children?: React.ReactNode;
};

type HeroTextDraft = Pick<
  PortalHeroContent,
  "label" | "title" | "description"
>;

const fadeUp = (delay: number) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.55, delay },
});

const EMPTY_VARIABLES: Record<string, string> = {};
const EMPTY_ACCENT_LINES: number[] = [];

function replaceVariables(value: string, variables: Record<string, string>) {
  return Object.entries(variables).reduce(
    (result, [name, replacement]) =>
      result.replaceAll(`{{${name}}}`, replacement),
    value,
  );
}

function titleLines(title: string, accentLines: number[]) {
  return title.split("\n").map((line, index, lines) => (
    <Fragment key={`${index}:${line}`}>
      {accentLines.includes(index) ? (
        <span
          style={{
            color: "var(--djon-color-accent)",
            WebkitTextStroke: "2px var(--djon-color-page)",
            paintOrder: "stroke fill",
            letterSpacing: "0.04em",
          }}
        >
          {line}
        </span>
      ) : (
        line
      )}
      {index < lines.length - 1 ? <br /> : null}
    </Fragment>
  ));
}

function contentFromDefaults(
  key: PortalHeroKey,
  defaults: PortalHeroDefaults,
): PortalHeroContent {
  return { key, ...defaults };
}

export function EditablePortalHero({
  heroKey,
  defaults,
  bannerKey = heroKey,
  bannerDefaults,
  editorSections,
  editable = true,
  variables = EMPTY_VARIABLES,
  accentLines = EMPTY_ACCENT_LINES,
  showDivider = true,
  children,
}: EditablePortalHeroProps) {
  const dataRevision = usePortalRevision("portal-content", "users");
  const [contents, setContents] = useState<
    Partial<Record<PortalHeroKey, PortalHeroContent>>
  >(() => ({ [heroKey]: contentFromDefaults(heroKey, defaults) }));
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [drafts, setDrafts] = useState<
    Partial<Record<PortalHeroKey, HeroTextDraft>>
  >({});
  const [draftBanner, setDraftBanner] = useState<string | null>(
    defaults.banner,
  );
  const [activeSectionKey, setActiveSectionKey] =
    useState<PortalHeroKey>(heroKey);
  const uploadRef = useRef<HTMLInputElement>(null);
  const pendingUploadIdRef = useRef<string | null>(null);

  const sections: readonly PortalHeroEditorSection[] =
    editorSections?.length
      ? editorSections
      : [{ key: heroKey, name: "Conteúdo", defaults }];

  const defaultsFor = (key: PortalHeroKey) =>
    sections.find((section) => section.key === key)?.defaults ?? defaults;

  useEffect(() => {
    let active = true;
    const keys = Array.from(
      new Set<PortalHeroKey>([
        heroKey,
        bannerKey,
        ...(editorSections?.map((section) => section.key) ?? []),
      ]),
    );
    void Promise.all(
      keys.map((key) =>
        store.fetchPortalHeroContent(key).catch(() => undefined),
      ),
    ).then((loaded) => {
      if (!active) return;
      setContents((current) => {
        const next = { ...current };
        loaded.forEach((loadedContent) => {
          if (loadedContent) next[loadedContent.key] = loadedContent;
        });
        return next;
      });
      setImageError(false);
    });
    return () => {
      active = false;
    };
  }, [bannerKey, editorSections, heroKey, dataRevision]);

  const content =
    contents[heroKey] ?? contentFromDefaults(heroKey, defaultsFor(heroKey));
  const bannerContent =
    contents[bannerKey] ??
    contentFromDefaults(
      bannerKey,
      bannerDefaults ?? defaultsFor(bannerKey),
    );
  const resolved = useMemo(
    () => ({
      label: replaceVariables(content.label, variables),
      title: replaceVariables(content.title, variables),
      description: replaceVariables(content.description, variables),
    }),
    [content.description, content.label, content.title, variables],
  );
  const canEdit =
    editable && hasPermission(store.getCurrentUser(), "portal.edit");
  const activeSection =
    sections.find((section) => section.key === activeSectionKey) ?? sections[0];
  const activeContent =
    contents[activeSection.key] ??
    contentFromDefaults(activeSection.key, activeSection.defaults);
  const activeDraft = drafts[activeSection.key] ?? activeContent;

  const cleanupPendingUpload = () => {
    const fileId = pendingUploadIdRef.current;
    pendingUploadIdRef.current = null;
    if (fileId) {
      void store.deleteFile(fileId, { silent: true }).catch(() => undefined);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (saving || uploading) return;
    if (nextOpen) {
      const nextDrafts: Partial<Record<PortalHeroKey, HeroTextDraft>> = {};
      sections.forEach((section) => {
        const sectionContent =
          contents[section.key] ??
          contentFromDefaults(section.key, section.defaults);
        nextDrafts[section.key] = {
          label:
            section.key === heroKey ? resolved.label : sectionContent.label,
          title: sectionContent.title,
          description: sectionContent.description,
        };
      });
      setDrafts(nextDrafts);
      setDraftBanner(bannerContent.banner);
      setActiveSectionKey(
        sections.some((section) => section.key === heroKey)
          ? heroKey
          : sections[0].key,
      );
      setOpen(true);
      return;
    }
    cleanupPendingUpload();
    setOpen(false);
  };

  const updateActiveDraft = (changes: Partial<HeroTextDraft>) => {
    setDrafts((current) => ({
      ...current,
      [activeSection.key]: {
        label: activeDraft.label,
        title: activeDraft.title,
        description: activeDraft.description,
        ...changes,
      },
    }));
  };

  const handleBannerUpload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const previousPendingId = pendingUploadIdRef.current;
      const uploaded = await store.uploadFile(file, "portal-banner");
      pendingUploadIdRef.current = uploaded.id;
      setDraftBanner(uploaded.url);
      if (previousPendingId) {
        await store
          .deleteFile(previousPendingId, { silent: true })
          .catch(() => undefined);
      }
    } finally {
      setUploading(false);
      if (uploadRef.current) uploadRef.current.value = "";
    }
  };

  const handleRemoveBanner = () => {
    cleanupPendingUpload();
    setDraftBanner(null);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const updatedContents: Partial<
        Record<PortalHeroKey, PortalHeroContent>
      > = {};
      const orderedSections = [
        ...sections.filter((section) => section.key !== bannerKey),
        ...sections.filter((section) => section.key === bannerKey),
      ];
      for (const section of orderedSections) {
        const sectionContent =
          contents[section.key] ??
          contentFromDefaults(section.key, section.defaults);
        const draft = drafts[section.key] ?? sectionContent;
        const updated = await store.updatePortalHeroContent(
          section.key,
          {
            label:
              section.key === heroKey && draft.label === resolved.label
                ? sectionContent.label
                : draft.label,
            title: draft.title,
            description: draft.description,
            ...(section.key === bannerKey ? { banner: draftBanner } : {}),
          },
          { silent: true },
        );
        updatedContents[updated.key] = updated;
      }
      if (!sections.some((section) => section.key === bannerKey)) {
        const updated = await store.updatePortalHeroContent(
          bannerKey,
          { banner: draftBanner },
          { silent: true },
        );
        updatedContents[updated.key] = updated;
      }
      pendingUploadIdRef.current = null;
      setContents((current) => ({ ...current, ...updatedContents }));
      setImageError(false);
      setOpen(false);
      notifySuccess(
        "Hero atualizado",
        sections.length > 1
          ? "O banner e os textos de cada seção foram salvos."
          : "O conteúdo desta página foi salvo.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <section className="djon-portal-hero relative flex items-center overflow-hidden bg-djon-black">
        <div className="absolute inset-0 z-0 bg-djon-black">
          {bannerContent.banner && !imageError ? (
            <Image
              loader={({ src }) => src}
              unoptimized
              src={bannerContent.banner}
              alt=""
              fill
              sizes="100vw"
              className="object-cover opacity-30"
              preload
              onError={() => setImageError(true)}
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-r from-djon-black via-djon-black/80 to-djon-black/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-djon-black/70 via-transparent to-djon-black/20" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
          <div className="max-w-3xl">
            <motion.span
              className="mb-4 block text-xs font-black uppercase tracking-[0.25em] text-djon-accent"
              {...fadeUp(0.1)}
            >
              {resolved.label}
            </motion.span>
            <motion.h1
              className="djon-hero-title font-black text-djon-text"
              {...fadeUp(0.2)}
            >
              {titleLines(resolved.title, accentLines)}
            </motion.h1>
            {showDivider ? (
              <motion.div
                className="mt-4 h-[3px] w-10 rounded-full bg-djon-accent"
                {...fadeUp(0.25)}
              />
            ) : null}
            <motion.p
              className="mt-4 max-w-lg text-base leading-relaxed text-djon-text/50"
              {...fadeUp(0.3)}
            >
              {resolved.description}
            </motion.p>
            {canEdit ? (
              <button
                type="button"
                onClick={() => handleOpenChange(true)}
                className="mt-5 flex w-fit cursor-pointer items-center gap-2 rounded-full bg-djon-black/40 px-5 py-2.5 text-xs font-bold text-djon-text opacity-75 backdrop-blur-md transition-[opacity,transform,filter] duration-200 ease-out hover:-translate-y-0.5 hover:opacity-100 hover:brightness-110 active:translate-y-0 active:scale-[0.98]"
              >
                <Pencil size={13} /> EDITAR
              </button>
            ) : null}
            {children ? (
              <motion.div className="mt-8" {...fadeUp(0.4)}>
                {children}
              </motion.div>
            ) : null}
          </div>
        </div>
      </section>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          data-lenis-prevent
          data-lenis-prevent-wheel
          data-lenis-prevent-touch
          overlayClassName="bg-djon-black/85 backdrop-blur-sm"
          className="djon-scroll max-h-[calc(100svh-2rem)] overflow-y-auto border-djon-text/10 bg-djon-surface p-0 text-djon-text sm:max-w-xl"
        >
          <form onSubmit={handleSave}>
            <DialogHeader className="border-b border-djon-text/8 px-5 py-5 pr-12 sm:px-6">
              <p className="text-xs font-black tracking-[0.22em] text-djon-accent">
                EDIÇÃO DO PORTAL
              </p>
              <DialogTitle className="text-2xl font-black tracking-tight text-djon-text">
                Editar hero
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed text-djon-text/45">
                {sections.length > 1
                  ? "Use um único banner e configure os textos exibidos em cada seção."
                  : "Altere somente o conteúdo desta página. A prévia do banner usa o mesmo recorte do hero."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 px-5 py-5 sm:px-6">
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="text-xs font-black tracking-widest text-djon-text/45">
                    BANNER
                  </label>
                  <span className="text-[11px] font-bold text-djon-text/30">
                    Recomendado: 1920 × 720 px
                  </span>
                </div>
                <div className="relative flex h-40 items-center justify-center overflow-hidden rounded-2xl border border-djon-text/10 bg-djon-black">
                  {draftBanner ? (
                    <Image
                      loader={({ src }) => src}
                      unoptimized
                      src={draftBanner}
                      alt="Prévia do banner"
                      fill
                      sizes="560px"
                      className="object-cover opacity-55"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-djon-text/25">
                      <ImageIcon size={28} />
                      <span className="text-xs font-black tracking-widest">
                        FUNDO PRETO
                      </span>
                    </div>
                  )}
                </div>
                <input
                  ref={uploadRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(event) =>
                    void handleBannerUpload(event.target.files?.[0])
                  }
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={uploading || saving}
                    onClick={() => uploadRef.current?.click()}
                    className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full bg-djon-text/8 px-4 py-2 text-xs font-black tracking-widest text-djon-text transition-[filter] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {uploading ? (
                      <LoaderCircle size={14} className="animate-spin" />
                    ) : (
                      <Upload size={14} />
                    )}
                    {draftBanner ? "TROCAR IMAGEM" : "ADICIONAR IMAGEM"}
                  </button>
                  {draftBanner ? (
                    <button
                      type="button"
                      disabled={uploading || saving}
                      onClick={handleRemoveBanner}
                      className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-djon-warning-red/30 px-4 py-2 text-xs font-black tracking-widest text-djon-warning-red transition-[filter] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 size={14} /> REMOVER BANNER
                    </button>
                  ) : null}
                </div>
              </div>

              {sections.length > 1 ? (
                <div>
                  <p className="mb-2 text-xs font-black tracking-widest text-djon-text/45">
                    SEÇÃO
                  </p>
                  <div
                    role="tablist"
                    aria-label="Seções do hero"
                    className="flex flex-wrap gap-2"
                  >
                    {sections.map((section) => {
                      const active = section.key === activeSection.key;
                      return (
                        <button
                          key={section.key}
                          type="button"
                          role="tab"
                          aria-selected={active}
                          onClick={() => setActiveSectionKey(section.key)}
                          className={`min-h-10 cursor-pointer rounded-full border px-4 py-2 text-xs font-black transition-[background-color,border-color,color,filter] hover:brightness-110 ${
                            active
                              ? "border-djon-accent/40 bg-djon-accent/12 text-djon-accent"
                              : "border-djon-text/10 bg-djon-text/4 text-djon-text/45"
                          }`}
                        >
                          {section.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <div>
                <label
                  htmlFor={`${activeSection.key}-label`}
                  className="mb-2 block text-xs font-black tracking-widest text-djon-text/45"
                >
                  LABEL
                </label>
                <Input
                  id={`${activeSection.key}-label`}
                  required
                  maxLength={80}
                  value={activeDraft.label}
                  onChange={(event) =>
                    updateActiveDraft({ label: event.target.value })
                  }
                  className="h-11 rounded-xl border-djon-text/10 bg-djon-text/5 text-djon-text focus-visible:border-djon-accent/60 focus-visible:ring-djon-accent/15"
                />
              </div>

              <div>
                <label
                  htmlFor={`${activeSection.key}-title`}
                  className="mb-2 block text-xs font-black tracking-widest text-djon-text/45"
                >
                  TÍTULO
                </label>
                <Textarea
                  id={`${activeSection.key}-title`}
                  required
                  maxLength={180}
                  rows={3}
                  value={activeDraft.title}
                  onChange={(event) =>
                    updateActiveDraft({ title: event.target.value })
                  }
                  className="min-h-24 resize-y rounded-xl border-djon-text/10 bg-djon-text/5 text-djon-text focus-visible:border-djon-accent/60 focus-visible:ring-djon-accent/15"
                />
                <p className="mt-1.5 text-[11px] text-djon-text/30">
                  Use uma nova linha para controlar as quebras do título.
                </p>
              </div>

              <div>
                <label
                  htmlFor={`${activeSection.key}-description`}
                  className="mb-2 block text-xs font-black tracking-widest text-djon-text/45"
                >
                  DESCRIÇÃO
                </label>
                <Textarea
                  id={`${activeSection.key}-description`}
                  required
                  maxLength={1000}
                  rows={4}
                  value={activeDraft.description}
                  onChange={(event) =>
                    updateActiveDraft({ description: event.target.value })
                  }
                  className="min-h-28 resize-y rounded-xl border-djon-text/10 bg-djon-text/5 text-djon-text focus-visible:border-djon-accent/60 focus-visible:ring-djon-accent/15"
                />
                {activeDraft.title.includes("{{") ||
                activeDraft.description.includes("{{") ||
                activeDraft.label.includes("{{") ? (
                  <p className="mt-1.5 text-[11px] leading-relaxed text-djon-text/30">
                    Os valores entre chaves são preenchidos automaticamente para cada usuário.
                  </p>
                ) : null}
              </div>
            </div>

            <DialogFooter className="border-t border-djon-text/8 px-5 py-4 sm:px-6">
              <button
                type="button"
                disabled={saving || uploading}
                onClick={() => handleOpenChange(false)}
                className="min-h-11 cursor-pointer rounded-full px-5 text-xs font-black tracking-widest text-djon-text/45 transition-colors hover:text-djon-text disabled:cursor-not-allowed disabled:opacity-50"
              >
                CANCELAR
              </button>
              <button
                type="submit"
                disabled={saving || uploading}
                className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-djon-accent px-6 text-xs font-black tracking-widest text-djon-ink transition-[filter] hover:brightness-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <LoaderCircle size={15} className="animate-spin" />
                ) : null}
                {saving ? "SALVANDO..." : "SALVAR ALTERAÇÕES"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
