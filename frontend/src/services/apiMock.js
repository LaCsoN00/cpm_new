// ============================================================
//  CPM Demo Mode - Mock API Handler
//  Intercepts all Axios requests when 'cpm_demo_mode' is active
//  and returns simulated responses from a localStorage database.
// ============================================================

const STORAGE_KEY = 'cpm_demo_db'

// -----------------------------------------------------------
// Initial dataset (restored on "reset demo")
// -----------------------------------------------------------
const INITIAL_DATA = {
  users: [
    {
      id: 1,
      name: 'Admin Demo',
      email: 'demo@cpm.com',
      password: 'demo1234',
      avatar: null,
      role: 'ADMIN',
      emailNotifications: true,
      browserNotifications: false,
      isApproved: true,
      createdAt: '2025-01-15T08:00:00.000Z',
      updatedAt: '2025-01-15T08:00:00.000Z',
    },
    {
      id: 2,
      name: 'Sophie Martin',
      email: 'sophie@cpm.com',
      password: 'demo1234',
      avatar: null,
      role: 'MANAGER',
      emailNotifications: true,
      browserNotifications: false,
      isApproved: true,
      createdAt: '2025-02-01T09:00:00.000Z',
      updatedAt: '2025-02-01T09:00:00.000Z',
    },
    {
      id: 3,
      name: 'Jean-Paul Ekwalla',
      email: 'jean@cpm.com',
      password: 'demo1234',
      avatar: null,
      role: 'COLLABORATOR',
      emailNotifications: false,
      browserNotifications: true,
      isApproved: true,
      createdAt: '2025-03-10T10:00:00.000Z',
      updatedAt: '2025-03-10T10:00:00.000Z',
    },
  ],
  clients: [
    {
      id: 1,
      name: 'Jean Mvondo',
      company: 'SEEG Gabon',
      email: 'j.mvondo@seeg.ga',
      phone: '+241 74 12 34 56',
      createdAt: '2025-01-20T10:00:00.000Z',
    },
    {
      id: 2,
      name: 'Marie Obame',
      company: 'Airtel Gabon',
      email: 'm.obame@airtel.ga',
      phone: '+241 66 98 76 54',
      createdAt: '2025-02-10T11:00:00.000Z',
    },
    {
      id: 3,
      name: 'Pierre Nzamba',
      company: 'BGFI Bank',
      email: 'p.nzamba@bgfi.com',
      phone: '+241 77 55 44 33',
      createdAt: '2025-03-05T14:00:00.000Z',
    },
  ],
  projects: [
    {
      id: 1,
      name: 'Systeme ERP SEEG Phase 1',
      description: "Mise en place d'un ERP complet pour la gestion des ressources humaines et comptabilite de la SEEG.",
      startDate: '2025-01-15T00:00:00.000Z',
      endDate: '2025-07-30T00:00:00.000Z',
      status: 'IN_PROGRESS',
      responsible: 'Sophie Martin',
      creatorId: 1,
      clientId: 1,
      inviteCode: 'DEMO-SEEG',
      collaboratorIds: [2, 3],
      createdAt: '2025-01-15T09:00:00.000Z',
      updatedAt: '2025-06-01T12:00:00.000Z',
    },
    {
      id: 2,
      name: 'Portail Client Airtel',
      description: "Developpement d'un portail web permettant aux clients d'Airtel de gerer leur abonnement en ligne.",
      startDate: '2025-03-01T00:00:00.000Z',
      endDate: '2025-09-30T00:00:00.000Z',
      status: 'IN_PROGRESS',
      responsible: 'Jean-Paul Ekwalla',
      creatorId: 1,
      clientId: 2,
      inviteCode: 'DEMO-AIR',
      collaboratorIds: [3],
      createdAt: '2025-03-01T08:00:00.000Z',
      updatedAt: '2025-07-01T09:00:00.000Z',
    },
    {
      id: 3,
      name: 'Audit Systeme BGFI',
      description: 'Audit complet des systemes informatiques de BGFI Bank et rapport de conformite DGSSI.',
      startDate: '2024-11-01T00:00:00.000Z',
      endDate: '2025-02-28T00:00:00.000Z',
      status: 'COMPLETED',
      responsible: 'Sophie Martin',
      creatorId: 1,
      clientId: 3,
      inviteCode: 'DEMO-BGFI',
      collaboratorIds: [2],
      createdAt: '2024-11-01T08:00:00.000Z',
      updatedAt: '2025-02-28T17:00:00.000Z',
    },
    {
      id: 4,
      name: 'Refonte Site Web SEEG',
      description: 'Refonte complete du site institutionnel de la SEEG avec CMS moderne et integration API.',
      startDate: '2025-08-01T00:00:00.000Z',
      endDate: '2025-12-31T00:00:00.000Z',
      status: 'PLANNED',
      responsible: 'Sophie Martin',
      creatorId: 1,
      clientId: 1,
      inviteCode: 'DEMO-WEB',
      collaboratorIds: [],
      createdAt: '2025-07-01T10:00:00.000Z',
      updatedAt: '2025-07-01T10:00:00.000Z',
    },
  ],
  milestones: [
    {
      id: 1,
      name: 'Analyse des besoins',
      targetDate: '2025-02-15T00:00:00.000Z',
      status: 'ACHIEVED',
      progress: 100,
      projectId: 1,
      createdAt: '2025-01-15T09:00:00.000Z',
      updatedAt: '2025-02-14T15:00:00.000Z',
    },
    {
      id: 2,
      name: 'Conception architecture',
      targetDate: '2025-03-31T00:00:00.000Z',
      status: 'ACHIEVED',
      progress: 100,
      projectId: 1,
      createdAt: '2025-01-15T09:00:00.000Z',
      updatedAt: '2025-03-28T16:00:00.000Z',
    },
    {
      id: 3,
      name: 'Developpement module RH',
      targetDate: '2025-06-15T00:00:00.000Z',
      status: 'PENDING',
      progress: 65,
      projectId: 1,
      createdAt: '2025-01-15T09:00:00.000Z',
      updatedAt: '2025-07-01T10:00:00.000Z',
    },
    {
      id: 4,
      name: 'Developpement module Comptabilite',
      targetDate: '2025-07-30T00:00:00.000Z',
      status: 'PENDING',
      progress: 30,
      projectId: 1,
      createdAt: '2025-01-15T09:00:00.000Z',
      updatedAt: '2025-07-01T10:00:00.000Z',
    },
    {
      id: 5,
      name: 'Maquettes UI/UX',
      targetDate: '2025-04-15T00:00:00.000Z',
      status: 'ACHIEVED',
      progress: 100,
      projectId: 2,
      createdAt: '2025-03-01T08:00:00.000Z',
      updatedAt: '2025-04-12T11:00:00.000Z',
    },
    {
      id: 6,
      name: 'Developpement frontend',
      targetDate: '2025-07-31T00:00:00.000Z',
      status: 'PENDING',
      progress: 50,
      projectId: 2,
      createdAt: '2025-03-01T08:00:00.000Z',
      updatedAt: '2025-07-15T10:00:00.000Z',
    },
    {
      id: 7,
      name: 'Collecte documentation',
      targetDate: '2024-12-31T00:00:00.000Z',
      status: 'ACHIEVED',
      progress: 100,
      projectId: 3,
      createdAt: '2024-11-01T08:00:00.000Z',
      updatedAt: '2024-12-28T17:00:00.000Z',
    },
    {
      id: 8,
      name: 'Rapport final audit',
      targetDate: '2025-02-28T00:00:00.000Z',
      status: 'ACHIEVED',
      progress: 100,
      projectId: 3,
      createdAt: '2024-11-01T08:00:00.000Z',
      updatedAt: '2025-02-25T15:00:00.000Z',
    },
  ],
  tickets: [
    {
      id: 1,
      title: 'Probleme de connexion au module RH',
      description: "Les utilisateurs du departement RH ne peuvent pas se connecter depuis 14h. L'authentification LDAP retourne une erreur 503.",
      priority: 'HIGH',
      status: 'RESOLVED',
      creatorId: 3,
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      comments: [
        {
          id: 1,
          content: "J'ai identifie le probleme - le certificat LDAP a expire. Renouvellement en cours.",
          ticketId: 1,
          userId: 2,
          createdAt: new Date(Date.now() - 5.5 * 24 * 60 * 60 * 1000).toISOString(),
          user: { id: 2, name: 'Sophie Martin', avatar: null },
        },
        {
          id: 2,
          content: 'Certificat renouvele et deploye. Le probleme est resolu. Merci pour la reactivite !',
          ticketId: 1,
          userId: 3,
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          user: { id: 3, name: 'Jean-Paul Ekwalla', avatar: null },
        },
      ],
      creator: { id: 3, name: 'Jean-Paul Ekwalla', avatar: null },
    },
    {
      id: 2,
      title: 'Lenteurs sur la page de reporting',
      description: 'La generation des rapports PDF prend plus de 45 secondes. Le timeout serveur est atteint pour les gros rapports.',
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      creatorId: 2,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      comments: [
        {
          id: 3,
          content: "Analyse en cours. Il semble que la requete SQL de rapport ne soit pas optimisee. Je vais ajouter des index.",
          ticketId: 2,
          userId: 1,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          user: { id: 1, name: 'Admin Demo', avatar: null },
        },
      ],
      creator: { id: 2, name: 'Sophie Martin', avatar: null },
    },
    {
      id: 3,
      title: 'Demande de nouvelle fonctionnalite - Export Excel',
      description: "Le client souhaite pouvoir exporter la liste des utilisateurs au format Excel depuis l'interface d'administration.",
      priority: 'LOW',
      status: 'OPEN',
      creatorId: 1,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      comments: [],
      creator: { id: 1, name: 'Admin Demo', avatar: null },
    },
    {
      id: 4,
      title: "Erreur 500 sur l'API de facturation",
      description: "L'endpoint POST /api/invoices retourne une erreur 500 pour les factures avec plus de 10 lignes d'articles.",
      priority: 'HIGH',
      status: 'OPEN',
      creatorId: 2,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      comments: [],
      creator: { id: 2, name: 'Sophie Martin', avatar: null },
    },
    {
      id: 5,
      title: 'Mise a jour des dependances npm',
      description: 'Plusieurs vulnerabilites ont ete detectees dans les dependances du projet. Mise a jour necessaire avant la prochaine release.',
      priority: 'MEDIUM',
      status: 'OPEN',
      creatorId: 3,
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      comments: [],
      creator: { id: 3, name: 'Jean-Paul Ekwalla', avatar: null },
    },
  ],
  evaluations: [
    { id: 1, indicator: 'Taux de disponibilite systeme (%)', targetValue: 99.9, actualValue: 99.7, projectId: 1, createdAt: '2025-05-01T00:00:00.000Z', updatedAt: '2025-07-01T00:00:00.000Z' },
    { id: 2, indicator: 'Delai de livraison (jours)', targetValue: 180, actualValue: 165, projectId: 1, createdAt: '2025-05-01T00:00:00.000Z', updatedAt: '2025-07-01T00:00:00.000Z' },
    { id: 3, indicator: 'Satisfaction client (%)', targetValue: 90, actualValue: 87, projectId: 2, createdAt: '2025-06-01T00:00:00.000Z', updatedAt: '2025-07-01T00:00:00.000Z' },
    { id: 4, indicator: 'Couverture de tests (%)', targetValue: 80, actualValue: 72, projectId: 2, createdAt: '2025-06-01T00:00:00.000Z', updatedAt: '2025-07-01T00:00:00.000Z' },
    { id: 5, indicator: 'Non-conformites detectees', targetValue: 0, actualValue: 3, projectId: 3, createdAt: '2025-01-15T00:00:00.000Z', updatedAt: '2025-02-28T00:00:00.000Z' },
    { id: 6, indicator: 'Vulnerabilites critiques corrigees (%)', targetValue: 100, actualValue: 100, projectId: 3, createdAt: '2025-01-15T00:00:00.000Z', updatedAt: '2025-02-28T00:00:00.000Z' },
  ],
  invoices: [
    {
      id: 1,
      number: 'FACT-2025-001',
      date: '2025-04-01T00:00:00.000Z',
      totalHT: 12500000,
      TVA: 2500000,
      totalTTC: 15000000,
      status: 'PAID',
      companyName: 'CPM Technologies',
      companyAddress: 'Libreville, Gabon - BP 3456',
      companyPhone: '+241 77 00 11 22',
      companyEmail: 'contact@cpm.ga',
      companyLogo: null,
      clientId: 1,
      projectId: 1,
      createdAt: '2025-04-01T00:00:00.000Z',
      updatedAt: '2025-05-15T00:00:00.000Z',
      items: [
        { id: 1, description: 'Analyse et conception systeme ERP - Phase 1', quantity: 1, price: 5000000, invoiceId: 1 },
        { id: 2, description: 'Developpement modules RH (200h x 37 500 FCFA)', quantity: 200, price: 37500, invoiceId: 1 },
      ],
    },
    {
      id: 2,
      number: 'FACT-2025-002',
      date: '2025-05-15T00:00:00.000Z',
      totalHT: 8000000,
      TVA: 1600000,
      totalTTC: 9600000,
      status: 'APPROVED',
      companyName: 'CPM Technologies',
      companyAddress: 'Libreville, Gabon - BP 3456',
      companyPhone: '+241 77 00 11 22',
      companyEmail: 'contact@cpm.ga',
      companyLogo: null,
      clientId: 2,
      projectId: 2,
      createdAt: '2025-05-15T00:00:00.000Z',
      updatedAt: '2025-06-01T00:00:00.000Z',
      items: [
        { id: 3, description: 'Conception maquettes UI/UX Portail Client', quantity: 1, price: 2500000, invoiceId: 2 },
        { id: 4, description: 'Developpement frontend React.js (150h x 37 000 FCFA)', quantity: 150, price: 37000, invoiceId: 2 },
      ],
    },
    {
      id: 3,
      number: 'FACT-2025-003',
      date: '2025-02-28T00:00:00.000Z',
      totalHT: 6500000,
      TVA: 1300000,
      totalTTC: 7800000,
      status: 'PAID',
      companyName: 'CPM Technologies',
      companyAddress: 'Libreville, Gabon - BP 3456',
      companyPhone: '+241 77 00 11 22',
      companyEmail: 'contact@cpm.ga',
      companyLogo: null,
      clientId: 3,
      projectId: 3,
      createdAt: '2025-02-28T00:00:00.000Z',
      updatedAt: '2025-03-15T00:00:00.000Z',
      items: [
        { id: 5, description: 'Audit de securite et conformite - Rapport complet', quantity: 1, price: 6500000, invoiceId: 3 },
      ],
    },
    {
      id: 4,
      number: 'FACT-2025-004',
      date: new Date().toISOString(),
      totalHT: 4500000,
      TVA: 900000,
      totalTTC: 5400000,
      status: 'PENDING',
      companyName: 'CPM Technologies',
      companyAddress: 'Libreville, Gabon - BP 3456',
      companyPhone: '+241 77 00 11 22',
      companyEmail: 'contact@cpm.ga',
      companyLogo: null,
      clientId: 2,
      projectId: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: [
        { id: 6, description: 'Developpement backend API REST (120h x 37 500 FCFA)', quantity: 120, price: 37500, invoiceId: 4 },
      ],
    },
  ],
  notifications: [
    {
      id: 1,
      userId: 1,
      title: 'Bienvenue en Mode Demo !',
      message: 'Vous explorez CPM en mode demonstration. Toutes les fonctionnalites sont disponibles. Les donnees sont simulees localement.',
      type: 'INFO',
      isRead: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      userId: 1,
      title: 'Jalon complete - Analyse des besoins',
      message: 'Le jalon "Analyse des besoins" du projet ERP SEEG a ete marque comme atteint.',
      type: 'SUCCESS',
      isRead: true,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 3,
      userId: 1,
      title: 'Ticket haute priorite ouvert',
      message: "Un ticket haute priorite a ete cree : Erreur 500 sur l'API de facturation.",
      type: 'WARNING',
      isRead: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
  ],
  _nextId: {
    users: 4,
    clients: 4,
    projects: 5,
    milestones: 9,
    tickets: 6,
    evaluations: 7,
    invoices: 5,
    notifications: 4,
    comments: 4,
    invoiceItems: 7,
  },
}

// -----------------------------------------------------------
// Database access helpers
// -----------------------------------------------------------
function loadDB() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) { /* ignore */ }
  return null
}

