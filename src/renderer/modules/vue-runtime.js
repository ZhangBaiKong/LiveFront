/* LiveFront Vue runtime loader */
export async function loadVueRuntime() {
  const Vue = await import('vue/dist/vue.global.js')
  if (!globalThis.Vue) globalThis.Vue = Vue
  return '/* Vue runtime loaded from local package */'
}
