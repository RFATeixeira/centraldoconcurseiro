import { defineConfig, globalIgnores } from 'eslint/config'
import { FlatCompat } from '@eslint/eslintrc'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
})

const baseConfigs = [...nextVitals, ...nextTs]
const knownPlugins = new Set()

for (const config of baseConfigs) {
  if (!config.plugins) continue
  for (const name of Object.keys(config.plugins)) {
    knownPlugins.add(name)
  }
}

const rocketseatConfigs = compat
  .extends('@rocketseat/eslint-config/react')
  .map((config) => {
    if (!config.plugins) return config

    const filteredPlugins = {}
    for (const [name, plugin] of Object.entries(config.plugins)) {
      if (knownPlugins.has(name)) continue
      filteredPlugins[name] = plugin
      knownPlugins.add(name)
    }

    if (Object.keys(filteredPlugins).length === 0) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { plugins, ...rest } = config
      return rest
    }

    return {
      ...config,
      plugins: filteredPlugins,
    }
  })

const eslintConfig = defineConfig([
  ...baseConfigs,
  ...rocketseatConfigs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
])

export default eslintConfig
