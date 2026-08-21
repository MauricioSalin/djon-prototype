"use client";

import {
  notifyRequestError,
  notifySuccess,
  notifyUndoable,
} from "@/lib/feedback";
import { formatPhone, phoneDigits } from "@/lib/phone";

export type Role = "admin" | "professor" | "student";

type MutationFeedbackOptions = {
  onChange?: () => void;
  silent?: boolean;
  keepalive?: boolean;
};

export interface SocialLinks {
  instagram?: string;
  soundcloud?: string;
  youtube?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  whatsapp?: string;
  cpf?: string;
  birthDate?: string;
  avatar?: string;
  banner?: string;
  bio?: string;
  socials?: SocialLinks;
  role: Role;
  unitId?: string;
  unitLabel?: string;
  trainingHoursLimit?: number;
  active?: boolean;
  createdAt: string;
}

export interface DJEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  instagram?: string;
  description?: string;
  createdBy: string;
  createdByName: string;
  createdByAvatar?: string;
  type: "student" | "djOn" | "professor";
  createdAt: string;
}

export interface Booking {
  id: string;
  userId: string;
  studentName?: string;
  studentAvatar?: string;
  title: string;
  date: string;
  time: string;
  type: "aula" | "treino";
  notes?: string;
  status: "confirmado" | "pendente" | "cancelado";
  unitId?: string;
  unitLabel?: string;
  professorId?: string;
  professorName?: string;
  equipmentId?: string;
  equipmentName?: string;
  durationMinutes: number;
  originalBookingId?: string;
  createdAt: string;
}

export interface TrainingBalance {
  limitHours: number;
  reservedHours: number;
  remainingHours: number;
}

export interface OccupiedEquipmentSlot {
  bookingId: string;
  equipmentId: string;
  equipmentName: string;
  date: string;
  time: string;
  endTime: string;
}

export interface BookingAvailability {
  availableTimes: string[];
  occupiedTimes: string[];
  occupiedEquipment: OccupiedEquipmentSlot[];
}

export interface Unit {
  id: string;
  key: string;
  label: string;
  shortLabel: string;
  address: string;
  mapSrc?: string;
  mapsHref?: string;
  timezone: string;
  active: boolean;
}

export interface Equipment {
  id: string;
  name: string;
  description?: string;
  unitId: string;
  unitLabel?: string;
  active: boolean;
}

export interface Lead {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  message?: string;
  unitKey?: string;
  status: "novo" | "contatado" | "convertido" | "arquivado";
  internalNotes?: string;
  assignedTo?: { id: string; name: string; email: string };
  createdAt: string;
}

export interface MaterialAttachment {
  id: string;
  name: string;
  type: "pdf" | "image" | "file";
  url: string;
  size?: string;
}

export interface Material {
  id: string;
  title: string;
  description?: string;
  category: string;
  coverImage?: string;
  body?: string;
  attachments?: MaterialAttachment[];
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  status: "draft" | "published";
  createdAt: string;
  fileType?: "image" | "pdf";
  fileUrl?: string;
  fileName?: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  purpose: string;
  url: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  url: string;
  metadata: Record<string, unknown>;
  readAt?: string;
  createdAt: string;
}

type ApiRecord = Record<string, unknown>;
type ApiPage = { items: ApiRecord[]; total: number };
type CategoryRecord = { id: string; name: string };

type PortalCacheSnapshot = {
  version: number;
  savedAt: number;
  userId: string;
  role: Role;
  users: User[];
  events: DJEvent[];
  bookings: Booking[];
  materials: Material[];
  categories: CategoryRecord[];
  notifications: Notification[];
  units: Unit[];
  equipments: Equipment[];
  leads: Lead[];
};

const TOKEN_KEY = "djon_access_token";
const PORTAL_CACHE_KEY = "djon_portal_cache_v1";
const PORTAL_CACHE_VERSION = 1;
const PORTAL_CACHE_MAX_AGE_MS = 5 * 60 * 1000;
const NOTIFICATIONS_STALE_MS = 10 * 1000;
const BOOKINGS_STALE_MS = 4 * 1000;
export const SESSION_EXPIRED_EVENT = "djon:session-expired";
let sessionExpirationAnnounced = false;
const userNameCollator = new Intl.Collator("pt-BR", {
  sensitivity: "base",
  numeric: true,
});

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

function apiBase() {
  if (process.env.NEXT_PUBLIC_API_URL)
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  if (typeof window !== "undefined")
    return `http://${window.location.hostname}:3333/api/v1`;
  return "http://localhost:3333/api/v1";
}

function clearPortalCache() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(PORTAL_CACHE_KEY);
  } catch {
    // O cache de sessão é apenas uma otimização; armazenamento indisponível
    // não pode interromper autenticação nem requisições da aplicação.
  }
}

function assetUrl(value?: string) {
  if (!value || !value.startsWith("/")) return value;
  return `${new URL(apiBase()).origin}${value}`;
}

