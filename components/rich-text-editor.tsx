"use client"

import { useRef, useEffect, useCallback, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  Bold, Italic, Heading2, Heading3, List, ListOrdered,
  Quote, ImageIcon, Link2, Undo, Redo, Trash2,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Youtube, X,
} from "lucide-react"
import { store, type UploadedFile } from "@/lib/store"

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  onFileUploaded?: (file: UploadedFile) => void
}

const imageSizes = [
  { label: "ORIGINAL", width: "auto" },
  { label: "25%", width: "25%" },
  { label: "50%", width: "50%" },
  { label: "75%", width: "75%" },
  { label: "100%", width: "100%" },
]

type TextAlignment = "left" | "center" | "right" | "justify"
type ImageAlignment = "block" | "left" | "right"

const textAlignmentCommands: Array<{
  alignment: TextAlignment
  command: string
  label: string
  icon: typeof AlignLeft
}> = [
  { alignment: "left", command: "justifyLeft", label: "Alinhar texto à esquerda", icon: AlignLeft },
  { alignment: "center", command: "justifyCenter", label: "Centralizar texto", icon: AlignCenter },
  { alignment: "right", command: "justifyRight", label: "Alinhar texto à direita", icon: AlignRight },
  { alignment: "justify", command: "justifyFull", label: "Justificar texto", icon: AlignJustify },
]

const imageAlignments: Array<{
  alignment: ImageAlignment
  label: string
  icon: typeof AlignLeft
}> = [
  { alignment: "left", label: "Imagem à esquerda com texto ao lado", icon: AlignLeft },
  { alignment: "block", label: "Imagem centralizada sem texto ao lado", icon: AlignCenter },
  { alignment: "right", label: "Imagem à direita com texto ao lado", icon: AlignRight },
]

type ActiveFormats = {
  bold: boolean
  italic: boolean
  h2: boolean
  h3: boolean
  blockquote: boolean
  unorderedList: boolean
  orderedList: boolean
  link: boolean
  textAlign: TextAlignment
}

const emptyActiveFormats: ActiveFormats = {
  bold: false,
  italic: false,
  h2: false,
  h3: false,
  blockquote: false,
  unorderedList: false,
  orderedList: false,
  link: false,
  textAlign: "left",
}

function normalizeRootTextBlocks(editor: HTMLDivElement) {
  Array.from(editor.childNodes).forEach((node) => {
    if (node.nodeType !== Node.TEXT_NODE || !node.textContent?.trim()) return
    const paragraph = document.createElement("p")
    editor.insertBefore(paragraph, node)
    paragraph.appendChild(node)
  })
}

function emptyParagraph() {
  const paragraph = document.createElement("p")
  paragraph.appendChild(document.createElement("br"))
  return paragraph
}

function imageLayoutOf(image: HTMLImageElement) {
  const layout = image.parentElement?.closest<HTMLElement>("[data-image-layout]")
  return layout?.contains(image) ? layout : null
}

function activateImageSideEditor(layout: HTMLElement) {
  const textColumn = layout.querySelector<HTMLElement>(":scope > [data-image-text]")
  layout.contentEditable = "false"
  if (textColumn) {
    textColumn.contentEditable = "true"
    textColumn.tabIndex = 0
  }
  return textColumn
}

function ensureEditableBlockAfterImage(layout: HTMLElement) {
  let container = layout.nextElementSibling?.matches("[data-image-tail-container]")
    ? layout.nextElementSibling as HTMLElement
    : null
  let tail = container?.querySelector<HTMLElement>(":scope > [data-image-tail]") ?? null
  if (!container) {
    const nextElement = layout.nextElementSibling
    const paragraph = nextElement instanceof HTMLParagraphElement ? nextElement : emptyParagraph()
    container = document.createElement("div")
    container.dataset.imageTailContainer = "true"
    tail = document.createElement("div")
    tail.dataset.imageTail = "true"
    layout.after(container)
    container.appendChild(tail)
    tail.appendChild(paragraph)
  } else if (!tail) {
    const legacyParagraph = container.querySelector<HTMLParagraphElement>(":scope > p")
    tail = document.createElement("div")
    tail.dataset.imageTail = "true"
    container.appendChild(tail)
    tail.appendChild(legacyParagraph ?? emptyParagraph())
  }
  container.contentEditable = "false"
  tail.contentEditable = "true"
  tail.tabIndex = 0
}

