"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  landingDefaults,
  type LandingSectionDataMap,
  type LandingSectionKey,
} from "@/lib/landing-content";
import { hasPermission, store } from "@/lib/store";
import { LandingSectionEditor } from "@/components/landing/landing-section-editor";

type LandingContextValue = {
  content: LandingSectionDataMap;
  canEdit: boolean;
  edit: (key: LandingSectionKey) => void;
};

const LandingContext = createContext<LandingContextValue>({
  content: landingDefaults,
  canEdit: false,
  edit: () => undefined,
});

export function LandingContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<LandingSectionDataMap>(landingDefaults);
  const [canEdit, setCanEdit] = useState(false);
  const [editing, setEditing] = useState<LandingSectionKey | null>(null);

  useEffect(() => {
    let active = true;
    void Promise.all([
      store.listLandingContent().catch(() => []),
      store.restoreSession().catch(() => null),
    ]).then(([records, user]) => {
      if (!active) return;
      setContent((current) => {
        const next = { ...current };
        records.forEach((record) => {
          next[record.key] = record.data as never;
        });
        return next;
      });
      setCanEdit(hasPermission(user, "site.edit"));
    });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(
    () => ({ content, canEdit, edit: setEditing }),
    [canEdit, content],
  );

  return (
    <LandingContext.Provider value={value}>
      {children}
      {editing ? (
        <LandingSectionEditor
          sectionKey={editing}
          data={content[editing]}
          onClose={() => setEditing(null)}
          onSaved={(key, data) => {
            setContent((current) => ({ ...current, [key]: data }));
            setEditing(null);
          }}
        />
      ) : null}
    </LandingContext.Provider>
  );
}

export function useLandingSection<K extends LandingSectionKey>(key: K) {
  const context = useContext(LandingContext);
  return {
    data: context.content[key] as LandingSectionDataMap[K],
    canEdit: context.canEdit,
    edit: () => context.edit(key),
  };
}
