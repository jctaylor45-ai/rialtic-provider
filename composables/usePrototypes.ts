export interface Prototype {
  id: string
  name: string
  routePrefix: string
  icon: string
  description: string
  enabled: boolean
}

export interface NavItem {
  id: string
  label: string
  icon: string
  path: string
}

export interface PrototypeNav {
  main: NavItem[]
  admin: NavItem[]
}

const prototypes: Prototype[] = [
  {
    id: 'provider-portal',
    name: 'Provider Education Portal',
    routePrefix: '/provider-portal',
    icon: 'heroicons:academic-cap',
    description: 'Provider-facing denial education and guidance',
    enabled: true,
  },
  {
    id: 'denial-intelligence',
    name: 'Denial Intelligence Dashboard',
    routePrefix: '/denial-intelligence',
    icon: 'heroicons:shield-check',
    description: 'Payer-facing denial and overturn analytics',
    enabled: false,
  },
]

const navigationByPrototype: Record<string, PrototypeNav> = {
  'provider-portal': {
    main: [
      { id: 'dashboard', label: 'Dashboard', icon: 'heroicons:squares-2x2', path: '/provider-portal' },
      { id: 'policies', label: 'Policies', icon: 'heroicons:document-text', path: '/provider-portal/policies' },
      { id: 'claims', label: 'Claims', icon: 'heroicons:clipboard-document-list', path: '/provider-portal/claims' },
      { id: 'insights', label: 'Insights', icon: 'heroicons:light-bulb', path: '/provider-portal/insights' },
      { id: 'impact', label: 'Impact', icon: 'heroicons:chart-bar', path: '/provider-portal/impact' },
      { id: 'claim-lab', label: 'Claim Lab', icon: 'heroicons:beaker', path: '/provider-portal/claim-lab' },
    ],
    admin: [
      { id: 'config', label: 'Configuration', icon: 'heroicons:adjustments-horizontal', path: '/provider-portal/admin/config' },
      { id: 'data-source', label: 'Data Source', icon: 'heroicons:server-stack', path: '/provider-portal/admin/data-source' },
      { id: 'database', label: 'Database', icon: 'heroicons:circle-stack', path: '/provider-portal/admin/database' },
      { id: 'scenario-builder', label: 'Scenario Builder', icon: 'heroicons:wrench-screwdriver', path: '/provider-portal/admin/scenario-builder' },
    ],
  },
  'denial-intelligence': {
    main: [
      { id: 'dashboard', label: 'Dashboard', icon: 'heroicons:squares-2x2', path: '/denial-intelligence' },
    ],
    admin: [],
  },
}

export function usePrototypes() {
  const route = useRoute()

  const activePrototype = computed((): Prototype => {
    const path = route.path
    const match = prototypes.find(p => path.startsWith(p.routePrefix))
    return match ?? prototypes[0]!
  })

  const activeNav = computed((): PrototypeNav => {
    return navigationByPrototype[activePrototype.value.id] || { main: [], admin: [] }
  })

  function navigateToPrototype(id: string) {
    const proto = prototypes.find(p => p.id === id)
    if (!proto || !proto.enabled) return
    navigateTo(proto.routePrefix)
  }

  return {
    prototypes,
    activePrototype,
    activeNav,
    navigateToPrototype,
  }
}