function ensureImageSideLayout(editor: HTMLDivElement, image: HTMLImageElement, alignment: "left" | "right") {
  const currentLayout = imageLayoutOf(image)
  if (currentLayout) {
    currentLayout.dataset.imageLayout = alignment
    activateImageSideEditor(currentLayout)
    ensureEditableBlockAfterImage(currentLayout)
    return currentLayout
  }

  const topLevelBlock = image.parentElement !== editor
    ? image.parentElement?.closest<HTMLElement>("p, div, blockquote")
    : null
  if (topLevelBlock && topLevelBlock !== editor && editor.contains(topLevelBlock)) {
    topLevelBlock.after(image)
  }

  const nextElement = image.nextElementSibling
  const layout = document.createElement("div")
  layout.dataset.imageLayout = alignment
  image.before(layout)
  layout.appendChild(image)

  const textColumn = document.createElement("div")
  textColumn.dataset.imageText = "true"
  if (nextElement && !nextElement.matches("img, [data-image-layout]")) {
    textColumn.appendChild(nextElement)
  } else {
    textColumn.appendChild(emptyParagraph())
  }
  layout.appendChild(textColumn)
  activateImageSideEditor(layout)
  ensureEditableBlockAfterImage(layout)
  return layout
}

function unwrapImageLayout(image: HTMLImageElement) {
  const layout = imageLayoutOf(image)
  if (!layout?.parentNode) return
  const parent = layout.parentNode
  const textColumn = layout.querySelector<HTMLElement>(":scope > [data-image-text]")
  parent.insertBefore(image, layout)
  Array.from(textColumn?.childNodes ?? []).forEach((node) => parent.insertBefore(node, layout))
  layout.remove()
}

function normalizeImageLayouts(editor: HTMLDivElement) {
  editor.querySelectorAll<HTMLImageElement>("img").forEach((image) => {
    const alignment = image.dataset.imageAlign
    const width = image.dataset.imageWidth
    if (alignment === "left" || alignment === "right") {
      ensureImageSideLayout(editor, image, alignment)
      return
    }
    if (width === "25%" || width === "50%" || width === "75%") {
      image.dataset.imageAlign = "left"
      ensureImageSideLayout(editor, image, "left")
    }
  })
}

function activateVideoSideEditor(video: HTMLElement) {
  const textColumn = video.querySelector<HTMLElement>(":scope > [data-video-text]")
  video.contentEditable = "false"
  if (textColumn) {
    textColumn.contentEditable = "true"
    textColumn.tabIndex = 0
  }
  return textColumn
}

function ensureEditableBlockAfterVideo(video: HTMLElement) {
  let container = video.nextElementSibling?.matches("[data-video-tail-container]")
    ? video.nextElementSibling as HTMLElement
    : null
  let tail = container?.querySelector<HTMLElement>(":scope > [data-video-tail]") ?? null
  if (!container) {
    const nextElement = video.nextElementSibling
    const paragraph = nextElement instanceof HTMLParagraphElement ? nextElement : emptyParagraph()
    container = document.createElement("div")
    container.dataset.videoTailContainer = "true"
    tail = document.createElement("div")
    tail.dataset.videoTail = "true"
    video.after(container)
    container.appendChild(tail)
    tail.appendChild(paragraph)
  } else if (!tail) {
    const legacyParagraph = container.querySelector<HTMLParagraphElement>(":scope > p")
    tail = document.createElement("div")
    tail.dataset.videoTail = "true"
    container.appendChild(tail)
    tail.appendChild(legacyParagraph ?? emptyParagraph())
  }
  container.contentEditable = "false"
  tail.contentEditable = "true"
  tail.tabIndex = 0
}

function ensureVideoSideLayout(video: HTMLElement, alignment: "left" | "right") {
  video.dataset.videoLayout = alignment
  let textColumn = video.querySelector<HTMLElement>(":scope > [data-video-text]")
  if (!textColumn) {
    const nextElement = video.nextElementSibling
    textColumn = document.createElement("div")
    textColumn.dataset.videoText = "true"
    if (nextElement && !nextElement.matches("img, [data-image-layout], [data-video-layout]")) {
      textColumn.appendChild(nextElement)
    } else {
      textColumn.appendChild(emptyParagraph())
    }
    video.appendChild(textColumn)
  }
  activateVideoSideEditor(video)
  ensureEditableBlockAfterVideo(video)
}

function unwrapVideoSideLayout(video: HTMLElement) {
  const textColumn = video.querySelector<HTMLElement>(":scope > [data-video-text]")
  if (!textColumn || !video.parentNode) return
  const parent = video.parentNode
  const nextSibling = video.nextSibling
  Array.from(textColumn.childNodes).forEach((node) => parent.insertBefore(node, nextSibling))
  textColumn.remove()
  video.contentEditable = "false"
}

function normalizeVideoLayouts(editor: HTMLDivElement) {
  editor.querySelectorAll<HTMLElement>("[data-video-layout]").forEach((video) => {
    const alignment = video.dataset.videoLayout
    if (alignment === "left" || alignment === "right") {
      ensureVideoSideLayout(video, alignment)
    } else {
      video.contentEditable = "false"
    }
  })
}

