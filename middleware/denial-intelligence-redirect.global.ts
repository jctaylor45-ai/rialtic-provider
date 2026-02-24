/**
 * Redirect old /policies and /insights routes to /denial-intelligence
 */
export default defineNuxtRouteMiddleware((to) => {
  if (to.path === '/provider-portal/policies' || to.path === '/provider-portal/policies/') {
    return navigateTo({
      path: '/provider-portal/denial-intelligence',
      query: { ...to.query, showAll: '1' },
    }, { redirectCode: 301 })
  }

  if (to.path === '/provider-portal/insights' || to.path === '/provider-portal/insights/') {
    return navigateTo({
      path: '/provider-portal/denial-intelligence',
      query: to.query,
    }, { redirectCode: 301 })
  }
})
