"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  FileText,
  ImageIcon,
  Download,
  Eye,
  X,
  Paperclip,
  File as FileIcon,
  Edit2,
} from "lucide-react";
import {
  ApiError,
  canEditMaterial,
  store,
  type Material,
  type MaterialAttachment,
  type User,
} from "@/lib/store";
import { DashboardPageSkeleton } from "@/components/loading-skeletons";
import { useLoadRecovery } from "@/hooks/use-load-recovery";
import { usePageTitle } from "@/components/page-title-manager";
import { useBodyScrollLock } from "@/hooks/use-body-scroll-lock";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.6, ease: [0.25, 0.4, 0.25, 1] as const, delay },
});

function triggerDownload(url: string, name: string) {
  if (!url) return;
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ── PDF Viewer Modal ────────────────────────────────────────────────────────
function PDFViewer({
  att,
  onClose,
}: {
  att: MaterialAttachment;
  onClose: () => void;
}) {
  const hasUrl = Boolean(att.url);

  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-djon-black/90 backdrop-blur-sm flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex flex-col gap-3 border-b border-djon-text/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <FileText size={16} className="text-djon-accent shrink-0" />
          <p className="text-djon-text font-bold text-sm truncate">
            {att.name}
          </p>
        </div>
        <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
          <button
            onClick={() => triggerDownload(att.url, att.name)}
            disabled={!hasUrl}
            className="cursor-pointer flex flex-1 items-center justify-center gap-2 rounded-full bg-djon-accent px-4 py-2 text-xs font-black tracking-widest text-djon-ink transition-[filter] hover:brightness-90 sm:flex-none"
          >
            <Download size={13} /> BAIXAR
          </button>
          <button
            onClick={onClose}
            className="cursor-pointer w-9 h-9 rounded-full bg-djon-text/8 hover:brightness-110 flex items-center justify-center transition-colors"
          >
            <X size={16} className="text-djon-text" />
          </button>
        </div>
      </div>
      <div className="flex-1 p-4">
        {hasUrl ? (
          <iframe
            src={att.url}
            className="w-full h-full rounded-xl border border-djon-text/10"
            title={att.name}
          />
        ) : (
          <div className="w-full h-full rounded-xl border border-djon-text/10 bg-djon-text/5 flex items-center justify-center">
            <p className="text-djon-text/40 text-sm font-bold">
              Arquivo indisponível.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Image Lightbox ──────────────────────────────────────────────────────────
function ImageLightbox({
  att,
  onClose,
}: {
  att: MaterialAttachment;
  onClose: () => void;
}) {
  const [imageError, setImageError] = useState(false);
  const hasUrl = Boolean(att.url) && !imageError;

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-djon-black/92 p-4 backdrop-blur-sm sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div className="absolute left-4 right-4 top-4 flex items-center justify-end gap-2 sm:left-auto sm:right-5 sm:top-5">
        <button
          onClick={(e) => {
            e.stopPropagation();
            triggerDownload(att.url, att.name);
          }}
          disabled={!att.url}
          className="cursor-pointer flex items-center gap-2 bg-djon-accent text-djon-ink px-4 py-2 rounded-full text-xs font-black tracking-widest transition-[filter] hover:brightness-90"
        >
          <Download size={13} /> BAIXAR
        </button>
        <button
          onClick={onClose}
          className="cursor-pointer w-9 h-9 rounded-full bg-djon-text/8 hover:brightness-110 flex items-center justify-center transition-colors"
        >
          <X size={16} className="text-djon-text" />
        </button>
      </div>
      {hasUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <motion.img
          src={att.url}
          alt={att.name}
          className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] as const }}
          onClick={(e) => e.stopPropagation()}
          onError={() => setImageError(true)}
        />
      ) : (
        <div
          className="w-full max-w-2xl h-[50vh] rounded-2xl border border-djon-text/10 bg-djon-text/5 flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-djon-text/40 text-sm font-bold">
            Imagem indisponível.
          </p>
        </div>
      )}
      <p className="text-djon-text/50 text-sm mt-4 font-medium">{att.name}</p>
    </motion.div>
  );
}

