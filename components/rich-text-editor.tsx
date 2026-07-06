"use client"

import { useRef, useEffect, useCallback } from "react"
import {
  Bold, Italic, Heading2, Heading3, List, ListOrdered,
  Quote, ImageIcon, Link2, Undo, Redo,
} from "lucide-react"

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLInputElement>(null)

  // Initialize content once (avoid caret jumping on controlled updates)
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || ""
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const emit = useCallback(() => {
    if (editorRef.current) onChange(editorRef.current.innerHTML)
  }, [onChange])

  const exec = (command: string, arg?: string) => {
    editorRef.current?.focus()
    document.execCommand(command, false, arg)
    emit()
  }

  const insertImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const url = ev.target?.result as string
      editorRef.current?.focus()
      document.execCommand("insertImage", false, url)
      emit()
    }
    reader.readAsDataURL(f)
    e.target.value = ""
  }

  const addLink = () => {
    const url = window.prompt("Cole o link (URL):")
    if (url) exec("createLink", url)
  }

  const isEmpty = !value || value === "<br>" || value === "<div><br></div>"

  const btn = "cursor-pointer w-9 h-9 rounded-lg flex items-center justify-center text-djon-text/50 hover:text-djon-accent hover:bg-djon-text/10 transition-colors"

  return (
    <div className="border border-djon-text/10 rounded-xl overflow-hidden bg-djon-text/5 focus-within:border-djon-accent/40 transition-colors">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 flex-wrap px-2 py-2 border-b border-djon-text/10 bg-djon-calendar-empty">
        <button type="button" onClick={() => exec("bold")} className={btn} title="Negrito"><Bold size={15} /></button>
        <button type="button" onClick={() => exec("italic")} className={btn} title="Itálico"><Italic size={15} /></button>
        <div className="w-px h-5 bg-djon-text/10 mx-1" />
        <button type="button" onClick={() => exec("formatBlock", "<h2>")} className={btn} title="Título"><Heading2 size={15} /></button>
        <button type="button" onClick={() => exec("formatBlock", "<h3>")} className={btn} title="Subtítulo"><Heading3 size={15} /></button>
        <button type="button" onClick={() => exec("formatBlock", "<blockquote>")} className={btn} title="Citação"><Quote size={15} /></button>
        <div className="w-px h-5 bg-djon-text/10 mx-1" />
        <button type="button" onClick={() => exec("insertUnorderedList")} className={btn} title="Lista"><List size={15} /></button>
        <button type="button" onClick={() => exec("insertOrderedList")} className={btn} title="Lista numerada"><ListOrdered size={15} /></button>
        <div className="w-px h-5 bg-djon-text/10 mx-1" />
        <button type="button" onClick={addLink} className={btn} title="Link"><Link2 size={15} /></button>
        <button type="button" onClick={() => imageRef.current?.click()} className={btn} title="Imagem"><ImageIcon size={15} /></button>
        <div className="w-px h-5 bg-djon-text/10 mx-1" />
        <button type="button" onClick={() => exec("undo")} className={btn} title="Desfazer"><Undo size={15} /></button>
        <button type="button" onClick={() => exec("redo")} className={btn} title="Refazer"><Redo size={15} /></button>
        <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={insertImage} />
      </div>

      {/* Editable area */}
      <div className="relative">
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
          className="material-editor min-h-[240px] max-h-[440px] overflow-y-auto px-4 py-4 text-djon-text/80 text-sm leading-relaxed focus:outline-none"
        />
      </div>
    </div>
  )
}
