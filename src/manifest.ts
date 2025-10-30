import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
  manifest_version: 3,
  name: 'Hilo - Adaptive Translator',
  version: '1.0.0',
  description: 'Adaptive Translator for the Real Web - Adjust content to your CEFR level',
  
  permissions: [
    'storage',
    'activeTab',
    'scripting'
  ],
  
  host_permissions: [
    'https://*/*',
    'http://*/*'
  ],
  
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module'
  },
  
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['src/content/index.tsx'],
      css: ['src/content/styles.css'],
      run_at: 'document_idle'
    }
  ],
  
  action: {
    default_popup: 'src/ui/popup.html',
    default_title: 'Hilo Settings'
  },
  
  options_ui: {
    page: 'src/ui/options.html',
    open_in_tab: true
  },
  
  icons: {
    16: 'icons/icon16.png',
    32: 'icons/icon32.png',
    48: 'icons/icon48.png',
    128: 'icons/icon128.png'
  },
  
  web_accessible_resources: [
    {
      resources: [
        'src/content/styles.css',
        'assets/*.js',
        'assets/*.css',
        'src/ui/*.html'
      ],
      matches: ['<all_urls>']
    }
  ]
})