function assetHtml(value?: string) {
  if (!value) return value;
  return value.replace(
    /(src=["'])(\/api\/v1\/files\/[a-f\d]{24}[^"']*)/gi,
    (_match, prefix, url) => `${prefix}${assetUrl(url)}`,
  );
}

function firstImageFromHtml(value?: string) {
  if (!value) return undefined;
  const match =
    /<img\b[^>]*\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s"'=<>`]+))/i.exec(
      value,
    );
  return match?.slice(1).find(Boolean)?.trim() || undefined;
}

function reference(value: unknown): ApiRecord | undefined {
  return value && typeof value === "object" ? (value as ApiRecord) : undefined;
}

function referenceId(value: unknown) {
  return typeof value === "string" ? value : String(reference(value)?.id ?? "");
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function normalizeUser(raw: ApiRecord): User {
  const unit = reference(raw.unitId);
  return {
    id: asString(raw.id),
    name: asString(raw.name),
    email: asString(raw.email),
    whatsapp: formatPhone(asString(raw.whatsapp)) || undefined,
    cpf: asString(raw.cpf) || undefined,
    birthDate: asString(raw.birthDate) || undefined,
    avatar: assetUrl(asString(raw.avatar)) || undefined,
    banner: assetUrl(asString(raw.banner)) || undefined,
    bio: asString(raw.bio) || undefined,
    socials: (raw.socials as SocialLinks | undefined) ?? {},
    role: raw.role as Role,
    unitId: referenceId(raw.unitId) || undefined,
    unitLabel: asString(unit?.label) || asString(unit?.shortLabel) || undefined,
    trainingHoursLimit:
      typeof raw.trainingHoursLimit === "number"
        ? raw.trainingHoursLimit
        : undefined,
    active: raw.active as boolean | undefined,
    createdAt: asString(raw.createdAt),
  };
}

function normalizeEvent(raw: ApiRecord): DJEvent {
  const author = reference(raw.authorId);
  return {
    id: asString(raw.id),
    title: asString(raw.title),
    date: asString(raw.date),
    time: asString(raw.time),
    location: asString(raw.location),
    instagram: asString(raw.instagram) || undefined,
    description: asString(raw.description) || undefined,
    createdBy: referenceId(raw.authorId),
    createdByName: asString(author?.name),
    createdByAvatar: assetUrl(asString(author?.avatar)) || undefined,
    type: raw.type as DJEvent["type"],
    createdAt: asString(raw.createdAt),
  };
}

function normalizeBooking(raw: ApiRecord): Booking {
  const student = reference(raw.studentId);
  const unit = reference(raw.unitId);
  const professor = reference(raw.professorId);
  const equipment = reference(raw.equipmentId);
  return {
    id: asString(raw.id),
    userId: referenceId(raw.studentId),
    studentName: asString(student?.name) || undefined,
    studentAvatar: assetUrl(asString(student?.avatar)) || undefined,
    title: asString(raw.title),
    date: asString(raw.date),
    time: asString(raw.time),
    type: raw.type as Booking["type"],
    notes: asString(raw.notes) || undefined,
    status: raw.status as Booking["status"],
    unitId: referenceId(raw.unitId) || undefined,
    unitLabel: asString(unit?.label) || asString(unit?.shortLabel) || undefined,
    professorId: referenceId(raw.professorId) || undefined,
    professorName: asString(professor?.name) || undefined,
    equipmentId: referenceId(raw.equipmentId) || undefined,
    equipmentName: asString(equipment?.name) || undefined,
    durationMinutes:
      typeof raw.durationMinutes === "number" ? raw.durationMinutes : 60,
    originalBookingId: referenceId(raw.originalBookingId) || undefined,
    createdAt: asString(raw.createdAt),
  };
}

function normalizeEquipment(raw: ApiRecord): Equipment {
  const unit = reference(raw.unitId);
  return {
    id: asString(raw.id),
    name: asString(raw.name),
    description: asString(raw.description) || undefined,
    unitId: referenceId(raw.unitId),
    unitLabel: asString(unit?.label) || asString(unit?.shortLabel) || undefined,
    active: raw.active !== false,
  };
}

function normalizeMaterial(raw: ApiRecord): Material {
  const category = reference(raw.categoryId);
  const author = reference(raw.authorId);
  const body = assetHtml(asString(raw.body)) || undefined;
  const attachments = Array.isArray(raw.attachments)
    ? raw.attachments.map((item) => {
        const attachment = item as ApiRecord;
        return {
          id: asString(attachment.legacyId) || asString(attachment.id),
          name: asString(attachment.name),
          type: attachment.type as MaterialAttachment["type"],
          url: assetUrl(asString(attachment.url)) ?? "",
          size: asString(attachment.size) || undefined,
        };
      })
    : [];
  return {
    id: asString(raw.id),
    title: asString(raw.title),
    description: asString(raw.description) || undefined,
    category: asString(category?.name),
    coverImage: assetUrl(asString(raw.coverImage)) || firstImageFromHtml(body),
    body,
    attachments,
    authorId: referenceId(raw.authorId),
    authorName: asString(author?.name),
    authorAvatar: assetUrl(asString(author?.avatar)) || undefined,
    status: raw.status === "draft" ? "draft" : "published",
    createdAt: asString(raw.createdAt),
  };
}

function normalizeUnit(raw: ApiRecord): Unit {
  return {
    id: asString(raw.id),
    key: asString(raw.key),
    label: asString(raw.label),
    shortLabel: asString(raw.shortLabel),
    address: asString(raw.address),
    mapSrc: asString(raw.mapSrc) || undefined,
    mapsHref: asString(raw.mapsHref) || undefined,
    timezone: asString(raw.timezone, "America/Sao_Paulo"),
    active: raw.active !== false,
  };
}

function normalizeLead(raw: ApiRecord): Lead {
  const assigned = reference(raw.assignedTo);
  return {
    id: asString(raw.id),
    firstName: asString(raw.firstName) || undefined,
    lastName: asString(raw.lastName) || undefined,
    email: asString(raw.email),
    message: asString(raw.message) || undefined,
    unitKey: asString(raw.unitKey) || undefined,
    status: raw.status as Lead["status"],
    internalNotes: asString(raw.internalNotes) || undefined,
    assignedTo: assigned
      ? {
          id: asString(assigned.id),
          name: asString(assigned.name),
          email: asString(assigned.email),
        }
      : undefined,
    createdAt: asString(raw.createdAt),
  };
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  showError = true,
): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  let response: Response;
  try {
    response = await fetch(`${apiBase()}${path}`, {
      ...options,
      headers,
      cache: "no-store",
    });
  } catch (cause) {
    const error = new ApiError(
      cause instanceof Error ? cause.message : "Falha de conexão.",
      0,
    );
    if (showError) notifyRequestError(error);
    throw error;
  }
  const payload = (await response.json().catch(() => undefined)) as
    ApiRecord | undefined;
  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
      if (token && !sessionExpirationAnnounced) {
        sessionExpirationAnnounced = true;
        window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
      }
    }
    const rawMessage = payload?.message;
    const message = Array.isArray(rawMessage)
      ? rawMessage.join(" ")
      : asString(rawMessage, "Não foi possível concluir a operação.");
    const error = new ApiError(message, response.status);
    if (showError) notifyRequestError(error);
    throw error;
  }
  if ((options.method ?? "GET").toUpperCase() !== "GET") {
    clearPortalCache();
  }
  return payload as T;
}

function json(method: string, body?: unknown, keepalive = false): RequestInit {
  return {
    method,
    keepalive,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  };
}

function failWithFeedback(message: string, status: number): never {
  const error = new ApiError(message, status);
  notifyRequestError(error);
  throw error;
}

class ApiStore {
  private currentUser: User | null = null;
  private users: User[] = [];
  private events: DJEvent[] = [];
  private bookings: Booking[] = [];
  private materials: Material[] = [];
  private categories: CategoryRecord[] = [];
  private notifications: Notification[] = [];
  private units: Unit[] = [];
  private equipments: Equipment[] = [];
  private leads: Lead[] = [];
  private bootstrapPromise: Promise<User | null> | null = null;
  private restoreSessionPromise: Promise<User | null> | null = null;
  private publicUnitsPromise: Promise<Unit[]> | null = null;
  private adminUsersPromise: Promise<User[]> | null = null;
  private notificationsPromise: Promise<Notification[]> | null = null;
  private bookingsPromise: Promise<Booking[]> | null = null;
  private hasBootstrapData = false;
  private bootstrapLoadedAt = 0;
  private notificationsLoadedAt = 0;
  private bookingsLoadedAt = 0;
  private publicUnitsLoadedAt = 0;
  private adminUsersLoadedAt = 0;

