import '@/assets/styles/index.css';
import OfflineBanner from '@modafinil/ui/components/OfflineBanner';
import { initTheme } from '@modafinil/ui/utils/session/theme';
import { mount } from '@pollium/readable-react/app/mount';

initTheme();

mount({
    name: 'modafinil',
    apiUrl: window.location.origin,
    pages: import.meta.glob('/src/modules/*/pages/**/{index,layout}.tsx'),
    wrap: (app) => (
        <>
            {app}
            <OfflineBanner />
        </>
    )
});
