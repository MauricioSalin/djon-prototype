"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Edit2,
  X,
  GraduationCap,
  Mail,
  Phone,
  RotateCcw,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import {
  ALL_PERMISSIONS,
  hasPermission,
  store,
  type Permission,
  type Unit,
  type User,
} from "@/lib/store";
import { formatPhone, phoneMatchesSearch } from "@/lib/phone";
import {
  ListPagination,
  useListPagination,
} from "@/components/list-pagination";
import { DjonSelect } from "@/components/djon-select";
import { DashboardPageSkeleton } from "@/components/loading-skeletons";

const inp =
  "w-full bg-djon-text/5 border border-djon-text/10 rounded-xl px-4 py-2.5 text-djon-text text-sm placeholder:text-djon-text/20 focus:outline-none focus:border-djon-accent/50 transition-all";

type FormState = {
  name: string;
  email: string;
  whatsapp: string;
  unitId: string;
};
const emptyForm: FormState = {
  name: "",
  email: "",
  whatsapp: "",
  unitId: "",
};
const permissionOptions: {
  value: Permission;
  label: string;
  description: string;
  group: "Administração" | "Acadêmico" | "Estrutura" | "Controle";
}[] = [
  {
    value: "admin.access",
    label: "Painel administrativo",
    description: "Acessar a visão geral, indicadores e atalhos da administração.",
    group: "Administração",
  },
  {
    value: "users.manage",
    label: "Gerenciar alunos e professores",
    description: "Cadastrar, editar, desativar e restaurar usuários.",
    group: "Administração",
  },
  {
    value: "permissions.manage",
    label: "Delegar privilégios",
    description: "Configurar acessos de outros professores, exceto os próprios.",
    group: "Administração",
  },
  {
    value: "leads.manage",
    label: "Gerenciar contatos",
    description: "Acessar e administrar os contatos comerciais.",
    group: "Administração",
  },
  {
    value: "events.manage",
    label: "Gerenciar eventos oficiais",
    description: "Criar eventos DJ ON e editar ou remover eventos de qualquer autor.",
    group: "Administração",
  },
  {
    value: "bookings.manage",
    label: "Gerenciar toda a agenda",
    description: "Operar agendamentos de todas as unidades e responsáveis.",
    group: "Acadêmico",
  },
  {
    value: "bookings.review",
    label: "Revisar treinos globalmente",
    description: "Aprovar ou recusar solicitações de qualquer unidade.",
    group: "Acadêmico",
  },
  {
    value: "courses.manage",
    label: "Gerenciar todos os cursos e turmas",
    description: "Administrar cursos, turmas e responsáveis em todas as unidades.",
    group: "Acadêmico",
  },
  {
    value: "attendance.manage",
    label: "Gerenciar presença global",
    description: "Registrar frequência em turmas de qualquer professor.",
    group: "Acadêmico",
  },
  {
    value: "materials.manage",
    label: "Gerenciar todo o acervo",
    description: "Administrar materiais de outros autores e categorias do acervo.",
    group: "Acadêmico",
  },
  {
    value: "units.manage",
    label: "Gerenciar unidades",
    description: "Cadastrar, editar e desativar unidades.",
    group: "Estrutura",
  },
  {
    value: "equipments.manage",
    label: "Gerenciar equipamentos",
    description: "Cadastrar, editar e desativar equipamentos.",
    group: "Estrutura",
  },
  {
    value: "notifications.manage",
    label: "Enviar notificações",
    description: "Criar comunicações administrativas para usuários do portal.",
    group: "Controle",
  },
  {
    value: "portal.edit",
    label: "Edição do portal",
    description: "Editar os textos e banners dos heroes do portal.",
    group: "Controle",
  },
  {
    value: "site.edit",
    label: "Edição do site principal",
    description: "Editar as seções públicas da landing page e suas imagens.",
    group: "Controle",
  },
];

const permissionGroups = [
  "Administração",
  "Acadêmico",
  "Estrutura",
  "Controle",
] as const;