  hasSession() {
    return (
      typeof window !== "undefined" && Boolean(localStorage.getItem(TOKEN_KEY))
    );
  }

  async login(email: string, password: string) {
    const result = await request<{ accessToken: string; user: ApiRecord }>(
      "/auth/login",
      json("POST", { email, password }),
    );
    localStorage.setItem(TOKEN_KEY, result.accessToken);
    sessionExpirationAnnounced = false;
    this.currentUser = normalizeUser(result.user);
    notifySuccess("Login realizado", `Bem-vindo(a), ${this.currentUser.name}.`);
    return this.currentUser;
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    sessionExpirationAnnounced = true;
    this.reset();
  }

  async bootstrap(force = false): Promise<User | null> {
    if (!this.hasSession()) return null;

    if (!force && this.currentUser && this.hasBootstrapData) {
      if (
        Date.now() - this.bootstrapLoadedAt > PORTAL_CACHE_MAX_AGE_MS &&
        !this.bootstrapPromise
      ) {
        this.bootstrapPromise = this.loadAll(this.currentUser).finally(() => {
          this.bootstrapPromise = null;
        });
        void this.bootstrapPromise.catch(() => undefined);
      }
      return this.currentUser;
    }

    if (this.bootstrapPromise) return this.bootstrapPromise;
    this.bootstrapPromise = this.bootstrapPortal(force).finally(() => {
      this.bootstrapPromise = null;
    });
    return this.bootstrapPromise;
  }

  private async bootstrapPortal(force: boolean) {
    const me = await this.restoreSession();
    if (!me) return null;
    if (!force && this.hydratePortalCache(me)) return me;
    return this.loadAll(me);
  }

  async restoreSession(): Promise<User | null> {
    if (this.currentUser) return this.currentUser;
    if (!this.hasSession()) return null;
    if (this.restoreSessionPromise) return this.restoreSessionPromise;

    this.restoreSessionPromise = request<ApiRecord>("/users/me", {}, false)
      .then((raw) => {
        const user = normalizeUser(raw);
        this.currentUser = user;
        this.users = this.uniqueUsers([user, ...this.users]);
        return user;
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 401) {
          this.reset();
          return null;
        }
        throw error;
      })
      .finally(() => {
        this.restoreSessionPromise = null;
      });

