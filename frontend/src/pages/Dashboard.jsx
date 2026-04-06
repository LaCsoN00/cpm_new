import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import {
  ArrowUpRight, ArrowDownRight, Calendar, Clock, ChevronLeft, ChevronRight,
  MoreVertical, Search, Filter, AlertCircle, CheckCircle, User
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import api from '../services/api'
import socket from '../services/socket'
import useUIStore from '../store/uiStore'
import useAuthStore from '../store/authStore'
import ErrorBoundary from '../components/ErrorBoundary'
import i18n from '../i18n'

export default function Dashboard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { selectedDate, setSelectedDate, viewMode } = useUIStore()
  const currentUser = useAuthStore(s => s.user)
  const [stats, setStats] = useState({
    projects: 0, milestones: 0, tickets: 0, invoices: 0,
    radarData: [], areaData: [], recentTickets: []
  })
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 300)

    const fetchStats = async () => {
      setLoading(true)
      try {
        const tCache = Date.now()
        const requests = [
          api.get(`/projects?t=${tCache}`),
          api.get(`/tickets?t=${tCache}`),
          api.get(`/milestones?t=${tCache}`)
        ]
        
        if (currentUser?.role !== 'COLLABORATOR') {
          requests.push(api.get(`/invoices?t=${tCache}`))
        }

        const responses = await Promise.all(requests)
        
        const projects = responses[0].data || []
        const tickets = responses[1].data || []
        const milestones = responses[2].data || []
        const invoices = responses[3]?.data || []

        // Radar Data
        const statusMap = { PLANNED: 0, IN_PROGRESS: 0, COMPLETED: 0 }
        projects.forEach(p => { if (statusMap[p.status] !== undefined) statusMap[p.status]++ })
        const radarData = [
          { subject: t('dashboard.planned'), value: statusMap.PLANNED, fullMark: projects.length || 1 },
          { subject: t('dashboard.inProgress'), value: statusMap.IN_PROGRESS, fullMark: projects.length || 1 },
          { subject: t('dashboard.completed'), value: statusMap.COMPLETED, fullMark: projects.length || 1 }
        ]

        const areaData = []
        const currentLang = i18n.language === 'en' ? 'en-US' : 'fr-FR'
        for (let i = 6; i >= 0; i--) {
          const d = new Date()
          d.setDate(d.getDate() - i)
          const name = d.toLocaleDateString(currentLang, { weekday: 'short' })
          const count = tickets.filter(ti => ti?.createdAt && new Date(ti.createdAt).toDateString() === d.toDateString()).length
          areaData.push({ name, tickets: count })
        }

        const recentTickets = tickets.slice().reverse().slice(0, 10)

        const allMilestones = milestones
        const achievedMs = milestones.filter(m => m.status === 'ACHIEVED').length
        const milestonesAchievedPct = milestones.length > 0 ? Math.round((achievedMs / milestones.length) * 100) : 0

        setStats({
          projects: projects.length, milestones: milestones.length,
          tickets: tickets.length, invoices: invoices.length,
          radarData, areaData, recentTickets,
          allMilestones: milestones,
          allTickets: tickets,
          achievedMs, milestonesAchievedPct
        })
      } catch (e) {
        console.error('Error fetching dashboard stats:', e)
      } finally {
        setLoading(false)
      }
    }

    let debounceTimer;
    const handleUpdate = () => {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(fetchStats, 500)
    }

    fetchStats()

    socket.on('project_updated', handleUpdate)
    socket.on('ticket_updated', handleUpdate)
    socket.on('milestone_updated', handleUpdate)
    socket.on('invoice_updated', handleUpdate)

    return () => {
      socket.off('project_updated', handleUpdate)
      socket.off('ticket_updated', handleUpdate)
      socket.off('milestone_updated', handleUpdate)
      socket.off('invoice_updated', handleUpdate)
      clearTimeout(timer)
      clearTimeout(debounceTimer)
    }
  }, [currentUser])

  const filteredTickets = stats.recentTickets.filter(ti =>
    ti?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 4)

  const statCards = [
    { label: t('dashboard.totalProjects'), value: stats.projects },
    { label: t('dashboard.activeMilestones'), value: stats.milestones },
    { label: t('dashboard.newTickets'), value: stats.tickets },
    currentUser?.role !== 'COLLABORATOR' && { label: t('dashboard.invoicesIssued'), value: stats.invoices },
    currentUser?.role !== 'COLLABORATOR' && { label: t('dashboard.milestonesAchieved'), value: `${stats.milestonesAchievedPct || 0}%` },
  ].filter(Boolean)

  const handlePrevDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() - 1)
    setSelectedDate(newDate)
  }
  const handleNextDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + 1)
    setSelectedDate(newDate)
  }

  // Helper to get the 7 days of the week containing selectedDate
  const getWeekDates = (date) => {
    const startOfWeek = new Date(date)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Monday start
    startOfWeek.setDate(diff)

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek)
      d.setDate(startOfWeek.getDate() + i)
      return d
    })
  }

  const weekDates = getWeekDates(selectedDate)

  const selectedDateEvents = []
  if (stats.allMilestones) {
    stats.allMilestones.forEach(m => {
      if (m.targetDate && new Date(m.targetDate).toDateString() === selectedDate.toDateString()) {
        selectedDateEvents.push({
          id: `ms-${m.id}`,
          type: 'milestone',
          title: m.name,
          time: t('nav.milestones'),
          color: '#3b82f6'
        })
      }
    })
  }

  if (stats.allTickets) {
    stats.allTickets.forEach(ti => {
      if (ti.createdAt && new Date(ti.createdAt).toDateString() === selectedDate.toDateString()) {
        selectedDateEvents.push({
          id: `tk-${ti.id}`,
          type: 'ticket',
          title: ti.title,
          time: t('nav.tickets'),
          color: '#f59e0b'
        })
      }
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 4 }}>
          {statCards.map((c, i) => (
            <div key={i} className="stat-card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-main)', lineHeight: 1, letterSpacing: '-0.03em' }}>
                  {loading ? '—' : c.value}
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginTop: 8 }}>{c.label}</div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>

          <div className="card-custom" style={{ padding: '16px' }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-main)', marginBottom: 12 }}>{t('dashboard.projectDistribution')}</h3>
            <div style={{ height: 160, width: '100%', minHeight: 160, overflow: 'hidden' }}>
              {mounted && !loading && stats.radarData?.length > 0 ? (
                <ErrorBoundary>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={stats.radarData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} />
                      <Radar name={t('nav.projects')} dataKey="value" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.2} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: 11 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </ErrorBoundary>
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 12 }}>
                  {t('dashboard.loading')}
                </div>
              )}
            </div>
          </div>

          <div className="card-custom" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-main)' }}>{t('dashboard.ticketEvolution')}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, fontWeight: 600, color: '#64748b' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)' }}></span> {t('dashboard.created')}</div>
              </div>
            </div>
            <div style={{ height: 160, width: '100%', minHeight: 160 }}>
              {!loading && mounted && stats.areaData.length > 0 ? (
                <ErrorBoundary>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.areaData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} dy={5} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: 11 }} />
                      <Area type="monotone" dataKey="tickets" stroke="var(--primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorTickets)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </ErrorBoundary>
              ) : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 12 }}>{t('dashboard.loading')}</div>}
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>

          {/* Recent Tickets List */}
          <div className="card-custom" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-main)' }}>{t('dashboard.recentTickets')}</h3>
              <button className="btn-ghost-custom" onClick={() => navigate('/tickets')} style={{ padding: '4px 8px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>{t('dashboard.viewAll')}</span> <Filter size={12} />
              </button>
            </div>
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <Search size={12} style={{ position: 'absolute', left: 12, top: 10, color: '#94a3b8' }} />
              <input
                type="text"
                className="input-custom"
                placeholder={t('dashboard.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: 32, height: 32, background: 'var(--surface-low)', fontSize: 12, color: 'var(--text-main)' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredTickets.length > 0 ? filteredTickets.map((ti) => (
                <div key={ti.id} onClick={() => navigate('/tickets')} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                  background: 'var(--surface-low)',
                  borderRadius: 16, cursor: 'pointer', transition: 'all 0.2s',
                  color: 'var(--text-main)'
                }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <AlertCircle size={14} color="var(--primary)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ti?.title || t('dashboard.noTitle')}</div>
                    <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase' }}>
                      {ti?.status === 'OPEN' ? t('tickets.open') : ti?.status === 'IN_PROGRESS' ? t('tickets.inProgress') : ti?.status === 'RESOLVED' ? t('tickets.resolved') : ti?.status}
                    </div>
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8' }}>
                    {ti.createdAt ? new Date(ti.createdAt).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'fr-FR', { day: 'numeric', month: 'short' }) : t('dashboard.today')}
                  </div>
                </div>
              )) : (
                <div style={{ padding: 12, textAlign: 'center', color: '#94a3b8', fontSize: 11 }}>{t('dashboard.noTicketFound')}</div>
              )}
            </div>
          </div>

          {/* Calendar & Timeline Section */}
          <div className="card-custom" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Calendar part */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-main)' }}>
                    {selectedDate instanceof Date && !isNaN(selectedDate)
                      ? selectedDate.toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'fr-FR', { month: 'long', year: 'numeric' })
                      : '---'}
                  </h3>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={handlePrevDay} style={{ background: '#f8fafc', border: 'none', width: 24, height: 24, borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronLeft size={12} /></button>
                    <button onClick={handleNextDay} style={{ background: '#f8fafc', border: 'none', width: 24, height: 24, borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronRight size={12} /></button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 12 }}>
                  {Array.isArray(t('dashboard.days', { returnObjects: true })) && t('dashboard.days', { returnObjects: true }).map((d) => (
                    <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#94a3b8' }}>{d}</div>
                  ))}
                  {weekDates.map((date, idx) => {
                    const isSelected = selectedDate && date && date.toDateString() === selectedDate.toDateString()
                    return (
                      <div key={idx} onClick={() => setSelectedDate(date)} style={{
                        height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700, borderRadius: 8,
                        background: isSelected ? 'var(--text-main)' : 'transparent',
                        color: isSelected ? 'white' : 'var(--text-main)',
                        cursor: 'pointer'
                      }}>{date.getDate()}</div>
                    )
                  })}
                </div>
              </div>

              {/* Timeline part */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--surface-low)', borderRadius: 16, padding: '16px', overflowY: 'auto', maxHeight: 250 }}>
                {selectedDateEvents && selectedDateEvents.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {selectedDateEvents.map(ev => (
                       <div key={ev.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                         <div style={{ width: 10, height: 10, borderRadius: '50%', background: ev.color, marginTop: 4, flexShrink: 0 }}></div>
                         <div>
                            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-main)', lineHeight: 1.2 }}>{ev.title}</div>
                            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{ev.time}</div>
                         </div>
                       </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 0' }}>
                    <Calendar size={24} color="#cbd5e1" style={{ marginBottom: 8 }} />
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>{t('dashboard.noEvent')}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 4 }}>
                      {t('dashboard.emptyAgenda')}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
