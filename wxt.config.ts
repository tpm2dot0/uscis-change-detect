import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'USCIS Change Detect',
    description: 'Detect changes in your USCIS case status',
    permissions: ['storage'],
    host_permissions: ['https://my.uscis.gov/*'],
  },
});
