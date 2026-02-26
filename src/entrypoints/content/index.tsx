import './style.css';
import { createRoot } from 'react-dom/client';
import App from './App';

export default defineContentScript({
  matches: ['https://my.uscis.gov/account/applicant*'],
  cssInjectionMode: 'ui',

  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: 'uscis-change-detect',
      position: 'inline',
      append: 'last',
      onMount(container) {
        const root = createRoot(container);
        root.render(<App />);
        return root;
      },
      onRemove(root) {
        root?.unmount();
      },
    });

    ui.mount();
  },
});
