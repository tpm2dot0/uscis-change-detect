import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react', '@wxt-dev/auto-icons'],
  autoIcons: {
    baseIconPath: 'assets/icon.svg',
    sizes: [16, 32, 48, 96, 128],
  },
  manifest: {
    name: 'USCIS Change Detect',
    description: 'Detect changes in your USCIS case status',
    permissions: ['storage'],
    host_permissions: ['https://my.uscis.gov/*'],
  },
});
