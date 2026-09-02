"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  CreditCard,
  Edit2,
  Instagram,
  Mail,
  Phone,
  Plus,
  Users,
  X,
  User,
  Building2,
} from "lucide-react";
import { SoundCloudIcon } from "@/components/social-icons";
import { DjonSelect } from "@/components/djon-select";
import { store, type Unit, type User as AppUser } from "@/lib/store";
import { formatPhone, phoneMatchesSearch } from "@/lib/phone";
import { formatCpf } from "@/lib/cpf";
import {
  ListPagination,
  useListPagination,
} from "@/components/list-pagination";

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

export default function ProfessorAlunosPage() {
  const router = useRouter();
  const [students, setStudents] = useState<AppUser[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [units, setUnits] = useState<Unit[]>([]);

  const load = () => setStudents(store.getStudents());

  useEffect(() => {
    const u = store.getCurrentUser();
    if (!u) {
      router.replace("/login");
      return;
    }
    if (u.role === "student") {
      router.replace("/dashboard/student");
      return;
    }
    void store.getPublicUnits().then((availableUnits) => {
      setUnits(availableUnits.filter((unit) => unit.active));
      load();
    });
  }, [router]);

  const openNew = () => {
    const professorUnitId = store.getCurrentUser()?.unitId;
    setForm({
      ...emptyForm,
      unitId: professorUnitId ?? units[0]?.id ?? "",
    });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (student: AppUser) => {
    setForm({
      name: student.name,
      projectName: student.projectName ?? "",
      email: student.email,
      whatsapp: formatPhone(student.whatsapp),
      cpf: "",
      birthDate: "",
      trainingHoursLimit: student.trainingHoursLimit ?? 15,
      unitId: student.unitId ?? units[0]?.id ?? "",
    });
    setEditingId(student.id);
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
    setEditingId(null);
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-djon-accent text-xs tracking-widest font-black uppercase mb-1">
            PROFESSOR
          </p>
          <h1 className="text-3xl font-black text-djon-text tracking-tighter">
            Alunos
          </h1>
        </div>
        <motion.button
          type="button"
          onClick={openNew}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-djon-accent px-5 py-2.5 text-xs font-black tracking-wide text-djon-ink sm:w-auto"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Plus size={14} />
          NOVO ALUNO
        </motion.button>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por nome, e-mail ou telefone..."
        className={inp}
      />

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
                <div>
                  <p className="text-djon-accent text-xs tracking-widest font-black uppercase mb-1">
                    PROFESSOR
                  </p>
                  <h2 className="text-xl font-black text-djon-text tracking-tighter">
                    {editingId ? "Editar aluno" : "Cadastrar aluno"}
                  </h2>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  className="cursor-pointer text-djon-text opacity-40 transition-opacity hover:opacity-100"
                  type="button"
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
                    placeholder="Nome completo do aluno"
                    className={inp}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold tracking-wide text-djon-text/40">NOME DO PROJETO ARTÍSTICO</label>
                  <input value={form.projectName} onChange={(e) => setForm({ ...form, projectName: e.target.value })} placeholder="Ex: DJ Aurora" className={inp} />
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
                      className={`${inp} pl-10`}
                    />
                  </div>
                </div>

                {!editingId && (
                  <>
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
                          type="tel"
                          value={form.cpf}
                          onChange={(e) =>
                            setForm({ ...form, cpf: formatCpf(e.target.value) })
                          }
                          placeholder="000.000.000-00"
                          inputMode="numeric"
                          maxLength={14}
                          className={`${inp} pl-10`}
                        />
                      </div>
                    </div>

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

                    <p className="rounded-xl border border-djon-accent/20 bg-djon-accent/8 p-3 text-xs leading-relaxed text-djon-text/55">
                      A senha temporária será enviada automaticamente para o e-mail do aluno.
                    </p>

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
                        Horas que o aluno pode manter reservadas em treinos
                        futuros.
                      </p>
                    </div>
                  </>
                )}

                <motion.button
                  type="submit"
                  className="w-full cursor-pointer bg-djon-accent text-djon-ink rounded-xl py-3 font-black text-sm tracking-wide"
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

      {filtered.length === 0 ? (
        <div className="bg-djon-surface-2 border border-djon-text/8 rounded-2xl p-10 text-center">
          <Users size={32} className="text-djon-text/20 mx-auto mb-3" />
          <p className="text-djon-text/30 text-sm">Nenhum aluno encontrado.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pagination.paginatedItems.map((u, i) => (
            <motion.div
              key={u.id}
              className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-4 rounded-2xl border border-djon-text/8 bg-djon-surface-2 px-4 py-4 sm:flex"
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
                {u.projectName && <p className="mb-1 text-xs font-black text-djon-accent">{u.projectName}</p>}
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
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-djon-text/30">
                    <Building2 size={10} className="shrink-0" />
                    {u.unitLabel}
                  </p>
                )}
                {(u.socials?.instagram || u.socials?.soundcloud) && (
                  <div className="flex items-center gap-3 flex-wrap mt-2 pt-2 border-t border-djon-text/8">
                    {u.socials?.instagram && (
                      <a
                        href={`https://instagram.com/${u.socials.instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-djon-text/30 text-xs font-bold transition-colors hover:text-djon-text"
                      >
                        <Instagram size={16} /> @{u.socials.instagram}
                      </a>
                    )}
                    {u.socials?.soundcloud && (
                      <a
                        href={`https://soundcloud.com/${u.socials.soundcloud}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-djon-text/30 text-xs font-bold transition-colors hover:text-djon-text"
                      >
                        <SoundCloudIcon size={20} /> {u.socials.soundcloud}
                      </a>
                    )}
                  </div>
                )}
              </div>
              <div className="col-span-2 flex w-full items-center justify-end gap-2 border-t border-djon-text/8 pt-3 sm:w-auto sm:border-t-0 sm:pt-1">
                <button
                  onClick={() => openEdit(u)}
                  className="cursor-pointer p-1.5 text-djon-text opacity-20 transition-opacity hover:opacity-100"
                  type="button"
                  title="Editar"
                  aria-label={`Editar ${u.name}`}
                >
                  <Edit2 size={14} />
                </button>
                <Link
                  href={`/dashboard/perfil/${u.id}`}
                  className="cursor-pointer p-1.5 text-djon-text opacity-20 transition-opacity hover:opacity-100"
                  title="Perfil"
                  aria-label={`Abrir perfil de ${u.name}`}
                >
                  <User size={14} />
                </Link>
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