    return this.restoreSessionPromise;
  }

  private async loadAll(authenticatedUser?: User) {
    const me = authenticatedUser ?? (await this.restoreSession());
    if (!me) return null;
    this.currentUser = me;
    const usersPath =
      me.role === "student" ? "/users?role=professor" : "/users";
    const [
      userItems,
      eventItems,
      bookingItems,
      materialItems,
      categories,
      notifications,
      units,
      equipments,
      leads,
    ] = await Promise.all([
      this.fetchAllPages(usersPath),
      this.fetchAllPages("/events"),
      this.fetchAllPages("/bookings"),
      this.fetchAllPages("/materials"),
      request<ApiRecord[]>("/materials/categories"),
      request<ApiRecord[]>("/notifications"),
      request<ApiRecord[]>("/units"),
      request<ApiRecord[]>("/equipments"),
      me.role === "admin"
        ? request<ApiRecord[]>("/leads")
        : Promise.resolve<ApiRecord[]>([]),
    ]);
    this.users = this.uniqueUsers([me, ...userItems.map(normalizeUser)]);
    this.events = eventItems.map(normalizeEvent);
    this.bookings = bookingItems.map(normalizeBooking);
    this.materials = materialItems.map(normalizeMaterial);
    this.categories = categories.map((item) => ({
      id: asString(item.id),
      name: asString(item.name),
    }));
    this.notifications = notifications.map((item) =>
      this.normalizeNotification(item),
    );
    this.units = units.map(normalizeUnit);
    this.equipments = equipments.map(normalizeEquipment);
    this.leads = leads.map(normalizeLead);
    const loadedAt = Date.now();
    this.hasBootstrapData = true;
    this.bootstrapLoadedAt = loadedAt;
    this.notificationsLoadedAt = loadedAt;
    this.bookingsLoadedAt = loadedAt;
    this.publicUnitsLoadedAt = loadedAt;
    this.persistPortalCache();
    return me;
  }

  getCurrentUser = () => this.currentUser;
  getUsers = () => [...this.users];
  getStudents = () => this.users.filter((user) => user.role === "student");
  getProfessors = () => this.users.filter((user) => user.role === "professor");
  getUserById = (id: string) =>
    this.users.find((user) => user.id === id) ?? null;
  getEvents = () => [...this.events];
  getStudentEvents = () =>
    this.events.filter((event) => event.type === "student");
  getDJOnEvents = () => this.events.filter((event) => event.type === "djOn");
  getProfessorEvents = () =>
    this.events.filter((event) => event.type === "professor");
  getEventsByUser = (id: string) =>
    this.events.filter((event) => event.createdBy === id);
  getBookings = () => [...this.bookings];
  getBookingsByUser = (id: string) =>
    this.bookings.filter((booking) => booking.userId === id);
  getMaterials = () =>
    [...this.materials].sort(
      (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
    );
  getMaterialById = (id: string) =>
    this.materials.find((material) => material.id === id) ?? null;
  getMaterialCategories = () =>
    this.categories.map((category) => category.name);
  getNotifications = () => [...this.notifications];
  getUnits = () => [...this.units];
  getEquipments = () => [...this.equipments];
  getLeads = () => [...this.leads];

  async fetchUserById(id: string) {
    const cached = this.getUserById(id);
    if (cached) return cached;
    const user = normalizeUser(await request<ApiRecord>(`/users/${id}`));
    this.users = this.uniqueUsers([...this.users, user]);
    return user;
  }

  async fetchMaterialById(id: string) {
    const cached = this.getMaterialById(id);
    if (cached) return cached;
    const material = normalizeMaterial(
      await request<ApiRecord>(`/materials/${id}`),
    );
    this.materials = [material, ...this.materials];
    return material;
  }

  async refreshNotifications(force = false) {
    if (
      !force &&
      this.notificationsLoadedAt > 0 &&
      Date.now() - this.notificationsLoadedAt < NOTIFICATIONS_STALE_MS
    ) {
      return this.getNotifications();
    }
    if (this.notificationsPromise) return this.notificationsPromise;
    this.notificationsPromise = request<ApiRecord[]>("/notifications")
      .then((notifications) => {
        this.notifications = notifications.map((item) =>
          this.normalizeNotification(item),
        );
        this.notificationsLoadedAt = Date.now();
        return this.getNotifications();
      })
      .finally(() => {
        this.notificationsPromise = null;
      });
    return this.notificationsPromise;
  }

  async markNotificationRead(id: string) {
    const updated = this.normalizeNotification(
      await request<ApiRecord>(`/notifications/${id}/read`, json("PATCH", {})),
    );
    this.notifications = this.notifications.map((item) =>
      item.id === id ? updated : item,
    );
    notifySuccess("Notificação marcada como lida");
    return updated;
  }

  async markAllNotificationsRead() {
    await request("/notifications/read-all", json("PATCH", {}));
    const readAt = new Date().toISOString();
    this.notifications = this.notifications.map((item) => ({
      ...item,
      readAt: item.readAt ?? readAt,
    }));
    notifySuccess(
      "Notificações atualizadas",
      "Todas foram marcadas como lidas.",
    );
  }

  async refreshBookings(force = false) {
    if (
      !force &&
      this.bookingsLoadedAt > 0 &&
      Date.now() - this.bookingsLoadedAt < BOOKINGS_STALE_MS
    ) {
      return this.getBookings();
    }
    if (this.bookingsPromise) return this.bookingsPromise;
    this.bookingsPromise = this.fetchAllPages("/bookings")
      .then((bookings) => {
        this.bookings = bookings.map(normalizeBooking);
        this.bookingsLoadedAt = Date.now();
        return this.getBookings();
      })
      .finally(() => {
        this.bookingsPromise = null;
      });
    return this.bookingsPromise;
  }

  async getAvailability(
    date: string,
    unitId: string | undefined,
    resource: Pick<Booking, "type" | "professorId" | "equipmentId">,
    excludeBookingId?: string,
    durationMinutes = 60,
  ) {
    const unit = unitId ? `&unitId=${encodeURIComponent(unitId)}` : "";
    const professor = resource.professorId
      ? `&professorId=${encodeURIComponent(resource.professorId)}`
      : "";
    const equipment = resource.equipmentId
      ? `&equipmentId=${encodeURIComponent(resource.equipmentId)}`
      : "";
    const exclude = excludeBookingId
      ? `&excludeBookingId=${encodeURIComponent(excludeBookingId)}`
      : "";
    const duration = `&durationMinutes=${durationMinutes}`;
    return request<BookingAvailability>(
      `/bookings/availability?date=${encodeURIComponent(date)}&type=${resource.type}${unit}${professor}${equipment}${exclude}${duration}`,
    );
  }

  async getMonthlyAvailability(
    month: string,
    unitId: string | undefined,
    resource: Pick<Booking, "type" | "professorId" | "equipmentId">,
    excludeBookingId?: string,
    durationMinutes = 60,
  ) {
    const unit = unitId ? `&unitId=${encodeURIComponent(unitId)}` : "";
    const professor = resource.professorId
      ? `&professorId=${encodeURIComponent(resource.professorId)}`
      : "";
    const equipment = resource.equipmentId
      ? `&equipmentId=${encodeURIComponent(resource.equipmentId)}`
      : "";
    const exclude = excludeBookingId
      ? `&excludeBookingId=${encodeURIComponent(excludeBookingId)}`
      : "";
    const duration = `&durationMinutes=${durationMinutes}`;
    return request<{ availableDates: string[] }>(
      `/bookings/availability/month?month=${encodeURIComponent(month)}&type=${resource.type}${unit}${professor}${equipment}${exclude}${duration}`,
    );
  }

  async getTrainingBalance() {
    return request<TrainingBalance>("/bookings/training-balance");
  }

  async addUser(data: Omit<User, "id" | "createdAt"> & { password: string }) {
    const user = normalizeUser(
      await request<ApiRecord>(
        "/users",
        json("POST", {
          ...data,
          whatsapp: data.whatsapp ? phoneDigits(data.whatsapp) : undefined,
        }),
      ),
    );
    this.users = this.uniqueUsers([...this.users, user]);
    notifySuccess(
      data.role === "professor" ? "Professor cadastrado" : "Aluno cadastrado",
      `${user.name} já pode acessar o portal.`,
    );
    return user;
  }

  async restoreUser(id: string, options: MutationFeedbackOptions = {}) {
    const user = normalizeUser(
      await request<ApiRecord>(`/users/${id}/restore`, json("POST", {})),
    );
    this.users = this.uniqueUsers([
      ...this.users.filter((item) => item.id !== id),
      user,
    ]);
    options.onChange?.();
    if (!options.silent)
      notifySuccess(
        "Usuário restaurado",
        `${user.name} voltou a ter acesso ao portal.`,
      );
    return user;
  }

  async listAdminUsers(includeInactive = false) {
    if (
      includeInactive &&
      this.adminUsersLoadedAt > 0 &&
      Date.now() - this.adminUsersLoadedAt < PORTAL_CACHE_MAX_AGE_MS
    ) {
      return this.getUsers();
    }
    if (includeInactive && this.adminUsersPromise) {
      return this.adminUsersPromise;
    }
    const load = this.fetchAllPages(
      `/users${includeInactive ? "?includeInactive=true" : ""}`,
    ).then((items) => {
      this.users = this.uniqueUsers([
        ...(this.currentUser ? [this.currentUser] : []),
        ...items.map(normalizeUser),
      ]);
      if (includeInactive) this.adminUsersLoadedAt = Date.now();
      return this.getUsers();
    });
    if (!includeInactive) return load;
    this.adminUsersPromise = load.finally(() => {
      this.adminUsersPromise = null;
    });
    return this.adminUsersPromise;
  }

  async changePassword(currentPassword: string, newPassword: string) {
    const result = await request<{ changed: boolean }>(
      "/users/me/password",
      json("PATCH", { currentPassword, newPassword }),
    );
    notifySuccess("Senha alterada", "Use a nova senha no próximo acesso.");
    return result;
  }

  async updateUser(id: string, data: Partial<User>) {
    const path = id === this.currentUser?.id ? "/users/me" : `/users/${id}`;
    const payload = {
      ...data,
      ...(data.whatsapp !== undefined
        ? { whatsapp: phoneDigits(data.whatsapp) }
        : {}),
      ...(data.avatar ? { avatar: this.relativeAsset(data.avatar) } : {}),
      ...(data.banner ? { banner: this.relativeAsset(data.banner) } : {}),
    };
    const user = normalizeUser(
      await request<ApiRecord>(path, json("PATCH", payload)),
    );
    this.users = this.uniqueUsers([
      ...this.users.filter((item) => item.id !== id),
      user,
    ]);
    if (id === this.currentUser?.id) this.currentUser = user;
    notifySuccess(
      id === this.currentUser?.id ? "Perfil atualizado" : "Usuário atualizado",
      "As alterações foram salvas.",
    );
    return user;
  }

  async deleteUser(id: string, options: MutationFeedbackOptions = {}) {
    const previous = this.users.find((user) => user.id === id);
    await request(`/users/${id}`, json("DELETE"));
    this.users = this.users.map((user) =>
      user.id === id ? { ...user, active: false } : user,
    );
    options.onChange?.();
    notifyUndoable({
      title: "Usuário desativado",
      description: "O acesso ao portal foi removido.",
      undo: async () => {
        await this.restoreUser(id, { silent: true });
        options.onChange?.();
      },
      undoDescription: previous
        ? `${previous.name} voltou a ter acesso ao portal.`
        : "O acesso foi restaurado.",
    });
  }

  async addEvent(data: Omit<DJEvent, "id" | "createdAt">) {
    const event = normalizeEvent(
      await request<ApiRecord>(
        "/events",
        json("POST", {
          title: data.title,
          date: data.date,
          time: data.time,
          location: data.location,
          instagram: data.instagram,
          description: data.description,
          type: data.type,
        }),
      ),
    );
    this.events = [...this.events, event];
    notifySuccess("Evento publicado", `${event.title} já aparece no mural.`);
    return event;
  }

  async updateEvent(id: string, data: Partial<DJEvent>) {
    const event = normalizeEvent(
      await request<ApiRecord>(
        `/events/${id}`,
        json("PATCH", {
          title: data.title,
          date: data.date,
          time: data.time,
          location: data.location,
          instagram: data.instagram,
          description: data.description,
          type: data.type,
        }),
      ),
    );
    this.events = this.events.map((item) => (item.id === id ? event : item));
    notifySuccess(
      "Evento atualizado",
      "As alterações já estão disponíveis no mural.",
    );
    return event;
  }

  async deleteEvent(id: string, options: MutationFeedbackOptions = {}) {
    const previous = this.events.find((event) => event.id === id);
    if (!previous) failWithFeedback("Evento não encontrado.", 404);
    this.events = this.events.filter((event) => event.id !== id);
    options.onChange?.();
    notifyUndoable({
      title: "Evento removido",
      description: "O evento não aparece mais no mural.",
      commit: () => request(`/events/${id}`, json("DELETE", undefined, true)),
      undo: () => {
        this.events = [
          ...this.events.filter((event) => event.id !== id),
          previous,
        ];
        options.onChange?.();
      },
      undoDescription: `${previous.title} voltou ao mural.`,
    });
  }

  async addBooking(data: Omit<Booking, "id" | "createdAt">) {
    const booking = normalizeBooking(
      await request<ApiRecord>(
        "/bookings",
        json("POST", {
          studentId: data.userId || undefined,
          title: data.title,
          date: data.date,
          time: data.time,
          type: data.type,
          notes: data.notes,
          status: data.status,
          unitId: data.unitId,
          professorId: data.professorId || undefined,
          equipmentId: data.equipmentId || undefined,
          durationMinutes: data.durationMinutes,
        }),
      ),
    );
    this.bookings = [...this.bookings, booking];
    notifySuccess(
      booking.status === "pendente"
        ? "Solicitação enviada"
        : "Agendamento criado",
      booking.status === "pendente"
        ? "Você receberá uma notificação após a análise."
        : "O horário foi reservado com sucesso.",
    );
    return booking;
  }

  async updateBooking(
    id: string,
    data: Partial<Booking>,
    options: MutationFeedbackOptions & { routingBooking?: Booking } = {},
  ) {
    const current =
      options.routingBooking ??
      this.bookings.find((booking) => booking.id === id);
    const statusOnly = Object.entries(data).every(
      ([key, value]) => key === "status" || value === undefined,
    );
    let raw: ApiRecord;
    if (this.currentUser?.role === "student" && data.status === "cancelado") {
      raw = await request<ApiRecord>(
        `/bookings/${id}/cancel`,
        json("POST", {}, options.keepalive),
      );
    } else if (
      statusOnly &&
      current?.status === "pendente" &&
      data.status === "confirmado"
    ) {
      raw = await request<ApiRecord>(
        `/bookings/${id}/approve`,
        json("POST", {}, options.keepalive),
      );
    } else if (
      statusOnly &&
      current?.status === "pendente" &&
      data.status === "cancelado"
    ) {
      raw = await request<ApiRecord>(
        `/bookings/${id}/reject`,
        json("POST", {}, options.keepalive),
      );
    } else {
      raw = await request<ApiRecord>(
        `/bookings/${id}`,
        json(
          "PATCH",
          {
            studentId: data.userId,
            title: data.title,
            date: data.date,
            time: data.time,
            type: data.type,
            notes: data.notes,
            status: data.status,
            unitId: data.unitId,
            professorId: data.professorId || undefined,
            equipmentId: data.equipmentId || undefined,
            durationMinutes: data.durationMinutes,
          },
          options.keepalive,
        ),
      );
    }
    const booking = normalizeBooking(raw);
    this.bookings = this.bookings.map((item) =>
      item.id === id ? booking : item,
    );
    const success =
      data.status === "confirmado" && current?.status === "pendente"
        ? ["Solicitação aprovada", "O aluno receberá a confirmação."]
        : data.status === "cancelado" &&
            current?.status === "pendente" &&
            this.currentUser?.role !== "student"
          ? ["Solicitação recusada", "O aluno será informado da decisão."]
          : data.status === "cancelado"
            ? ["Agendamento cancelado", "O horário foi liberado na agenda."]
            : ["Agendamento atualizado", "As alterações foram salvas."];
    options.onChange?.();
    if (!options.silent) notifySuccess(success[0], success[1]);
    return booking;
  }

  async cancelBooking(id: string, options: MutationFeedbackOptions = {}) {
    const previous = this.bookings.find((booking) => booking.id === id);
    if (!previous) failWithFeedback("Agendamento não encontrado.", 404);
    if (previous.status === "cancelado") return previous;

    this.bookings = this.bookings.map((booking) =>
      booking.id === id ? { ...booking, status: "cancelado" } : booking,
    );
    options.onChange?.();
    notifyUndoable({
      title:
        previous.status === "pendente" && this.currentUser?.role !== "student"
          ? "Solicitação recusada"
          : "Agendamento cancelado",
      description:
        previous.status === "pendente" && this.currentUser?.role !== "student"
          ? "O aluno será informado após o prazo para desfazer."
          : "O horário será liberado após o prazo para desfazer.",
      commit: async () => {
        await this.updateBooking(
          id,
          { status: "cancelado" },
          { silent: true, routingBooking: previous, keepalive: true },
        );
      },
      undo: () => {
        this.bookings = this.bookings.map((booking) =>
          booking.id === id ? previous : booking,
        );
        options.onChange?.();
      },
      undoDescription:
        previous.status === "pendente"
          ? "A solicitação voltou para análise."
          : "O agendamento foi restaurado.",
    });
    return { ...previous, status: "cancelado" as const };
  }

  async deleteBooking(id: string, options: MutationFeedbackOptions = {}) {
    const previous = this.bookings.find((booking) => booking.id === id);
    if (!previous) failWithFeedback("Agendamento não encontrado.", 404);

    this.bookings = this.bookings.filter((booking) => booking.id !== id);
    options.onChange?.();
    notifyUndoable({
      title: "Agendamento removido",
      description: "O agendamento não aparece mais na agenda.",
      commit: () => request(`/bookings/${id}`, json("DELETE", undefined, true)),
      undo: () => {
        this.bookings = [
          previous,
          ...this.bookings.filter((booking) => booking.id !== id),
        ];
        options.onChange?.();
      },
      undoDescription: "O agendamento voltou para a agenda.",
    });
    return previous;
  }

  async rescheduleBooking(id: string, data: Omit<Booking, "id" | "createdAt">) {
    const booking = normalizeBooking(
      await request<ApiRecord>(
        `/bookings/${id}/reschedule`,
        json("POST", {
          title: data.title,
          date: data.date,
          time: data.time,
          type: data.type,
          notes: data.notes,
          unitId: data.unitId,
          professorId: data.professorId || undefined,
          equipmentId: data.equipmentId || undefined,
          durationMinutes: data.durationMinutes,
        }),
      ),
    );
    this.bookings = [...this.bookings, booking];
    notifySuccess(
      "Remarcação solicitada",
      "Você receberá uma notificação após a análise.",
    );
    return booking;
  }

  async addMaterial(data: Omit<Material, "id" | "createdAt">) {
    const categoryId = data.category
      ? this.categoryId(data.category)
      : undefined;
    const material = normalizeMaterial(
      await request<ApiRecord>(
        "/materials",
        json("POST", {
          title: data.title,
          description: data.description,
          categoryId,
          status: data.status,
          coverImage: data.coverImage
            ? this.relativeAsset(data.coverImage)
            : undefined,
          body: data.body ? this.relativeAssetHtml(data.body) : undefined,
          attachments: data.attachments?.map((item) => ({
            legacyId: item.id,
            name: item.name,
            type: item.type,
            url: this.relativeAsset(item.url),
            size: item.size,
          })),
        }),
      ),
    );
    this.materials = [material, ...this.materials];
    if (material.status === "draft") {
      notifySuccess(
        "Rascunho salvo",
        "Você poderá continuar a edição pela categoria Rascunhos.",
      );
    } else {
      notifySuccess(
        "Material publicado",
        `${material.title} já está disponível para os alunos.`,
      );
    }
    return material;
  }

  async updateMaterial(id: string, data: Partial<Material>) {
    const material = normalizeMaterial(
      await request<ApiRecord>(
        `/materials/${id}`,
        json("PATCH", {
          title: data.title,
          description: data.description,
          status: data.status,
          categoryId: data.category
            ? this.categoryId(data.category)
            : undefined,
          coverImage: data.coverImage
            ? this.relativeAsset(data.coverImage)
            : undefined,
          body: data.body ? this.relativeAssetHtml(data.body) : data.body,
          attachments: data.attachments?.map((item) => ({
            legacyId: item.id,
            name: item.name,
            type: item.type,
            url: this.relativeAsset(item.url),
            size: item.size,
          })),
        }),
      ),
    );
    this.materials = this.materials.map((item) =>
      item.id === id ? material : item,
    );
    notifySuccess(
      material.status === "draft" ? "Rascunho salvo" : "Material atualizado",
      material.status === "draft"
        ? "As alterações do rascunho foram salvas."
        : "As alterações foram salvas.",
    );
    return material;
  }

  async deleteMaterial(id: string, options: MutationFeedbackOptions = {}) {
    const previous = this.materials.find((material) => material.id === id);
    if (!previous) failWithFeedback("Material não encontrado.", 404);
    this.materials = this.materials.filter((material) => material.id !== id);
    options.onChange?.();
    notifyUndoable({
      title: "Material removido",
      description: "O conteúdo não está mais disponível.",
      commit: () =>
        request(`/materials/${id}`, json("DELETE", undefined, true)),
      undo: () => {
        this.materials = [
          previous,
          ...this.materials.filter((material) => material.id !== id),
        ];
        options.onChange?.();
      },
      undoDescription: `${previous.title} voltou a ficar disponível.`,
    });
  }

  async addMaterialCategory(name: string) {
    const category = await request<ApiRecord>(
      "/materials/categories",
      json("POST", { name }),
    );
    this.categories.push({
      id: asString(category.id),
      name: asString(category.name),
    });
    notifySuccess(
      "Categoria criada",
      `${asString(category.name)} já pode ser usada nos materiais.`,
    );
    return this.getMaterialCategories();
  }

  async updateMaterialCategory(oldName: string, newName: string) {
    const category = this.categories.find((item) => item.name === oldName);
    if (!category) failWithFeedback("Categoria não encontrada.", 404);
    const updated = await request<ApiRecord>(
      `/materials/categories/${category.id}`,
      json("PATCH", { name: newName }),
    );
    category.name = asString(updated.name);
    this.materials = this.materials.map((material) =>
      material.category === oldName
        ? { ...material, category: category.name }
        : material,
    );
    notifySuccess(
      "Categoria atualizada",
      `A categoria agora se chama ${category.name}.`,
    );
    return this.getMaterialCategories();
  }

  async deleteMaterialCategory(
    name: string,
    transferTo?: string,
    options: MutationFeedbackOptions = {},
  ) {
    const category = this.categories.find((item) => item.name === name);
    const transfer = transferTo
      ? this.categories.find((item) => item.name === transferTo)
      : undefined;
    if (!category || (transferTo && !transfer))
      failWithFeedback("Categoria não encontrada.", 404);
    const previousMaterials = this.materials
      .filter((material) => material.category === name)
      .map((material) => ({ id: material.id, category: material.category }));
    this.categories = this.categories.filter((item) => item.id !== category.id);
    if (transferTo)
      this.materials = this.materials.map((material) =>
        material.category === name
          ? { ...material, category: transferTo }
          : material,
      );
    options.onChange?.();
    notifyUndoable({
      title: "Categoria removida",
      description: transferTo
        ? `Os materiais foram movidos para ${transferTo}.`
        : "A categoria foi excluída.",
      commit: () =>
        request(
          `/materials/categories/${category.id}`,
          json(
            "DELETE",
            {
              transferToCategoryId: transfer?.id,
            },
            true,
          ),
        ),
      undo: () => {
        this.categories = [
          ...this.categories.filter((item) => item.id !== category.id),
          category,
        ];
        const previousById = new Map(
          previousMaterials.map((material) => [material.id, material.category]),
        );
        this.materials = this.materials.map((material) =>
          previousById.has(material.id)
            ? { ...material, category: previousById.get(material.id)! }
            : material,
        );
        options.onChange?.();
      },
      undoDescription: `${name} e seus vínculos foram restaurados.`,
    });
    return this.getMaterialCategories();
  }

  async uploadFile(file: File, purpose: string): Promise<UploadedFile> {
    const body = new FormData();
    body.append("file", file);
    body.append("purpose", purpose);
    const uploaded = await request<UploadedFile>("/files", {
      method: "POST",
      body,
    });
    notifySuccess(
      "Arquivo enviado",
      `${file.name} foi armazenado com segurança.`,
    );
    return { ...uploaded, url: assetUrl(uploaded.url) ?? uploaded.url };
  }

  async deleteFile(
    id: string,
    options: { silent?: boolean; keepalive?: boolean } = {},
  ) {
    await request(`/files/${id}`, json("DELETE", undefined, options.keepalive));
    if (!options.silent)
      notifySuccess("Arquivo removido", "O anexo foi excluído.");
  }

  async getPublicUnits() {
    if (
      this.publicUnitsLoadedAt > 0 &&
      Date.now() - this.publicUnitsLoadedAt < PORTAL_CACHE_MAX_AGE_MS
    ) {
      return this.getUnits();
    }
    if (!this.publicUnitsPromise) {
      this.publicUnitsPromise = request<ApiRecord[]>("/units")
        .then((items) => {
          this.units = items.map(normalizeUnit);
          this.publicUnitsLoadedAt = Date.now();
          return this.getUnits();
        })
        .finally(() => {
          this.publicUnitsPromise = null;
        });
    }
    return this.publicUnitsPromise;
  }

  async listAdminUnits() {
    this.publicUnitsLoadedAt = 0;
    this.units = (await request<ApiRecord[]>("/units/admin/all")).map(
      normalizeUnit,
    );
    return this.getUnits();
  }

  async saveUnit(data: Omit<Unit, "id">, id?: string) {
    const payload = {
      ...data,
      mapSrc: data.mapSrc || undefined,
      mapsHref: data.mapsHref || undefined,
    };
    const raw = await request<ApiRecord>(
      id ? `/units/${id}` : "/units",
      json(id ? "PATCH" : "POST", payload),
    );
    const unit = normalizeUnit(raw);
    this.units = [...this.units.filter((item) => item.id !== unit.id), unit];
    notifySuccess(
      id ? "Unidade atualizada" : "Unidade criada",
      `${unit.label} foi salva com sucesso.`,
    );
    return unit;
  }

  async deactivateUnit(id: string, options: MutationFeedbackOptions = {}) {
    const previous = this.units.find((unit) => unit.id === id);
    if (!previous) failWithFeedback("Unidade não encontrada.", 404);
    const inactive = { ...previous, active: false };
    this.units = [...this.units.filter((item) => item.id !== id), inactive];
    options.onChange?.();
    notifyUndoable({
      title: "Unidade desativada",
      description: `${previous.label} não aparece mais para novos agendamentos.`,
      commit: () => request(`/units/${id}`, json("DELETE", undefined, true)),
      undo: () => {
        this.units = [...this.units.filter((item) => item.id !== id), previous];
        options.onChange?.();
      },
      undoDescription: `${previous.label} voltou a aceitar agendamentos.`,
    });
    return inactive;
  }

  async listAdminEquipments() {
    this.equipments = (await request<ApiRecord[]>("/equipments/admin/all")).map(
      normalizeEquipment,
    );
    return this.getEquipments();
  }

  async saveEquipment(data: Omit<Equipment, "id" | "unitLabel">, id?: string) {
    const raw = await request<ApiRecord>(
      id ? `/equipments/${id}` : "/equipments",
      json(id ? "PATCH" : "POST", data),
    );
    const equipment = normalizeEquipment(raw);
    this.equipments = [
      ...this.equipments.filter((item) => item.id !== equipment.id),
      equipment,
    ];
    notifySuccess(
      id ? "Equipamento atualizado" : "Equipamento criado",
      `${equipment.name} foi salvo com sucesso.`,
    );
    return equipment;
  }

  async deactivateEquipment(id: string, options: MutationFeedbackOptions = {}) {
    const previous = this.equipments.find((equipment) => equipment.id === id);
    if (!previous) failWithFeedback("Equipamento não encontrado.", 404);
    const inactive = { ...previous, active: false };
    this.equipments = [
      ...this.equipments.filter((item) => item.id !== id),
      inactive,
    ];
    options.onChange?.();
    notifyUndoable({
      title: "Equipamento desativado",
      description: `${previous.name} não aparece mais para novos treinos.`,
      commit: () =>
        request(`/equipments/${id}`, json("DELETE", undefined, true)),
      undo: () => {
        this.equipments = [
          ...this.equipments.filter((item) => item.id !== id),
          previous,
        ];
        options.onChange?.();
      },
      undoDescription: `${previous.name} voltou a ficar disponível.`,
    });
    return inactive;
  }

  async submitLead(
    data: Pick<
      Lead,
      "firstName" | "lastName" | "email" | "message" | "unitKey"
    >,
  ) {
    const result = await request<{ id: string; received: boolean }>(
      "/leads",
      json("POST", data),
    );
    notifySuccess(
      "Mensagem enviada",
      "A equipe da DJ ON entrará em contato com você.",
    );
    return result;
  }

  async updateLead(
    id: string,
    data: Partial<Pick<Lead, "status" | "internalNotes">> & {
      assignedTo?: string;
    },
  ) {
    const lead = normalizeLead(
      await request<ApiRecord>(`/leads/${id}`, json("PATCH", data)),
    );
    this.leads = this.leads.map((item) => (item.id === id ? lead : item));
    notifySuccess(
      "Contato atualizado",
      "O status e as observações foram salvos.",
    );
    return lead;
  }

  async deleteLead(id: string, options: MutationFeedbackOptions = {}) {
    const previous = this.leads.find((lead) => lead.id === id);
    if (!previous) failWithFeedback("Contato não encontrado.", 404);
    this.leads = this.leads.filter((item) => item.id !== id);
    options.onChange?.();
    notifyUndoable({
      title: "Contato removido",
      description: "O registro foi excluído da lista.",
      commit: () => request(`/leads/${id}`, json("DELETE", undefined, true)),
      undo: () => {
        this.leads = [previous, ...this.leads.filter((lead) => lead.id !== id)];
        options.onChange?.();
      },
      undoDescription: "O contato voltou para a lista.",
    });
  }

  async search(query: string) {
    if (query.trim().length < 2)
      return { users: [], events: [], materials: [] };
    const result = await request<{
      users: ApiRecord[];
      events: ApiRecord[];
      materials: ApiRecord[];
    }>(`/search?q=${encodeURIComponent(query.trim())}`);
    const normalized = {
      users: result.users.map(normalizeUser),
      events: result.events.map(normalizeEvent),
      materials: result.materials.map(normalizeMaterial),
    };
    this.users = this.uniqueUsers([...this.users, ...normalized.users]);
    this.events = [
      ...new Map(
        [...this.events, ...normalized.events].map((item) => [item.id, item]),
      ).values(),
    ];
    this.materials = [
      ...new Map(
        [...this.materials, ...normalized.materials].map((item) => [
          item.id,
          item,
        ]),
      ).values(),
    ];
    return normalized;
  }

  async subscribePush(subscription: PushSubscriptionJSON) {
    const result = await request(
      "/notifications/push-subscriptions",
      json("POST", {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys?.p256dh,
        auth: subscription.keys?.auth,
      }),
    );
    notifySuccess(
      "Alertas ativados",
      "Você receberá avisos importantes neste dispositivo.",
    );
    return result;
  }

  private categoryId(name: string) {
    const category = this.categories.find((item) => item.name === name);
    if (!category) failWithFeedback("Categoria não encontrada.", 404);
    return category.id;
  }

  private relativeAsset(url: string) {
    if (!url) return url;
    try {
      const parsed = new URL(url);
      return parsed.origin === new URL(apiBase()).origin
        ? `${parsed.pathname}${parsed.search}`
        : url;
    } catch {
      return url;
    }
  }

  private relativeAssetHtml(html: string) {
    return html.replace(
      /(src=["'])(https?:\/\/[^"']+\/api\/v1\/files\/[a-f\d]{24}[^"']*)/gi,
      (_match, prefix, url) => `${prefix}${this.relativeAsset(url)}`,
    );
  }

  private async fetchAllPages(path: string) {
    const items: ApiRecord[] = [];
    const separator = path.includes("?") ? "&" : "?";
    for (let page = 1; ; page += 1) {
      const result = await request<ApiPage>(
        `${path}${separator}page=${page}&limit=100`,
      );
      items.push(...result.items);
      if (items.length >= result.total || result.items.length === 0)
        return items;
    }
  }

  private uniqueUsers(users: User[]) {
    return [...new Map(users.map((user) => [user.id, user])).values()].sort(
      (a, b) => userNameCollator.compare(a.name, b.name),
    );
  }

  private normalizeNotification(raw: ApiRecord): Notification {
    return {
      id: asString(raw.id),
      type: asString(raw.type),
      title: asString(raw.title),
      body: asString(raw.body),
      url: asString(raw.url, "/dashboard/student"),
      metadata: reference(raw.metadata) ?? {},
      readAt: asString(raw.readAt) || undefined,
      createdAt: asString(raw.createdAt),
    };
  }

  private hydratePortalCache(me: User) {
    if (typeof window === "undefined") return false;
    try {
      const raw = sessionStorage.getItem(PORTAL_CACHE_KEY);
      if (!raw) return false;
      const snapshot = JSON.parse(raw) as Partial<PortalCacheSnapshot>;
      const arrays = [
        snapshot.users,
        snapshot.events,
        snapshot.bookings,
        snapshot.materials,
        snapshot.categories,
        snapshot.notifications,
        snapshot.units,
        snapshot.equipments,
        snapshot.leads,
      ];
      if (
        snapshot.version !== PORTAL_CACHE_VERSION ||
        snapshot.userId !== me.id ||
        snapshot.role !== me.role ||
        typeof snapshot.savedAt !== "number" ||
        Date.now() - snapshot.savedAt > PORTAL_CACHE_MAX_AGE_MS ||
        arrays.some((items) => !Array.isArray(items))
      ) {
        clearPortalCache();
        return false;
      }

      this.currentUser = me;
      this.users = this.uniqueUsers([
        me,
        ...(snapshot.users as User[]).filter((user) => user.id !== me.id),
      ]);
      this.events = snapshot.events as DJEvent[];
      this.bookings = snapshot.bookings as Booking[];
      this.materials = snapshot.materials as Material[];
      this.categories = snapshot.categories as CategoryRecord[];
      this.notifications = snapshot.notifications as Notification[];
      this.units = snapshot.units as Unit[];
      this.equipments = snapshot.equipments as Equipment[];
      this.leads = snapshot.leads as Lead[];
      this.hasBootstrapData = true;
      this.bootstrapLoadedAt = snapshot.savedAt;
      this.notificationsLoadedAt = snapshot.savedAt;
      this.bookingsLoadedAt = snapshot.savedAt;
      this.publicUnitsLoadedAt = snapshot.savedAt;
      return true;
    } catch {
      clearPortalCache();
      return false;
    }
  }

  private persistPortalCache() {
    if (typeof window === "undefined" || !this.currentUser) return;
    const snapshot: PortalCacheSnapshot = {
      version: PORTAL_CACHE_VERSION,
      savedAt: this.bootstrapLoadedAt,
      userId: this.currentUser.id,
      role: this.currentUser.role,
      users: this.users,
      events: this.events,
      bookings: this.bookings,
      materials: this.materials,
      categories: this.categories,
      notifications: this.notifications,
      units: this.units,
      equipments: this.equipments,
      leads: this.leads,
    };
    try {
      sessionStorage.setItem(PORTAL_CACHE_KEY, JSON.stringify(snapshot));
    } catch {
      clearPortalCache();
    }
  }

  private reset() {
    clearPortalCache();
    this.currentUser = null;
    this.users = [];
    this.events = [];
    this.bookings = [];
    this.materials = [];
    this.categories = [];
    this.notifications = [];
    this.units = [];
    this.equipments = [];
    this.leads = [];
    this.hasBootstrapData = false;
    this.bootstrapLoadedAt = 0;
    this.notificationsLoadedAt = 0;
    this.bookingsLoadedAt = 0;
    this.publicUnitsLoadedAt = 0;
    this.adminUsersLoadedAt = 0;
    this.bootstrapPromise = null;
    this.restoreSessionPromise = null;
    this.publicUnitsPromise = null;
    this.adminUsersPromise = null;
    this.notificationsPromise = null;
    this.bookingsPromise = null;
  }
}

export const store = new ApiStore();