export default function ProfessoresAdminPage() {
  const [professors, setProfessors] = useState<User[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [permissionTarget, setPermissionTarget] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const hasTotalAccess = ALL_PERMISSIONS.every((permission) =>
    permissions.includes(permission),
  );
  const [removingUser, setRemovingUser] = useState<User | null>(null);
  const [removalAction, setRemovalAction] = useState<
    "deactivate" | "delete" | null
  >(null);

  const load = () => setProfessors(store.getProfessors());

  useEffect(() => {
    void Promise.all([store.listAdminUsers(true), store.getPublicUnits()])
      .then(() => {
        setCurrentUser(store.getCurrentUser());
        load();
        setUnits(store.getUnits().filter((unit) => unit.active));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!removingUser || removalAction) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setRemovingUser(null);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [removalAction, removingUser]);

  const openNew = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (u: User) => {
    setForm({
      name: u.name,
      email: u.email,
      whatsapp: formatPhone(u.whatsapp),
      unitId: u.unitId ?? "",
    });
    setEditingId(u.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await store.updateUser(editingId, {
        name: form.name,
        email: form.email,
        whatsapp: form.whatsapp,
        unitId: form.unitId,
      });
    } else {
      await store.addUser({
        name: form.name,
        email: form.email,
        whatsapp: form.whatsapp,
        role: "professor",
        unitId: form.unitId,
      });
    }
    setShowForm(false);
    load();
  };

  const handleDeactivate = async () => {
    if (!removingUser || removalAction) return;
    setRemovalAction("deactivate");
    try {
      await store.deleteUser(removingUser.id, { onChange: load });
      setRemovingUser(null);
    } finally {
      setRemovalAction(null);
    }
  };
  const handlePermanentDelete = async () => {
    if (!removingUser || removalAction) return;
    setRemovalAction("delete");
    try {
      await store.permanentlyDeleteUser(removingUser.id, { onChange: load });
      setRemovingUser(null);
    } catch {
      // A camada de API já apresenta a mensagem de erro ao usuário.
    } finally {
      setRemovalAction(null);
    }
  };
  const handleRestore = async (id: string) => {
    await store.restoreUser(id);
    load();
  };

  const openPermissions = (user: User) => {
    setPermissionTarget(user);
    setPermissions(
      (user.permissions ?? []).filter((permission) =>
        ALL_PERMISSIONS.includes(permission),
      ),
    );
  };

  const togglePermission = (permission: Permission) => {
    setPermissions((items) => {
      const selected = items.includes(permission);
      let next = selected
        ? items.filter((item) => item !== permission)
        : [...items, permission];
      if (permission === "users.manage" && selected) {
        next = next.filter((item) => item !== "permissions.manage");
      }
      if (permission === "permissions.manage" && !selected) {
        next = [...new Set([...next, "users.manage" as Permission])];
      }
      return next;
    });
  };

  const savePermissions = async () => {
    if (!permissionTarget) return;
    await store.updateProfessorPermissions(
      permissionTarget.id,
      permissions.filter((permission) =>
        ALL_PERMISSIONS.includes(permission),
      ),
    );
    setPermissionTarget(null);
    load();
  };

  const filtered = professors.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      phoneMatchesSearch(u.whatsapp, search),
  );
  const pagination = useListPagination(filtered, search);

  if (loading) return <DashboardPageSkeleton variant="people" />;

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-djon-accent text-xs tracking-wide font-bold mb-0.5">
            Administração
          </p>
          <h1 className="text-3xl font-black text-djon-text tracking-tighter">
            Professores
          </h1>
        </div>
        <motion.button
          onClick={openNew}
          className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-full bg-djon-accent px-5 py-2.5 text-xs font-black tracking-wide text-djon-ink sm:w-auto"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Plus size={14} /> NOVO PROFESSOR
        </motion.button>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por nome, e-mail ou telefone..."
        className={inp}
      />

      {/* Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-djon-black/70 p-4 backdrop-blur-sm sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="djon-scroll my-4 max-h-[calc(100svh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-djon-text/10 bg-djon-surface-2 p-5 sm:my-6 sm:p-6"
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-black text-djon-text tracking-tighter">
                  {editingId ? "Editar Professor" : "Cadastrar Professor"}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="cursor-pointer text-djon-text opacity-40 transition-opacity hover:opacity-100"
                >
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-djon-text/40 text-xs font-bold tracking-wide mb-1.5 block">
                    NOME COMPLETO
                  </label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Nome do professor"
                    className={inp}
                  />
                </div>
                <div>
                  <label className="text-djon-text/40 text-xs font-bold tracking-wide mb-1.5 block">
                    E-MAIL
                  </label>
                  <div className="relative">
                    <Mail
                      size={13}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-djon-text/30"
                    />
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      placeholder="email@dominio.com"
                      className={inp + " pl-10"}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-djon-text/40 text-xs font-bold tracking-wide mb-1.5 block">
                    TELEFONE
                  </label>
                  <div className="relative">
                    <Phone
                      size={13}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-djon-text/30"
                    />
                    <input
                      type="tel"
                      value={form.whatsapp}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          whatsapp: formatPhone(e.target.value),
                        })
                      }
                      placeholder="(51) 99999-0000"
                      inputMode="numeric"
                      autoComplete="tel"
                      maxLength={15}
                      className={inp + " pl-10"}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-djon-text/40 text-xs font-bold tracking-wide mb-1.5 block">
                    UNIDADE
                  </label>
                  <DjonSelect
                    required
                    value={form.unitId}
                    onChange={(unitId) => setForm({ ...form, unitId })}
                    options={units.map((unit) => ({
                      value: unit.id,
                      label: unit.label,
                    }))}
                    placeholder="Selecionar unidade..."
                  />
                </div>
                {!editingId && (
                  <p className="rounded-xl border border-djon-light-purple/20 bg-djon-light-purple/8 p-3 text-xs leading-relaxed text-djon-text/55">
                    Uma senha temporária será criada e enviada automaticamente para o e-mail do professor.
                  </p>
                )}
                <p className="text-djon-text/25 text-xs leading-relaxed border-t border-djon-text/8 pt-3">
                  Bio e redes sociais são editadas pelo próprio usuário no
                  perfil dele.
                </p>
                <motion.button
                  type="submit"
                  className="cursor-pointer w-full bg-djon-accent text-djon-ink rounded-xl py-3 font-black text-sm tracking-wide"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {editingId ? "SALVAR ALTERAÇÕES" : "CADASTRAR PROFESSOR"}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {removingUser && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-djon-black/70 p-4 backdrop-blur-sm sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(event) =>
              event.target === event.currentTarget &&
              !removalAction &&
              setRemovingUser(null)
            }
          >
            <motion.div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="remove-professor-title"
              aria-describedby="remove-professor-description"
              className="my-4 w-full max-w-md rounded-2xl border border-djon-text/10 bg-djon-surface-2 p-5 shadow-2xl sm:my-6 sm:p-6"
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-djon-warning-red/10 text-djon-warning-red">
                    <Trash2 size={18} />
                  </span>
                  <div>
                    <p className="mb-1 text-xs font-black uppercase tracking-widest text-djon-warning-red">
                      REMOVER PROFESSOR
                    </p>
                    <h2
                      id="remove-professor-title"
                      className="text-xl font-black tracking-tighter text-djon-text"
                    >
                      O que deseja fazer?
                    </h2>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Fechar remoção"
                  onClick={() => setRemovingUser(null)}
                  disabled={Boolean(removalAction)}
                  className="cursor-pointer text-djon-text opacity-40 transition-opacity hover:opacity-100 disabled:cursor-not-allowed"
                >
                  <X size={18} />
                </button>
              </div>

              <p
                id="remove-professor-description"
                className="mb-5 text-sm leading-relaxed text-djon-text/50"
              >
                {removingUser.active === false
                  ? `${removingUser.name} já está desativado. A exclusão apaga definitivamente o cadastro e transfere todos os registros vinculados para o Devito.`
                  : `Escolha como remover ${removingUser.name}. Desativar bloqueia o acesso e pode ser desfeito. Excluir apaga definitivamente o cadastro e transfere todos os registros vinculados para o Devito.`}
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  autoFocus
                  onClick={() => setRemovingUser(null)}
                  disabled={Boolean(removalAction)}
                  className="cursor-pointer flex-1 rounded-full border border-djon-text/15 py-3 text-xs font-black tracking-widest text-djon-text/60 transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  CANCELAR
                </button>
                {removingUser.active !== false && (
                  <button
                    type="button"
                    onClick={() => void handleDeactivate()}
                    disabled={Boolean(removalAction)}
                    className="cursor-pointer flex-1 rounded-full border border-djon-warning-red/20 py-3 text-xs font-black tracking-widest text-djon-warning-red/70 transition-[filter,opacity] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {removalAction === "deactivate"
                      ? "DESATIVANDO..."
                      : "DESATIVAR"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void handlePermanentDelete()}
                  disabled={Boolean(removalAction)}
                  className="cursor-pointer flex-1 rounded-full border border-transparent bg-djon-warning-red/80 py-3 text-xs font-black tracking-widest text-djon-text transition-[filter,opacity] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {removalAction === "delete" ? "EXCLUINDO..." : "EXCLUIR"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-djon-surface-2 border border-djon-text/8 rounded-2xl p-10 text-center">
          <GraduationCap size={32} className="text-djon-text/20 mx-auto mb-3" />
          <p className="text-djon-text/30 text-sm">
            {search
              ? "Nenhum professor encontrado."
              : "Nenhum professor cadastrado."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {pagination.paginatedItems.map((u, i) => (
            <motion.div
              key={u.id}
              className={`grid grid-cols-[auto_minmax(0,1fr)] items-start gap-4 rounded-2xl border border-djon-text/8 bg-djon-surface-2 px-4 py-4 sm:flex sm:items-center ${u.active === false ? "opacity-55" : ""}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.04 }}
            >
              <div className="djon-avatar-fallback w-10 h-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                {u.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={u.avatar}
                    alt={u.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-djon-accent font-black text-sm">
                    {u.name.charAt(0)}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/dashboard/perfil/${u.id}`}
                  className="mb-1.5 block truncate text-sm font-bold text-djon-text transition-colors hover:text-djon-accent"
                >
                  {u.name}
                </Link>
                <p className="text-djon-text/40 text-xs truncate flex items-center gap-1.5">
                  <Mail size={10} className="shrink-0" />
                  <span className="truncate">{u.email}</span>
                </p>
                {u.whatsapp && (
                  <p className="text-djon-text/30 text-xs flex items-center gap-1.5 mt-1">
                    <Phone size={10} /> {formatPhone(u.whatsapp)}
                  </p>
                )}
                {u.unitLabel && (
                  <p className="text-djon-text/30 text-xs flex items-center gap-1.5 mt-1">
                    <MapPin size={10} /> {u.unitLabel}
                  </p>
                )}
              </div>
              <div className="col-span-2 flex w-full items-center justify-end gap-2 border-t border-djon-text/8 pt-3 sm:w-auto sm:border-t-0 sm:pt-0">
                {hasPermission(currentUser, "users.manage") &&
                  u.active !== false && (
                  <button
                    onClick={() => openEdit(u)}
                    className="cursor-pointer p-1.5 text-djon-text opacity-30 transition-opacity hover:opacity-100"
                    type="button"
                    title="Editar"
                    aria-label={`Editar ${u.name}`}
                  >
                    <Edit2 size={14} />
                  </button>
                )}
                {hasPermission(currentUser, "permissions.manage") &&
                  currentUser?.id !== u.id &&
                  u.active !== false && (
                  <button
                    onClick={() => openPermissions(u)}
                    className="cursor-pointer p-1.5 text-djon-accent opacity-60 transition-opacity hover:opacity-100"
                    type="button"
                    title="Privilégios"
                    aria-label={`Configurar privilégios de ${u.name}`}
                  >
                    <ShieldCheck size={14} />
                  </button>
                )}
                {u.active !== false ? (
                  <button
                    onClick={() => setRemovingUser(u)}
                    className="cursor-pointer p-1.5 text-djon-text opacity-20 transition-opacity hover:opacity-100"
                    type="button"
                    title="Remover"
                    aria-label={`Remover ${u.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setRemovingUser(u)}
                      className="cursor-pointer p-1.5 text-djon-text opacity-20 transition-opacity hover:opacity-100"
                      type="button"
                      title="Excluir"
                      aria-label={`Excluir ${u.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                    <button
                      onClick={() => void handleRestore(u.id)}
                      type="button"
                      title="Restaurar"
                      aria-label={`Restaurar ${u.name}`}
                      className="cursor-pointer p-1.5 text-djon-accent transition-[filter] hover:brightness-110"
                    >
                      <RotateCcw size={14} />
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
      <ListPagination
        totalItems={filtered.length}
        page={pagination.page}
        pageSize={pagination.pageSize}
        totalPages={pagination.totalPages}
        onPageChange={pagination.setPage}
        onPageSizeChange={pagination.setPageSize}
      />
      {hasPermission(currentUser, "permissions.manage") &&
        permissionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-djon-black/80 p-4 backdrop-blur-sm">
          <div
            className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-2xl border border-djon-text/10 bg-djon-surface-2 p-6"
            data-lenis-prevent
            data-lenis-prevent-wheel
            data-lenis-prevent-touch
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black text-djon-accent">
                  PRIVILÉGIOS DO PROFESSOR
                </p>
                <h2 className="mt-1 text-xl font-black text-djon-text">
                  {permissionTarget.name}
                </h2>
                <p className="mt-2 max-w-md text-xs leading-relaxed text-djon-text/40">
                  As permissões nativas do professor permanecem sempre ativas.
                  Somente administradores podem conceder acessos adicionais.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPermissionTarget(null)}
                className="text-djon-text/40 hover:text-djon-text"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[10px] font-bold text-djon-accent">
                {permissions.filter((item) =>
                  ALL_PERMISSIONS.includes(item),
                ).length}
                /{ALL_PERMISSIONS.length} ativos
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPermissions([])}
                  className="inline-flex h-7 items-center justify-center rounded-full border border-djon-text/10 px-3 text-[9px] font-black uppercase leading-none tracking-wider text-djon-text/45 hover:text-djon-text"
                >
                  Limpar
                </button>
                <button
                  type="button"
                  onClick={() => setPermissions([...ALL_PERMISSIONS])}
                  aria-pressed={hasTotalAccess}
                  className={`inline-flex h-7 items-center justify-center rounded-full border px-3 text-[9px] font-black uppercase leading-none tracking-wider ${hasTotalAccess ? "border-djon-accent/25 bg-djon-accent/10 text-djon-accent hover:bg-djon-accent/15" : "border-djon-text/10 text-djon-text/45 hover:text-djon-text"}`}
                >
                  Acesso total
                </button>
              </div>
            </div>
            {permissionGroups.map((group) => (
              <div key={group} className="mt-4">
                <p className="mb-2 text-[9px] font-black uppercase tracking-[0.18em] text-djon-text/30">
                  {group}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {permissionOptions
                    .filter((option) => option.group === group)
                    .map((option) => {
                      const checked = permissions.includes(option.value);
                      return (
                        <label
                          key={option.value}
                          className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 ${checked ? "border-djon-accent/35 bg-djon-accent/10 text-djon-accent" : "border-djon-text/10 bg-djon-text/5 text-djon-text/55"}`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            className="mt-0.5 accent-djon-accent"
                            onChange={() => togglePermission(option.value)}
                          />
                          <span className="min-w-0">
                            <span className="block text-xs font-bold">
                              {option.label}
                            </span>
                            <span className="mt-1 block text-[10px] font-medium leading-relaxed text-djon-text/40">
                              {option.description}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => void savePermissions()}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-djon-accent py-3 text-xs font-black text-djon-ink"
            >
              <ShieldCheck size={14} /> SALVAR PRIVILÉGIOS
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