function saveDB(db) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
}

function getDB() {
  let db = loadDB()
  if (!db) {
    db = JSON.parse(JSON.stringify(INITIAL_DATA))
    saveDB(db)
  }
  return db
}

function nextId(db, table) {
  const id = db._nextId[table] || 1
  db._nextId[table] = id + 1
  return id
}

// Public: reset to factory data (called by Navbar reset button)
export function resetDemoData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(JSON.parse(JSON.stringify(INITIAL_DATA))))
}

export function isDemoMode() {
  return localStorage.getItem('cpm_demo_mode') === 'true'
}

// -----------------------------------------------------------
// Response helpers
// -----------------------------------------------------------
function ok(data, status = 200) {
  return Promise.resolve({ data, status, headers: {}, config: {} })
}

function err(message, status = 400) {
  const error = new Error(message)
  error.response = { data: { message }, status }
  return Promise.reject(error)
}

function genInvoiceNumber(db) {
  const year = new Date().getFullYear()
  const count = db._nextId.invoices
  return `FACT-${year}-${String(count).padStart(3, '0')}`
}

// -----------------------------------------------------------
// Main mock handler
// -----------------------------------------------------------
export async function mockHandler(config) {
  const db = getDB()
  const method = config.method ? config.method.toLowerCase() : 'get'
  // Strip query-string cache busters for matching
  const rawUrl = config.url || ''
  const url = rawUrl.split('?')[0]

  // ── AUTH ─────────────────────────────────────────────────
  if (url === '/auth/login' && method === 'post') {
    const body = config.data ? JSON.parse(config.data) : {}
    const { email, password } = body
    const user = db.users.find(u => u.email === email)
    if (!user || user.password !== password) return err('Email ou mot de passe incorrect', 401)
    const token = 'demo_token_' + user.id
    const { password: _pw, ...safeUser } = user
    return ok({ user: safeUser, token })
  }

  if (url === '/auth/register' && method === 'post') {
    const body = config.data ? JSON.parse(config.data) : {}
    const { name, email, password } = body
    if (db.users.find(u => u.email === email)) return err('Cet email est deja utilise', 400)
    const id = nextId(db, 'users')
    const user = { id, name, email, password, avatar: null, role: 'COLLABORATOR', emailNotifications: true, browserNotifications: false, isApproved: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    db.users.push(user)
    saveDB(db)
    const token = 'demo_token_' + id
    const { password: _pw, ...safeUser } = user
    return ok({ user: safeUser, token })
  }

  // ── CURRENT USER ─────────────────────────────────────────
  if (url === '/users/me' && method === 'get') {
    const userId = getCurrentUserId(config)
    const user = db.users.find(u => u.id === userId)
    if (!user) return err('Non autorise', 401)
    const { password: _pw, ...safeUser } = user
    return ok(safeUser)
  }

  if (url === '/users/me' && method === 'put') {
    const userId = getCurrentUserId(config)
    const updates = config.data ? JSON.parse(config.data) : {}
    const idx = db.users.findIndex(u => u.id === userId)
    if (idx === -1) return err('Utilisateur non trouve', 404)
    db.users[idx] = { ...db.users[idx], ...updates, updatedAt: new Date().toISOString() }
    saveDB(db)
    const { password: _pw, ...safeUser } = db.users[idx]
    return ok(safeUser)
  }

  if (url === '/users/me/password' && method === 'put') {
    return ok({ message: 'Mot de passe modifie avec succes' })
  }

  if (url === '/users/me/avatar' && method === 'post') {
    return ok({ avatar: null, message: 'Avatar simule (mode demo)' })
  }

  if (url === '/users/me/settings' && method === 'put') {
    return ok({ message: 'Parametres enregistres' })
  }

  // ── USERS LIST ───────────────────────────────────────────
  if (url === '/users' && method === 'get') {
    const safe = db.users.map(({ password: _pw, ...u }) => u)
    return ok(safe)
  }

  if (url === '/users/managers' && method === 'get') {
    const managers = db.users
      .filter(u => u.role === 'ADMIN' || u.role === 'MANAGER')
      .map(({ password: _pw, ...u }) => u)
    return ok(managers)
  }

  const userRoleMatch = url.match(/^\/users\/(\d+)\/role$/)
  if (userRoleMatch && method === 'put') {
    const id = parseInt(userRoleMatch[1])
    const { role } = config.data ? JSON.parse(config.data) : {}
    const idx = db.users.findIndex(u => u.id === id)
    if (idx === -1) return err('Utilisateur non trouve', 404)
    db.users[idx].role = role
    db.users[idx].updatedAt = new Date().toISOString()
    saveDB(db)
    return ok(db.users[idx])
  }

  const userApproveMatch = url.match(/^\/users\/(\d+)\/approve$/)
  if (userApproveMatch && method === 'put') {
    const id = parseInt(userApproveMatch[1])
    const idx = db.users.findIndex(u => u.id === id)
    if (idx === -1) return err('Utilisateur non trouve', 404)
    db.users[idx].isApproved = true
    db.users[idx].updatedAt = new Date().toISOString()
    saveDB(db)
    return ok(db.users[idx])
  }

  const userSuspendMatch = url.match(/^\/users\/(\d+)\/suspend$/)
  if (userSuspendMatch && method === 'put') {
    const id = parseInt(userSuspendMatch[1])
    const idx = db.users.findIndex(u => u.id === id)
    if (idx === -1) return err('Utilisateur non trouve', 404)
    db.users[idx].isApproved = false
    db.users[idx].updatedAt = new Date().toISOString()
    saveDB(db)
    return ok(db.users[idx])
  }

  const userDeleteMatch = url.match(/^\/users\/(\d+)$/)
  if (userDeleteMatch && method === 'delete') {
    const id = parseInt(userDeleteMatch[1])
    db.users = db.users.filter(u => u.id !== id)
    saveDB(db)
    return ok({ message: 'Utilisateur supprime' })
  }

  // ── CLIENTS ──────────────────────────────────────────────
  if (url === '/clients' && method === 'get') {
    return ok(db.clients)
  }

  if (url === '/clients' && method === 'post') {
    const data = config.data ? JSON.parse(config.data) : {}
    const id = nextId(db, 'clients')
    const client = { id, ...data, createdAt: new Date().toISOString() }
    db.clients.push(client)
    saveDB(db)
    return ok(client)
  }

  const clientMatch = url.match(/^\/clients\/(\d+)$/)
  if (clientMatch) {
    const id = parseInt(clientMatch[1])
    if (method === 'put') {
      const data = config.data ? JSON.parse(config.data) : {}
      const idx = db.clients.findIndex(c => c.id === id)
      if (idx === -1) return err('Client non trouve', 404)
      db.clients[idx] = { ...db.clients[idx], ...data }
      saveDB(db)
      return ok(db.clients[idx])
    }
    if (method === 'delete') {
      db.clients = db.clients.filter(c => c.id !== id)
      saveDB(db)
      return ok({ message: 'Client supprime' })
    }
  }

  // ── PROJECTS ─────────────────────────────────────────────
  if (url === '/projects' && method === 'get') {
    const enriched = db.projects.map(p => enrichProject(db, p))
    return ok(enriched)
  }

  if (url === '/projects' && method === 'post') {
    const data = config.data ? JSON.parse(config.data) : {}
    if (!data.clientId) return err('Le client est obligatoire', 400)
    const id = nextId(db, 'projects')
    const inviteCode = 'DEMO-' + Math.random().toString(36).substr(2, 6).toUpperCase()
    const project = {
      id,
      name: data.name || 'Nouveau projet',
      description: data.description || null,
      startDate: data.startDate ? new Date(data.startDate).toISOString() : null,
      endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
      status: data.status || 'PLANNED',
      responsible: data.responsible || null,
      creatorId: getCurrentUserId(config),
      clientId: parseInt(data.clientId),
      inviteCode,
      collaboratorIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    db.projects.push(project)
    saveDB(db)
    return ok(enrichProject(db, project))
  }

  if (url === '/projects/join' && method === 'post') {
    const { inviteCode } = config.data ? JSON.parse(config.data) : {}
    const project = db.projects.find(p => p.inviteCode === inviteCode)
    if (!project) return err("Code d'invitation invalide", 404)
    const userId = getCurrentUserId(config)
    if (!project.collaboratorIds) project.collaboratorIds = []
    if (!project.collaboratorIds.includes(userId)) {
      project.collaboratorIds.push(userId)
      project.updatedAt = new Date().toISOString()
      saveDB(db)
    }
    return ok(enrichProject(db, project))
  }

  const projectMatch = url.match(/^\/projects\/(\d+)$/)
  if (projectMatch) {
    const id = parseInt(projectMatch[1])
    if (method === 'get') {
      const project = db.projects.find(p => p.id === id)
      if (!project) return err('Projet non trouve', 404)
      return ok(enrichProject(db, project))
    }
    if (method === 'put') {
      const data = config.data ? JSON.parse(config.data) : {}
      const idx = db.projects.findIndex(p => p.id === id)
      if (idx === -1) return err('Projet non trouve', 404)
      db.projects[idx] = { ...db.projects[idx], ...data, updatedAt: new Date().toISOString() }
      saveDB(db)
      return ok(enrichProject(db, db.projects[idx]))
    }
    if (method === 'delete') {
      db.projects = db.projects.filter(p => p.id !== id)
      db.milestones = db.milestones.filter(m => m.projectId !== id)
      db.evaluations = db.evaluations.filter(e => e.projectId !== id)
      db.invoices = db.invoices.filter(i => i.projectId !== id)
      saveDB(db)
      return ok({ message: 'Projet supprime' })
    }
  }

  // ── MILESTONES ───────────────────────────────────────────
  if (url.startsWith('/milestones') && method === 'get') {
    const qString = rawUrl.includes('?') ? rawUrl.split('?')[1] : ''
    const params = new URLSearchParams(qString)
    const projectId = params.get('projectId')
    let list = db.milestones
    if (projectId) list = list.filter(m => m.projectId === parseInt(projectId))
    const enriched = list.map(m => enrichMilestone(db, m))
    return ok(enriched)
  }

  if (url === '/milestones' && method === 'post') {
    const data = config.data ? JSON.parse(config.data) : {}
    if (!data.name || !data.projectId) return err('Nom et projet requis', 400)
    const id = nextId(db, 'milestones')
    const ms = {
      id,
      name: data.name,
      targetDate: data.targetDate ? new Date(data.targetDate).toISOString() : null,
      status: data.status || 'PENDING',
      progress: parseInt(data.progress) || 0,
      projectId: parseInt(data.projectId),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    db.milestones.push(ms)
    saveDB(db)
    return ok(enrichMilestone(db, ms))
  }

  const msMatch = url.match(/^\/milestones\/(\d+)$/)
  if (msMatch) {
    const id = parseInt(msMatch[1])
    if (method === 'put') {
      const data = config.data ? JSON.parse(config.data) : {}
      const idx = db.milestones.findIndex(m => m.id === id)
      if (idx === -1) return err('Jalon non trouve', 404)
      db.milestones[idx] = { ...db.milestones[idx], ...data, id, updatedAt: new Date().toISOString() }
      saveDB(db)
      return ok(enrichMilestone(db, db.milestones[idx]))
    }
    if (method === 'delete') {
      db.milestones = db.milestones.filter(m => m.id !== id)
      saveDB(db)
      return ok({ message: 'Jalon supprime' })
    }
  }

  // ── EVALUATIONS ──────────────────────────────────────────
  if (url === '/evaluations' && method === 'get') {
    const enriched = db.evaluations.map(e => ({
      ...e,
      project: db.projects.find(p => p.id === e.projectId) || null,
    }))
    return ok(enriched)
  }

  if (url === '/evaluations' && method === 'post') {
    const data = config.data ? JSON.parse(config.data) : {}
    if (!data.indicator) return err("L'indicateur est requis", 400)
    const id = nextId(db, 'evaluations')
    const ev = {
      id,
      indicator: data.indicator,
      targetValue: parseFloat(data.targetValue) || 0,
      actualValue: parseFloat(data.actualValue) || 0,
      projectId: data.projectId ? parseInt(data.projectId) : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    db.evaluations.push(ev)
    saveDB(db)
    return ok({ ...ev, project: db.projects.find(p => p.id === ev.projectId) || null })
  }

  const evMatch = url.match(/^\/evaluations\/(\d+)$/)
  if (evMatch) {
    const id = parseInt(evMatch[1])
    if (method === 'put') {
      const data = config.data ? JSON.parse(config.data) : {}
      const idx = db.evaluations.findIndex(e => e.id === id)
      if (idx === -1) return err('Evaluation non trouvee', 404)
      db.evaluations[idx] = { ...db.evaluations[idx], ...data, id, updatedAt: new Date().toISOString() }
      saveDB(db)
      return ok({ ...db.evaluations[idx], project: db.projects.find(p => p.id === db.evaluations[idx].projectId) || null })
    }
    if (method === 'delete') {
      db.evaluations = db.evaluations.filter(e => e.id !== id)
      saveDB(db)
      return ok({ message: 'Evaluation supprimee' })
    }
  }

  // ── TICKETS ──────────────────────────────────────────────
  if (url === '/tickets' && method === 'get') {
    const enriched = db.tickets.map(t => enrichTicket(db, t))
    return ok(enriched)
  }

  if (url === '/tickets' && method === 'post') {
    const data = config.data ? JSON.parse(config.data) : {}
    if (!data.title) return err('Le titre est requis', 400)
    const id = nextId(db, 'tickets')
    const userId = getCurrentUserId(config)
    const user = db.users.find(u => u.id === userId)
    const ticket = {
      id,
      title: data.title,
      description: data.description || null,
      priority: data.priority || 'MEDIUM',
      status: data.status || 'OPEN',
      creatorId: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comments: [],
      creator: user ? { id: user.id, name: user.name, avatar: user.avatar } : null,
    }
    db.tickets.push(ticket)
    saveDB(db)
    return ok(enrichTicket(db, ticket))
  }

  const ticketMatch = url.match(/^\/tickets\/(\d+)$/)
  if (ticketMatch) {
    const id = parseInt(ticketMatch[1])
    if (method === 'put') {
      const data = config.data ? JSON.parse(config.data) : {}
      const idx = db.tickets.findIndex(t => t.id === id)
      if (idx === -1) return err('Ticket non trouve', 404)
      db.tickets[idx] = { ...db.tickets[idx], ...data, id, updatedAt: new Date().toISOString() }
      saveDB(db)
      return ok(enrichTicket(db, db.tickets[idx]))
    }
    if (method === 'delete') {
      db.tickets = db.tickets.filter(t => t.id !== id)
      saveDB(db)
      return ok({ message: 'Ticket supprime' })
    }
  }

  const commentMatch = url.match(/^\/tickets\/(\d+)\/comments$/)
  if (commentMatch && method === 'post') {
    const ticketId = parseInt(commentMatch[1])
    const { content } = config.data ? JSON.parse(config.data) : {}
    const userId = getCurrentUserId(config)
    const user = db.users.find(u => u.id === userId)
    const commentId = nextId(db, 'comments')
    const comment = {
      id: commentId,
      content,
      ticketId,
      userId,
      createdAt: new Date().toISOString(),
      user: user ? { id: user.id, name: user.name, avatar: user.avatar } : null,
    }
    const ticketIdx = db.tickets.findIndex(t => t.id === ticketId)
    if (ticketIdx === -1) return err('Ticket non trouve', 404)
    if (!db.tickets[ticketIdx].comments) db.tickets[ticketIdx].comments = []
    db.tickets[ticketIdx].comments.push(comment)
    saveDB(db)
    return ok(comment)
  }

  // ── INVOICES ─────────────────────────────────────────────
  if (url === '/invoices' && method === 'get') {
    const enriched = db.invoices.map(i => enrichInvoice(db, i))
    return ok(enriched)
  }

  if (url === '/invoices' && method === 'post') {
    const data = config.data ? JSON.parse(config.data) : {}
    if (!data.clientId) return err('Le client est requis', 400)
    const id = nextId(db, 'invoices')
    const items = (data.items || []).map(() => ({
      id: nextId(db, 'invoiceItems'),
    })).map((_, idx2) => {
      const item = (data.items || [])[idx2]
      return {
        id: nextId(db, 'invoiceItems'),
        description: item.description,
        quantity: item.quantity,
        price: item.price,
        invoiceId: id,
      }
    })
    const invoice = {
      id,
      number: genInvoiceNumber(db),
      date: new Date().toISOString(),
      totalHT: data.totalHT || 0,
      TVA: data.TVA || 0,
      totalTTC: data.totalTTC || 0,
      status: data.status || 'PENDING',
      companyName: data.companyName || 'CPM Technologies',
      companyAddress: data.companyAddress || null,
      companyPhone: data.companyPhone || null,
      companyEmail: data.companyEmail || null,
      companyLogo: data.companyLogo || null,
      clientId: parseInt(data.clientId),
      projectId: data.projectId ? parseInt(data.projectId) : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: (data.items || []).map((item, idx2) => ({
        id: db._nextId.invoiceItems + idx2,
        description: item.description,
        quantity: item.quantity,
        price: item.price,
        invoiceId: id,
      })),
    }
    db._nextId.invoiceItems += (data.items || []).length
    db.invoices.push(invoice)
    saveDB(db)
    return ok(enrichInvoice(db, invoice))
  }

  const invoiceMatch = url.match(/^\/invoices\/(\d+)$/)
  if (invoiceMatch) {
    const id = parseInt(invoiceMatch[1])
    if (method === 'get') {
      const invoice = db.invoices.find(i => i.id === id)
      if (!invoice) return err('Facture non trouvee', 404)
      return ok(enrichInvoice(db, invoice))
    }
    if (method === 'put') {
      const data = config.data ? JSON.parse(config.data) : {}
      const idx = db.invoices.findIndex(i => i.id === id)
      if (idx === -1) return err('Facture non trouvee', 404)
      db.invoices[idx] = { ...db.invoices[idx], ...data, id, updatedAt: new Date().toISOString() }
      saveDB(db)
      return ok(enrichInvoice(db, db.invoices[idx]))
    }
    if (method === 'delete') {
      db.invoices = db.invoices.filter(i => i.id !== id)
      saveDB(db)
      return ok({ message: 'Facture supprimee' })
    }
  }

  // ── NOTIFICATIONS ────────────────────────────────────────
  if (url === '/notifications' && method === 'get') {
    const userId = getCurrentUserId(config)
    const notifs = db.notifications.filter(n => n.userId === userId)
    return ok(notifs.slice().reverse())
  }

  const notifReadMatch = url.match(/^\/notifications\/(\d+)\/read$/)
  if (notifReadMatch && method === 'put') {
    const id = parseInt(notifReadMatch[1])
    const idx = db.notifications.findIndex(n => n.id === id)
    if (idx !== -1) { db.notifications[idx].isRead = true; saveDB(db) }
    return ok({ message: 'Notification lue' })
  }

  if (url === '/notifications/read-all' && method === 'put') {
    const userId = getCurrentUserId(config)
    db.notifications.forEach(n => { if (n.userId === userId) n.isRead = true })
    saveDB(db)
    return ok({ message: 'Toutes lues' })
  }

  const notifDeleteMatch = url.match(/^\/notifications\/(\d+)$/)
  if (notifDeleteMatch && method === 'delete') {
    const id = parseInt(notifDeleteMatch[1])
    db.notifications = db.notifications.filter(n => n.id !== id)
    saveDB(db)
    return ok({ message: 'Notification supprimee' })
  }

  if (url === '/notifications' && method === 'delete') {
    const userId = getCurrentUserId(config)
    db.notifications = db.notifications.filter(n => n.userId !== userId)
    saveDB(db)
    return ok({ message: 'Toutes supprimees' })
  }

  // ── PUSH SUBSCRIPTIONS (stubs) ───────────────────────────
  if (url.startsWith('/push-subscriptions')) {
    return ok({ message: 'Non disponible en mode demo' })
  }

  // ── FALLBACK ─────────────────────────────────────────────
  console.warn('[CPM Demo] Unhandled mock route:', method.toUpperCase(), url)
  return ok([])
}

// -----------------------------------------------------------
// Enrichment helpers (join related entities)
// -----------------------------------------------------------
function enrichProject(db, p) {
  return {
    ...p,
    client: db.clients.find(c => c.id === p.clientId) || null,
    creator: (() => {
      const u = db.users.find(u => u.id === p.creatorId)
      return u ? { id: u.id, name: u.name, avatar: u.avatar } : null
    })(),
    collaborators: (p.collaboratorIds || []).map(uid => {
      const u = db.users.find(u => u.id === uid)
      return u ? { id: u.id, name: u.name, avatar: u.avatar } : null
    }).filter(Boolean),
    milestones: db.milestones.filter(m => m.projectId === p.id),
  }
}

function enrichMilestone(db, m) {
  return {
    ...m,
    project: db.projects.find(p => p.id === m.projectId) || null,
  }
}

function enrichTicket(db, t) {
  const creator = db.users.find(u => u.id === t.creatorId)
  return {
    ...t,
    creator: creator ? { id: creator.id, name: creator.name, avatar: creator.avatar } : null,
    comments: (t.comments || []).map(c => {
      const user = db.users.find(u => u.id === c.userId)
      return { ...c, user: user ? { id: user.id, name: user.name, avatar: user.avatar } : null }
    }),
  }
}

function enrichInvoice(db, i) {
  return {
    ...i,
    client: db.clients.find(c => c.id === i.clientId) || null,
    project: i.projectId ? (db.projects.find(p => p.id === i.projectId) || null) : null,
    items: i.items || [],
  }
}

// -----------------------------------------------------------
// Extract current user ID from token header
// -----------------------------------------------------------
function getCurrentUserId(config) {
  const auth = (config.headers && (config.headers.Authorization || config.headers.authorization)) || ''
  const token = auth.replace('Bearer ', '')
  const match = token.match(/^demo_token_(\d+)$/)
  return match ? parseInt(match[1]) : 1
}