export function RichTextEditor({ value, onChange, placeholder, onFileUploaded }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLInputElement>(null)
  const lastEmittedValueRef = useRef<string | null>(null)
  const selectedImageRef = useRef<HTMLImageElement | null>(null)
  const selectedVideoRef = useRef<HTMLElement | null>(null)
  const savedSelectionRef = useRef<Range | null>(null)
  const [imageSelected, setImageSelected] = useState(false)
  const [videoSelected, setVideoSelected] = useState(false)
  const [selectedVideoWidth, setSelectedVideoWidth] = useState("100%")
  const [selectedVideoAlignment, setSelectedVideoAlignment] = useState<ImageAlignment>("block")
  const [selectedImageWidth, setSelectedImageWidth] = useState("auto")
  const [selectedImageAlignment, setSelectedImageAlignment] = useState<ImageAlignment>("block")
  const [activeFormats, setActiveFormats] = useState<ActiveFormats>(emptyActiveFormats)
  const [youtubeModalOpen, setYoutubeModalOpen] = useState(false)
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [youtubeError, setYoutubeError] = useState("")

  const rememberSelection = useCallback(() => {
    const editor = editorRef.current
    const selection = window.getSelection()
    if (!editor || !selection?.rangeCount) return false
    const range = selection.getRangeAt(0)
    if (!editor.contains(range.commonAncestorContainer)) return false
    savedSelectionRef.current = range.cloneRange()
    return true
  }, [])

  const restoreSelection = useCallback(() => {
    const editor = editorRef.current
    const selection = window.getSelection()
    if (!editor || !selection) return false
    const anchorInsideEditor = Boolean(selection.anchorNode && editor.contains(selection.anchorNode))
    const focusInsideEditor = Boolean(document.activeElement && editor.contains(document.activeElement))
    if (anchorInsideEditor && focusInsideEditor) return true

    const range = savedSelectionRef.current
    if (!range?.startContainer.isConnected || !range.endContainer.isConnected) {
      editor.focus({ preventScroll: true })
      return false
    }
    const startElement = range.startContainer instanceof Element
      ? range.startContainer
      : range.startContainer.parentElement
    const editingHost = startElement?.closest<HTMLElement>('[contenteditable="true"]') ?? editor
    editingHost.focus({ preventScroll: true })
    selection.removeAllRanges()
    selection.addRange(range)
    return true
  }, [])

  const updateToolbarState = useCallback(() => {
    const editor = editorRef.current
    const selection = window.getSelection()
    const anchorNode = selection?.anchorNode
    if (!editor || !anchorNode || !editor.contains(anchorNode)) {
      setActiveFormats(emptyActiveFormats)
      return
    }
    rememberSelection()

    const anchorElement = anchorNode instanceof Element ? anchorNode : anchorNode.parentElement
    const blockName = String(document.queryCommandValue("formatBlock"))
      .replace(/[<>]/g, "")
      .toLowerCase()
    const blockElement = anchorElement?.closest<HTMLElement>("p, div, h2, h3, blockquote, li")
    const computedTextAlign = blockElement ? window.getComputedStyle(blockElement).textAlign : "left"
    const textAlign: TextAlignment = computedTextAlign === "center" || computedTextAlign === "right" || computedTextAlign === "justify"
      ? computedTextAlign
      : "left"

    setActiveFormats({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      h2: blockName === "h2" || Boolean(anchorElement?.closest("h2")),
      h3: blockName === "h3" || Boolean(anchorElement?.closest("h3")),
      blockquote: blockName === "blockquote" || Boolean(anchorElement?.closest("blockquote")),
      unorderedList: document.queryCommandState("insertUnorderedList"),
      orderedList: document.queryCommandState("insertOrderedList"),
      link: Boolean(anchorElement?.closest("a")),
      textAlign,
    })
  }, [rememberSelection])

  // Sincroniza carregamentos externos sem reposicionar o cursor durante a digitação.
  useEffect(() => {
    const editor = editorRef.current
    if (!editor || value === lastEmittedValueRef.current) return
    if (editor.innerHTML !== value) {
      editor.innerHTML = value || ""
      normalizeRootTextBlocks(editor)
      normalizeImageLayouts(editor)
      normalizeVideoLayouts(editor)
      savedSelectionRef.current = null
      selectedImageRef.current = null
      selectedVideoRef.current = null
      setImageSelected(false)
      setVideoSelected(false)
      setSelectedImageWidth("auto")
      setSelectedImageAlignment("block")
    }
    lastEmittedValueRef.current = value
  }, [value])

  useEffect(() => {
    document.addEventListener("selectionchange", updateToolbarState)
    return () => document.removeEventListener("selectionchange", updateToolbarState)
  }, [updateToolbarState])

  useEffect(() => {
    if (!youtubeModalOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      setYoutubeModalOpen(false)
      setYoutubeUrl("")
      setYoutubeError("")
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [youtubeModalOpen])

  const emit = useCallback(() => {
    if (!editorRef.current) return
    const clone = editorRef.current.cloneNode(true) as HTMLDivElement
    clone.querySelectorAll("[data-editor-selected]").forEach((element) => {
      element.removeAttribute("data-editor-selected")
    })
    clone.querySelectorAll<HTMLElement>("[data-video-tail-container]").forEach((container) => {
      const tail = container.querySelector<HTMLElement>(":scope > [data-video-tail]")
      Array.from(tail?.childNodes ?? container.childNodes).forEach((node) => container.before(node))
      container.remove()
    })
    clone.querySelectorAll("[data-video-layout], [data-video-text], [data-video-tail]").forEach((element) => {
      element.removeAttribute("contenteditable")
      element.removeAttribute("tabindex")
      element.removeAttribute("data-video-tail")
    })
    clone.querySelectorAll<HTMLElement>("[data-image-tail-container]").forEach((container) => {
      const tail = container.querySelector<HTMLElement>(":scope > [data-image-tail]")
      Array.from(tail?.childNodes ?? container.childNodes).forEach((node) => container.before(node))
      container.remove()
    })
    clone.querySelectorAll("[data-image-layout], [data-image-text], [data-image-tail]").forEach((element) => {
      element.removeAttribute("contenteditable")
      element.removeAttribute("tabindex")
      element.removeAttribute("data-image-tail")
    })
    clone.querySelectorAll<HTMLElement>("p, div, h2, h3, blockquote, li").forEach((element) => {
      const textAlign = element.style.textAlign
      if (textAlign === "left" || textAlign === "center" || textAlign === "right" || textAlign === "justify") {
        element.dataset.textAlign = textAlign
      }
      element.style.removeProperty("text-align")
      if (!element.getAttribute("style")) element.removeAttribute("style")
    })
    clone.querySelectorAll<HTMLImageElement>("img").forEach((image) => {
      const width = image.dataset.imageWidth || image.style.width
      if (imageSizes.some((size) => size.width === width) && width !== "auto") {
        image.dataset.imageWidth = width
      }
      image.style.removeProperty("width")
      image.style.removeProperty("height")
      image.style.removeProperty("max-width")
      if (!image.getAttribute("style")) image.removeAttribute("style")
    })
    const html = clone.innerHTML
    lastEmittedValueRef.current = html
    onChange(html)
  }, [onChange])

  const selectImage = (image: HTMLImageElement | null) => {
    selectedImageRef.current?.removeAttribute("data-editor-selected")
    if (image) image.setAttribute("data-editor-selected", "true")
    selectedImageRef.current = image
    setImageSelected(Boolean(image))
    setSelectedImageWidth(image?.dataset.imageWidth || image?.style.width || "auto")
    const alignment = image?.dataset.imageAlign
    setSelectedImageAlignment(alignment === "left" || alignment === "right" ? alignment : "block")
  }

  const selectVideo = (video: HTMLElement | null) => {
    selectedVideoRef.current?.removeAttribute("data-editor-selected")
    if (video) video.setAttribute("data-editor-selected", "true")
    selectedVideoRef.current = video
    setVideoSelected(Boolean(video))
    setSelectedVideoWidth(video?.dataset.videoWidth || "100%")
    const alignment = video?.dataset.videoLayout
    setSelectedVideoAlignment(alignment === "left" || alignment === "right" ? alignment : "block")
  }

  const handleEditorClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target
    const image = target instanceof HTMLImageElement ? target : null
    const targetElement = target instanceof Element ? target : null
    const video = targetElement?.closest("[data-video-text]")
      ? null
      : targetElement?.closest<HTMLElement>("[data-video-layout]") ?? null
    selectImage(image)
    selectVideo(video)
    if (image || video) setActiveFormats(emptyActiveFormats)
    else updateToolbarState()
  }

  const resizeSelectedImage = (width: string) => {
    const image = selectedImageRef.current
    if (!image?.isConnected) {
      selectImage(null)
      return
    }
    image.removeAttribute("width")
    image.removeAttribute("height")
    image.style.removeProperty("width")
    image.style.removeProperty("height")
    image.style.removeProperty("max-width")
    if (width === "auto") delete image.dataset.imageWidth
    else image.dataset.imageWidth = width
    if (width === "100%") {
      image.dataset.imageAlign = "block"
      unwrapImageLayout(image)
      setSelectedImageAlignment("block")
    } else if (width !== "auto") {
      const alignment = selectedImageAlignment === "right" ? "right" : "left"
      image.dataset.imageAlign = alignment
      if (editorRef.current) ensureImageSideLayout(editorRef.current, image, alignment)
      setSelectedImageAlignment(alignment)
    }
    setSelectedImageWidth(width)
    emit()
  }

  const alignSelectedImage = (alignment: ImageAlignment) => {
    const image = selectedImageRef.current
    if (!image?.isConnected) {
      selectImage(null)
      return
    }
    image.dataset.imageAlign = alignment
    if ((alignment === "left" || alignment === "right") && (selectedImageWidth === "auto" || selectedImageWidth === "100%")) {
      image.dataset.imageWidth = "50%"
      setSelectedImageWidth("50%")
    }
    if (alignment === "block") {
      unwrapImageLayout(image)
    } else if (editorRef.current) {
      ensureImageSideLayout(editorRef.current, image, alignment)
    }
    setSelectedImageAlignment(alignment)
    emit()
  }

  const removeSelectedImage = () => {
    const image = selectedImageRef.current
    if (!image?.isConnected) {
      selectImage(null)
      return
    }
    const layout = imageLayoutOf(image)
    if (layout?.parentNode) {
      const textColumn = layout.querySelector<HTMLElement>(":scope > [data-image-text]")
      const parent = layout.parentNode
      Array.from(textColumn?.childNodes ?? []).forEach((node) => parent.insertBefore(node, layout))
      layout.remove()
    } else {
      image.remove()
    }
    selectImage(null)
    emit()
    editorRef.current?.focus()
  }

  const resizeSelectedVideo = (width: string) => {
    const video = selectedVideoRef.current
    if (!video?.isConnected) return selectVideo(null)
    video.dataset.videoWidth = width === "auto" ? "100%" : width
    if (width === "100%" || width === "auto") {
      video.dataset.videoLayout = "block"
      unwrapVideoSideLayout(video)
      setSelectedVideoAlignment("block")
    } else if (selectedVideoAlignment === "block") {
      video.dataset.videoLayout = "left"
      ensureVideoSideLayout(video, "left")
      setSelectedVideoAlignment("left")
    } else {
      ensureVideoSideLayout(video, selectedVideoAlignment)
    }
    setSelectedVideoWidth(width === "auto" ? "100%" : width)
    emit()
  }

  const alignSelectedVideo = (alignment: ImageAlignment) => {
    const video = selectedVideoRef.current
    if (!video?.isConnected) return selectVideo(null)
    video.dataset.videoLayout = alignment
    if (alignment !== "block" && selectedVideoWidth === "100%") {
      video.dataset.videoWidth = "50%"
      setSelectedVideoWidth("50%")
    }
    if (alignment === "block") {
      unwrapVideoSideLayout(video)
    } else {
      ensureVideoSideLayout(video, alignment)
    }
    setSelectedVideoAlignment(alignment)
    emit()
  }

  const removeSelectedVideo = () => {
    const video = selectedVideoRef.current
    if (!video?.isConnected) return selectVideo(null)
    const textColumn = video.querySelector<HTMLElement>(":scope > [data-video-text]")
    if (textColumn && video.parentNode) {
      const parent = video.parentNode
      Array.from(textColumn.childNodes).forEach((node) => parent.insertBefore(node, video))
    }
    video.remove()
    selectVideo(null)
    emit()
    editorRef.current?.focus()
  }

  const exec = (command: string, arg?: string) => {
    restoreSelection()
    document.execCommand(command, false, arg)
    rememberSelection()
    emit()
    updateToolbarState()
  }

  const toggleBlock = (block: "h2" | "h3" | "blockquote") => {
    restoreSelection()
    const currentBlock = String(document.queryCommandValue("formatBlock"))
      .replace(/[<>]/g, "")
      .toLowerCase()
    exec("formatBlock", currentBlock === block ? "<p>" : `<${block}>`)
  }

  const insertImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget
    const f = e.target.files?.[0]
    if (!f) return
    try {
      const uploaded = await store.uploadFile(f, "rich-text")
      onFileUploaded?.(uploaded)
      restoreSelection()
      document.execCommand("insertImage", false, uploaded.url)
      const images = editorRef.current?.querySelectorAll("img")
      const insertedImage = images && images.length > 0 ? images.item(images.length - 1) : null
      if (insertedImage) {
        insertedImage.dataset.imageAlign = "block"
        if (!insertedImage.nextSibling) {
          const paragraph = document.createElement("p")
          paragraph.appendChild(document.createElement("br"))
          insertedImage.after(paragraph)
        }
      }
      selectImage(insertedImage)
      emit()
    } catch {
      // A camada de API já exibiu o motivo do erro no toast.
    } finally {
      input.value = ""
    }
  }

  const addLink = () => {
    const url = window.prompt("Cole o link (URL):")
    if (url) exec("createLink", url)
  }

  const youtubeEmbedUrl = (value: string) => {
    try {
      const url = new URL(value.trim())
      const hostname = url.hostname.replace(/^www\./, "")
      let id = ""
      if (hostname === "youtu.be") id = url.pathname.split("/").filter(Boolean)[0] ?? ""
      if (hostname === "youtube.com" || hostname === "m.youtube.com") {
        if (url.pathname === "/watch") id = url.searchParams.get("v") ?? ""
        else if (url.pathname.startsWith("/embed/") || url.pathname.startsWith("/shorts/")) {
          id = url.pathname.split("/").filter(Boolean)[1] ?? ""
        }
      }
      return /^[A-Za-z0-9_-]{6,}$/.test(id)
        ? `https://www.youtube.com/embed/${id}`
        : null
    } catch {
      return null
    }
  }

  const openYoutubeModal = () => {
    setYoutubeUrl("")
    setYoutubeError("")
    setYoutubeModalOpen(true)
  }

  const closeYoutubeModal = () => {
    setYoutubeModalOpen(false)
    setYoutubeUrl("")
    setYoutubeError("")
  }

  const insertYoutube = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const src = youtubeEmbedUrl(youtubeUrl)
    if (!src) {
      setYoutubeError("Insira um link válido do YouTube.")
      return
    }

    closeYoutubeModal()
    requestAnimationFrame(() => {
      restoreSelection()
      document.execCommand(
        "insertHTML",
        false,
        `<div data-video-layout="block" data-video-width="100%" contenteditable="false"><iframe src="${src}" title="Vídeo do YouTube" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div><p><br></p>`,
      )
      const videos = editorRef.current?.querySelectorAll<HTMLElement>("[data-video-layout]")
      const video = videos?.item((videos?.length ?? 1) - 1) ?? null
      selectImage(null)
      selectVideo(video)
      emit()
    })
  }

  const isEmpty = !value || value === "<br>" || value === "<div><br></div>"

  const btn = (active = false) => `cursor-pointer w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
    active
      ? "bg-djon-accent text-djon-ink shadow-[var(--djon-shadow-focus-soft)]"
      : "text-djon-text opacity-50 hover:opacity-100"
  }`
  const preserveSelection = (event: React.MouseEvent<HTMLButtonElement>) => {
    rememberSelection()
    event.preventDefault()
  }

  return (
    <>
      <div className="border border-djon-text/10 rounded-xl overflow-hidden bg-djon-text/5 focus-within:border-djon-accent/40 transition-colors">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 flex-wrap px-2 py-2 border-b border-djon-text/10 bg-djon-calendar-empty">
        <button type="button" onMouseDown={preserveSelection} onClick={() => exec("bold")} className={btn(activeFormats.bold)} title="Negrito" aria-label="Negrito" aria-pressed={activeFormats.bold}><Bold size={15} /></button>
        <button type="button" onMouseDown={preserveSelection} onClick={() => exec("italic")} className={btn(activeFormats.italic)} title="Itálico" aria-label="Itálico" aria-pressed={activeFormats.italic}><Italic size={15} /></button>
        <div className="w-px h-5 bg-djon-text/10 mx-1" />
        <button type="button" onMouseDown={preserveSelection} onClick={() => toggleBlock("h2")} className={btn(activeFormats.h2)} title={activeFormats.h2 ? "Remover título" : "Título"} aria-label="Título" aria-pressed={activeFormats.h2}><Heading2 size={15} /></button>
        <button type="button" onMouseDown={preserveSelection} onClick={() => toggleBlock("h3")} className={btn(activeFormats.h3)} title={activeFormats.h3 ? "Remover subtítulo" : "Subtítulo"} aria-label="Subtítulo" aria-pressed={activeFormats.h3}><Heading3 size={15} /></button>
        <button type="button" onMouseDown={preserveSelection} onClick={() => toggleBlock("blockquote")} className={btn(activeFormats.blockquote)} title={activeFormats.blockquote ? "Remover citação" : "Citação"} aria-label="Citação" aria-pressed={activeFormats.blockquote}><Quote size={15} /></button>
        <div className="w-px h-5 bg-djon-text/10 mx-1" />
        <button type="button" onMouseDown={preserveSelection} onClick={() => exec("insertUnorderedList")} className={btn(activeFormats.unorderedList)} title="Lista" aria-label="Lista" aria-pressed={activeFormats.unorderedList}><List size={15} /></button>
        <button type="button" onMouseDown={preserveSelection} onClick={() => exec("insertOrderedList")} className={btn(activeFormats.orderedList)} title="Lista numerada" aria-label="Lista numerada" aria-pressed={activeFormats.orderedList}><ListOrdered size={15} /></button>
        <div className="w-px h-5 bg-djon-text/10 mx-1" />
        {textAlignmentCommands.map(({ alignment, command, label, icon: Icon }) => (
          <button
            key={alignment}
            type="button"
            onMouseDown={preserveSelection}
            onClick={() => exec(command)}
            className={btn(activeFormats.textAlign === alignment)}
            title={label}
            aria-label={label}
            aria-pressed={activeFormats.textAlign === alignment}
          >
            <Icon size={15} />
          </button>
        ))}
        <div className="w-px h-5 bg-djon-text/10 mx-1" />
        <button type="button" onMouseDown={preserveSelection} onClick={addLink} className={btn(activeFormats.link)} title="Link" aria-label="Link" aria-pressed={activeFormats.link}><Link2 size={15} /></button>
        <button type="button" onMouseDown={preserveSelection} onClick={() => imageRef.current?.click()} className={btn(imageSelected)} title="Imagem" aria-label="Imagem" aria-pressed={imageSelected}><ImageIcon size={15} /></button>
        <button type="button" onMouseDown={preserveSelection} onClick={openYoutubeModal} className={btn(videoSelected)} title="Vídeo do YouTube" aria-label="Vídeo do YouTube" aria-pressed={videoSelected}><Youtube size={16} /></button>
        <div className="w-px h-5 bg-djon-text/10 mx-1" />
        <button type="button" onMouseDown={preserveSelection} onClick={() => exec("undo")} className={btn()} title="Desfazer" aria-label="Desfazer"><Undo size={15} /></button>
        <button type="button" onMouseDown={preserveSelection} onClick={() => exec("redo")} className={btn()} title="Refazer" aria-label="Refazer"><Redo size={15} /></button>
        <input ref={imageRef} type="file" accept=".jpg,.jpeg,.png,.webp,.gif" className="hidden" onChange={insertImage} />
      </div>

      {imageSelected && (
        <div className="flex flex-wrap items-center gap-2 border-b border-djon-text/10 bg-djon-accent/5 px-3 py-2">
          <span className="flex items-center gap-1.5 text-djon-label font-black tracking-widest text-djon-text/45">
            <ImageIcon size={13} className="text-djon-accent" /> IMAGEM
          </span>
          <div className="flex items-center gap-1 border-l border-djon-text/10 pl-2">
            {imageAlignments.map(({ alignment, label, icon: Icon }) => (
              <button
                key={alignment}
                type="button"
                onClick={() => alignSelectedImage(alignment)}
                aria-label={label}
                title={label}
                aria-pressed={selectedImageAlignment === alignment}
                className={`cursor-pointer flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                  selectedImageAlignment === alignment
                    ? "bg-djon-accent text-djon-ink"
                    : "bg-djon-text/5 text-djon-text/45 hover:brightness-110"
                }`}
              >
                <Icon size={13} />
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1 sm:ml-auto">
            {imageSizes.map((size) => (
              <button
                key={size.width}
                type="button"
                onClick={() => resizeSelectedImage(size.width)}
                aria-label={`Definir largura da imagem como ${size.label.toLowerCase()}`}
                className={`cursor-pointer rounded-lg px-2 py-1.5 text-djon-label font-black tracking-wide transition-colors ${
                  selectedImageWidth === size.width
                    ? "bg-djon-accent text-djon-ink"
                    : "bg-djon-text/5 text-djon-text/45 hover:brightness-110"
                }`}
              >
                {size.label}
              </button>
            ))}
            <button
              type="button"
              onClick={removeSelectedImage}
              aria-label="Remover imagem do conteúdo"
              title="Remover imagem"
              className="cursor-pointer ml-1 flex h-7 w-7 items-center justify-center rounded-lg bg-djon-warning-red/10 text-djon-warning-red transition-colors hover:brightness-110"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      )}

      {videoSelected && (
        <div className="flex flex-wrap items-center gap-2 border-b border-djon-text/10 bg-djon-accent/5 px-3 py-2">
          <span className="flex items-center gap-1.5 text-djon-label font-black tracking-widest text-djon-text/45"><Youtube size={14} className="text-djon-accent" /> YOUTUBE</span>
          <div className="flex items-center gap-1 border-l border-djon-text/10 pl-2">
            {imageAlignments.map(({ alignment, label, icon: Icon }) => (
              <button key={alignment} type="button" onClick={() => alignSelectedVideo(alignment)} aria-label={label.replace("Imagem", "Vídeo")} aria-pressed={selectedVideoAlignment === alignment} className={`flex h-7 w-7 items-center justify-center rounded-lg ${selectedVideoAlignment === alignment ? "bg-djon-accent text-djon-ink" : "bg-djon-text/5 text-djon-text/45"}`}><Icon size={13} /></button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1 sm:ml-auto">
            {imageSizes.filter((size) => size.width !== "auto").map((size) => (
              <button key={size.width} type="button" onClick={() => resizeSelectedVideo(size.width)} className={`rounded-lg px-2 py-1.5 text-djon-label font-black ${selectedVideoWidth === size.width ? "bg-djon-accent text-djon-ink" : "bg-djon-text/5 text-djon-text/45"}`}>{size.label}</button>
            ))}
            <button type="button" onClick={removeSelectedVideo} aria-label="Remover vídeo" className="ml-1 flex h-7 w-7 items-center justify-center rounded-lg bg-djon-warning-red/10 text-djon-warning-red"><Trash2 size={13} /></button>
          </div>
        </div>
      )}

      {/* Editable area */}
      <div
        className="relative h-[520px] min-h-[360px] max-h-[80vh] resize-y overflow-hidden"
        data-lenis-prevent="true"
        data-lenis-prevent-wheel="true"
        data-lenis-prevent-touch="true"
        onWheel={(event) => event.stopPropagation()}
        onTouchMove={(event) => event.stopPropagation()}
      >
        {isEmpty && (
          <span className="absolute top-4 left-4 text-djon-text/25 text-sm pointer-events-none">
            {placeholder || "Escreva o conteúdo do material..."}
          </span>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={emit}
          onBlur={emit}
          onFocus={() => document.execCommand("defaultParagraphSeparator", false, "p")}
          onClick={handleEditorClick}
          onKeyUp={updateToolbarState}
          onMouseUp={updateToolbarState}
          className="material-editor djon-scroll h-full overflow-y-auto overscroll-contain px-4 py-4 text-djon-text/80 text-sm leading-relaxed focus:outline-none"
        />
      </div>
      </div>

      <AnimatePresence>
        {youtubeModalOpen && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-djon-black/70 p-4 backdrop-blur-sm sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeYoutubeModal()
            }}
          >
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-labelledby="youtube-modal-title"
              aria-describedby="youtube-modal-description"
              className="djon-scroll my-4 max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-2xl border border-djon-text/10 bg-djon-surface-2 p-5 shadow-2xl sm:my-6 sm:p-6"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              data-lenis-prevent
              data-lenis-prevent-wheel
              data-lenis-prevent-touch
            >
              <form onSubmit={insertYoutube}>
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-djon-accent/15 text-djon-accent">
                      <Youtube size={18} />
                    </span>
                    <div>
                      <p className="mb-1 text-xs font-black uppercase tracking-widest text-djon-accent">
                        VÍDEO DO YOUTUBE
                      </p>
                      <h2 id="youtube-modal-title" className="text-xl font-black tracking-tighter text-djon-text">
                        Inserir vídeo
                      </h2>
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label="Fechar inserção de vídeo"
                    onClick={closeYoutubeModal}
                    className="cursor-pointer text-djon-text opacity-40 transition-opacity hover:opacity-100"
                  >
                    <X size={18} />
                  </button>
                </div>

                <p id="youtube-modal-description" className="mb-5 text-sm leading-relaxed text-djon-text/50">
                  Cole o link público ou privado do YouTube.
                </p>

                <label htmlFor="youtube-video-url" className="mb-2 block text-xs font-bold uppercase tracking-widest text-djon-text/50">
                  Link do YouTube
                </label>
                <input
                  id="youtube-video-url"
                  type="text"
                  inputMode="url"
                  autoFocus
                  value={youtubeUrl}
                  onChange={(event) => {
                    setYoutubeUrl(event.target.value)
                    if (youtubeError) setYoutubeError("")
                  }}
                  placeholder="https://www.youtube.com/watch?v=..."
                  aria-invalid={Boolean(youtubeError)}
                  aria-describedby={youtubeError ? "youtube-video-error" : undefined}
                  className="w-full rounded-xl border border-djon-text/15 bg-djon-text/5 px-4 py-3 text-sm text-djon-text outline-none transition-colors placeholder:text-djon-text/25 focus:border-djon-accent"
                />
                {youtubeError && (
                  <p id="youtube-video-error" role="alert" className="mt-2 text-xs font-bold text-djon-warning-red">
                    {youtubeError}
                  </p>
                )}

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={closeYoutubeModal}
                    className="cursor-pointer flex-1 rounded-full border border-djon-text/15 py-3 text-xs font-black tracking-widest text-djon-text/60 transition-opacity hover:opacity-70"
                  >
                    CANCELAR
                  </button>
                  <button
                    type="submit"
                    className="cursor-pointer flex-1 rounded-full bg-djon-accent py-3 text-xs font-black tracking-widest text-djon-ink transition-colors hover:brightness-110"
                  >
                    INSERIR VÍDEO
                  </button>
                </div>
              </form>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
