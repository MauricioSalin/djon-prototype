"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Edit2,
  X,
  Users,
  Phone,
  CreditCard,
  Calendar,
  Instagram,
  Mail,
  User,
  RotateCcw,
  Building2,
} from "lucide-react";
import { store, type Unit, type User as AppUser } from "@/lib/store";
import { DjonSelect } from "@/components/djon-select";
import {
  ListPagination,
  useListPagination,
} from "@/components/list-pagination";
import { formatPhone, phoneMatchesSearch, whatsappUrl } from "@/lib/phone";
import { DashboardPageSkeleton } from "@/components/loading-skeletons";

const inp =
  "w-full bg-djon-text/5 border border-djon-text/10 rounded-xl px-4 py-2.5 text-djon-text text-sm placeholder:text-djon-text/20 focus:outline-none focus:border-djon-accent/50 transition-all";

type FormState = {
  name: string;
  projectName: string;
  email: string;
  whatsapp: string;
  cpf: string;
  birthDate: string;
  trainingHoursLimit: number;
  unitId: string;
};

const emptyForm: FormState = {
  name: "",
  projectName: "",
  email: "",
  whatsapp: "",
  cpf: "",
  birthDate: "",
  trainingHoursLimit: 15,
  unitId: "",
};

export default function AlunosPage() {
  const [students, setStudents] = useState<AppUser[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [search, setSearch] = useState("");
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingUser, setRemovingUser] = useState<AppUser | null>(null);
  const [removalAction, setRemovalAction] = useState<
    "deactivate" | "delete" | null
  >(null);

  const load = () =>
    setStudents(store.getUsers().filter((u) => u.role === "student"));

  useEffect(() => {
    void Promise.all([store.listAdminUsers(true), store.getPublicUnits()])
      .then(([, availableUnits]) => {
        setUnits(availableUnits.filter((unit) => unit.active));
        load();
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
    setForm({ ...emptyForm, unitId: units[0]?.id ?? "" });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (u: AppUser) => {
    setForm({
      name: u.name,
      projectName: u.projectName ?? "",
      email: u.email,
      whatsapp: formatPhone(u.whatsapp),
      cpf: u.cpf ?? "",
      birthDate: u.birthDate ?? "",
      trainingHoursLimit: u.trainingHoursLimit ?? 15,
      unitId: u.unitId ?? units[0]?.id ?? "",
    });
    setEditingId(u.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await store.updateUser(editingId, {
        name: form.name,
        projectName: form.projectName,
        email: form.email,
        whatsapp: form.whatsapp,
        cpf: form.cpf,
        birthDate: form.birthDate || undefined,
        trainingHoursLimit: form.trainingHoursLimit,
        unitId: form.unitId,
      });
    } else {
      await store.addUser({
        name: form.name,
        projectName: form.projectName,
        email: form.email,
        whatsapp: form.whatsapp,
        cpf: form.cpf,
        birthDate: form.birthDate || undefined,
        trainingHoursLimit: form.trainingHoursLimit,
        role: "student",
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
    } finally {
      setRemovalAction(null);
    }
  };
  const handleRestore = async (id: string) => {
    await store.restoreUser(id);
    load();
  };

  const filtered = students.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.projectName?.toLowerCase().includes(search.toLowerCase()) ||
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
            Alunos
          </h1>
        </div>
        <motion.button
          onClick={openNew}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-djon-accent px-5 py-2.5 text-xs font-black tracking-wide text-djon-ink sm:w-auto"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Plus size={14} />
          NOVO ALUNO
        </motion.button>
      </div>

      {/* Search */}
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
                  {editingId ? "Editar Aluno" : "Cadastrar Aluno"}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="cursor-pointer text-djon-text opacity-40 transition-opacity hover:opacity-100"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nome */}
                <div>
                  <label className="text-djon-text/40 text-xs font-bold tracking-wide mb-1.5 block">
                    NOME COMPLETO
                  </label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Nome completo do aluno"
                    className={inp}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold tracking-wide text-djon-text/40">
                    NOME DO PROJETO ARTÍSTICO
                  </label>
                  <input
                    value={form.projectName}
                    onChange={(e) => setForm({ ...form, projectName: e.target.value })}
                    placeholder="Ex: DJ Aurora"
                    className={inp}
                  />
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

                {/* Email */}
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
                      className={`${inp} pl-10`}
                    />
                  </div>
                </div>

                {/* WhatsApp */}
                <div>
                  <label className="text-djon-text/40 text-xs font-bold tracking-wide mb-1.5 block">
                    WHATSAPP
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
                      className={`${inp} pl-10`}
                    />
                  </div>
                </div>

                {/* CPF */}
                <div>
                  <label className="text-djon-text/40 text-xs font-bold tracking-wide mb-1.5 block">
                    CPF
                  </label>
                  <div className="relative">
                    <CreditCard
                      size={13}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-djon-text/30"
                    />
                    <input
                      value={form.cpf}
                      onChange={(e) =>
                        setForm({ ...form, cpf: e.target.value })
                      }
                      placeholder="000.000.000-00"
                      className={`${inp} pl-10`}
                    />
                  </div>
                </div>

                {/* Data de nascimento */}
                <div>
                  <label className="text-djon-text/40 text-xs font-bold tracking-wide mb-1.5 block">
                    DATA DE NASCIMENTO
                  </label>
                  <div className="relative">
                    <Calendar
                      size={13}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-djon-text/30"
                    />
                    <input
                      type="date"
                      value={form.birthDate}
                      onChange={(e) =>
                        setForm({ ...form, birthDate: e.target.value })
                      }
                      className={`${inp} pl-10`}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-djon-text/40 text-xs font-bold tracking-wide mb-1.5 block">
                    LIMITE DE TREINOS (HORAS)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={1000}
                    step={1}
                    value={form.trainingHoursLimit}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        trainingHoursLimit: Number(e.target.value),
                      })
                    }
                    className={inp}
                  />
                  <p className="mt-1 text-xs text-djon-text/25">
                    Horas que o aluno pode manter reservadas em treinos futuros.
                  </p>
                </div>

                {!editingId && (
                  <p className="rounded-xl border border-djon-accent/20 bg-djon-accent/8 p-3 text-xs leading-relaxed text-djon-text/55">
                    Uma senha temporária será criada e enviada automaticamente para o e-mail do aluno.
                  </p>
                )}

                <p className="text-djon-text/25 text-xs leading-relaxed border-t border-djon-text/8 pt-3">
                  Bio e redes sociais s&atilde;o editadas pelo pr&oacute;prio
                  aluno no perfil dele.
                </p>

                <motion.button
                  type="submit"
                  className="w-full bg-djon-accent text-djon-ink rounded-xl py-3 font-black text-sm tracking-wide"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {editingId ? "SALVAR ALTERAÇÕES" : "CADASTRAR ALUNO"}
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
              aria-labelledby="remove-student-title"
              aria-describedby="remove-student-description"
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
                      REMOVER ALUNO
                    </p>
                    <h2
                      id="remove-student-title"
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
                id="remove-student-description"
                className="mb-5 text-sm leading-relaxed text-djon-text/50"
              >
                {removingUser.active === false
                  ? `${removingUser.name} já está desativado. A exclusão apaga definitivamente o cadastro e só é permitida quando não há histórico vinculado.`
                  : `Escolha como remover ${removingUser.name}. Desativar bloqueia o acesso e pode ser desfeito. Excluir apaga definitivamente um cadastro criado por engano e só é permitido quando não há histórico vinculado.`}
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
          <Users size={32} className="text-djon-text/20 mx-auto mb-3" />
          <p className="text-djon-text/30 text-sm">
            {search ? "Nenhum aluno encontrado." : "Nenhum aluno cadastrado."}
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
              {/* Avatar */}
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

              {/* Info */}
              <div className="w-full min-w-0 flex-1">
                <Link
                  href={`/dashboard/perfil/${u.id}`}
                  className="mb-1.5 block truncate text-sm font-bold text-djon-text transition-colors hover:text-djon-accent"
                >
                  {u.name}
                </Link>
                {u.projectName && <p className="mb-1 text-xs font-black text-djon-accent">{u.projectName}</p>}
                <p className="text-djon-text/40 text-xs truncate flex items-center gap-1.5">
                  <Mail size={10} className="shrink-0" />
                  <span className="truncate">{u.email}</span>
                </p>
                {u.whatsapp && (
                  <a
                    href={whatsappUrl(u.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Conversar com ${u.name} pelo WhatsApp`}
                    className="mt-1 flex w-fit items-center gap-1.5 text-xs font-bold text-djon-text/30 transition-[filter] hover:brightness-110"
                  >
                    <Phone size={10} /> {formatPhone(u.whatsapp)}
                  </a>
                )}
                {u.unitLabel && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-djon-text/30">
                    <Building2 size={10} className="shrink-0" />
                    {u.unitLabel}
                  </p>
                )}
                {u.socials?.instagram && (
                  <div className="flex items-center gap-3 flex-wrap mt-2 pt-2 border-t border-djon-text/8">
                    <a
                      href={`https://instagram.com/${u.socials.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-djon-text/30 text-xs font-bold transition-colors hover:text-djon-text"
                    >
                      <Instagram size={16} /> @{u.socials.instagram}
                    </a>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="col-span-2 flex w-full items-center justify-end gap-2 border-t border-djon-text/8 pt-3 sm:w-auto sm:border-t-0 sm:pt-0">
                {u.active !== false && (
                  <button
                    onClick={() => openEdit(u)}
                    className="cursor-pointer p-1.5 text-djon-text opacity-20 transition-opacity hover:opacity-100"
                    type="button"
                    title="Editar"
                    aria-label={`Editar ${u.name}`}
                  >
                    <Edit2 size={14} />
                  </button>
                )}
                <Link
                  href={`/dashboard/perfil/${u.id}`}
                  className="cursor-pointer p-1.5 text-djon-text opacity-20 transition-opacity hover:opacity-100"
                  title="Perfil"
                  aria-label={`Abrir perfil de ${u.name}`}
                >
                  <User size={14} />
                </Link>
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
    </div>
  );
}