export default function MaterialDetailPage() {
  const [loadError, setLoadError] = useState<unknown>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  useLoadRecovery(loadError, setLoadAttempt);
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [material, setMaterial] = useState<Material | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [viewer, setViewer] = useState<MaterialAttachment | null>(null);
  useBodyScrollLock(Boolean(viewer));
  const [coverError, setCoverError] = useState(false);

  usePageTitle(material?.title);

  useEffect(() => {
    const u = store.getCurrentUser();
    if (!u) {
      router.replace("/login");
      return;
    }
    setUser(u);
    let active = true;
    setLoaded(false);
    setMaterial(null);
    setLoadError(null);
    setCoverError(false);
    store
      .fetchMaterialById(id, true)
      .then((item) => {
        if (active) setMaterial(item);
      })
      .catch((error: unknown) => {
        if (active && !(error instanceof ApiError && error.status === 404)) setLoadError(error);
      })
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [id, router, loadAttempt]);

  if (loadError || !user || !loaded) return <DashboardPageSkeleton variant="article" />;

  if (!material) {
    return (
      <div className="bg-djon-page min-h-screen flex flex-col items-center justify-center px-4 text-center sm:px-6">
        <FileText size={40} className="text-djon-text/10 mb-4" />
        <p className="text-djon-text/40 font-bold text-lg mb-6">
          Material não encontrado
        </p>
        <button
          type="button"
          onClick={() => router.back()}
          className="flex w-full max-w-xs items-center justify-center gap-2 rounded-full bg-djon-accent px-6 py-3 text-sm font-black tracking-widest text-djon-ink transition-[filter] hover:brightness-90"
        >
          <ArrowLeft size={15} /> VOLTAR
        </button>
      </div>
    );
  }

  const cover =
    material.coverImage ||
    (material.fileType === "image" ? material.fileUrl : undefined);
  const createdAt = material.createdAt
    ? new Date(material.createdAt)
    : new Date();
  const date = Number.isNaN(createdAt.getTime())
    ? "Data não informada"
    : createdAt.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
  const attachments = (material.attachments ?? []).filter(
    (att) => att && att.id && att.name,
  );
  const authorName = material.authorName || "DJ ON Academy";

  const handleAttachmentClick = (att: MaterialAttachment) => {
    if (att.type === "pdf" || att.type === "image") setViewer(att);
    else triggerDownload(att.url, att.name);
  };

  return (
    <div className="bg-djon-page min-h-screen">
      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="djon-portal-hero relative flex items-end overflow-hidden">
        <div className="absolute inset-0 z-0">
          {cover && !coverError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt=""
              className="w-full h-full object-cover opacity-40"
              onError={() => setCoverError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-djon-surface to-djon-page" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-djon-black via-djon-black/70 to-djon-black/30" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 py-14 w-full sm:px-6 sm:py-16">
          <motion.div {...fadeUp(0)}>
            <div className="mb-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 text-djon-text opacity-50 text-xs font-black tracking-widest uppercase transition-opacity hover:opacity-100"
              >
                <ArrowLeft size={14} /> VOLTAR
              </button>
            </div>
          </motion.div>

          <motion.span
            className="block text-djon-accent text-xs tracking-[0.25em] font-black uppercase mb-4"
            {...fadeUp(0.1)}
          >
            {material.category}
          </motion.span>

          <motion.h1
            className="djon-section-title font-black text-djon-text text-balance"
            {...fadeUp(0.2)}
          >
            {material.title || "Material sem título"}
          </motion.h1>

          <motion.div
            className="h-[3px] w-10 bg-djon-accent rounded-full mt-5"
            {...fadeUp(0.3)}
          />

          <motion.div
            className="mt-6 flex items-center justify-between gap-4"
            {...fadeUp(0.35)}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="djon-avatar-fallback w-8 h-8 shrink-0 rounded-full flex items-center justify-center overflow-hidden">
                {material.authorAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={material.authorAvatar}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-djon-accent text-xs font-black">
                    {authorName.charAt(0)}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold leading-tight text-djon-text">
                  {authorName}
                </p>
                <p className="text-xs text-djon-text/40">{date}</p>
              </div>
            </div>
            {canEditMaterial(user, material) && (
              <button
                type="button"
                onClick={() =>
                  router.push(`/dashboard/material/novo?edit=${material.id}`)
                }
                className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full bg-djon-accent px-5 py-2.5 text-xs font-black tracking-widest text-djon-ink transition-[filter] hover:brightness-90"
              >
                <Edit2 size={13} /> EDITAR
              </button>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── BODY ────────────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 py-14 sm:px-6 sm:py-16">
        {material.description && (
          <motion.p
            className="text-djon-text/60 text-lg leading-relaxed mb-10 border-l-2 border-djon-accent/40 pl-4"
            {...fadeUp(0)}
          >
            {material.description}
          </motion.p>
        )}

        {material.body ? (
          <motion.div
            className="material-prose"
            {...fadeUp(0.05)}
            dangerouslySetInnerHTML={{ __html: material.body }}
          />
        ) : (
          <motion.p className="text-djon-text/30 text-sm" {...fadeUp(0.05)}>
            Este material não possui conteúdo escrito. Confira os anexos abaixo.
          </motion.p>
        )}

        {/* ── ATTACHMENTS ───────────────────────────────────────────────── */}
        {attachments.length > 0 && (
          <motion.div className="mt-16" {...fadeUp(0.1)}>
            <div className="flex items-center gap-2 mb-5">
              <Paperclip size={16} className="text-djon-accent" />
              <h2 className="text-djon-text font-black text-sm tracking-widest uppercase">
                Anexos{" "}
                <span className="text-djon-text/30">
                  ({attachments.length})
                </span>
              </h2>
            </div>

            <div className="grid gap-3">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="group flex flex-col gap-4 rounded-2xl border border-djon-text/8 bg-djon-text/4 p-4 transition-all hover:brightness-110 sm:flex-row sm:items-center"
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      att.type === "pdf"
                        ? "bg-djon-warning-red/15"
                        : att.type === "image"
                          ? "bg-djon-accent/12"
                          : "bg-djon-text/8"
                    }`}
                  >
                    {att.type === "pdf" ? (
                      <FileText size={20} className="text-djon-warning-red" />
                    ) : att.type === "image" ? (
                      <ImageIcon size={20} className="text-djon-accent" />
                    ) : (
                      <FileIcon size={20} className="text-djon-text/60" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-djon-text font-bold text-sm truncate">
                      {att.name}
                    </p>
                    <p className="text-djon-text/35 text-xs uppercase tracking-widest font-bold">
                      {att.type}
                      {att.size ? ` · ${att.size}` : ""}
                    </p>
                  </div>

                  <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0">
                    {(att.type === "pdf" || att.type === "image") && (
                      <button
                        onClick={() => handleAttachmentClick(att)}
                        className="cursor-pointer flex flex-1 items-center justify-center gap-1.5 rounded-full bg-djon-text/8 px-3 py-2 text-xs font-black tracking-widest text-djon-text transition-colors hover:brightness-110 sm:flex-none"
                      >
                        <Eye size={13} /> VER
                      </button>
                    )}
                    <button
                      onClick={() => triggerDownload(att.url, att.name)}
                      className="cursor-pointer flex flex-1 items-center justify-center gap-1.5 rounded-full bg-djon-accent px-3 py-2 text-xs font-black tracking-widest text-djon-ink transition-[filter] hover:brightness-90 sm:flex-none"
                    >
                      <Download size={13} /> BAIXAR
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </section>

      {/* ── MODALS ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {viewer && viewer.type === "pdf" && (
          <PDFViewer att={viewer} onClose={() => setViewer(null)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {viewer && viewer.type === "image" && (
          <ImageLightbox att={viewer} onClose={() => setViewer(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
