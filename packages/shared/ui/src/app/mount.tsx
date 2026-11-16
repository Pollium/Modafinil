import OfflineBanner from '../components/OfflineBanner';
import { initTheme } from '../utils/session/theme';
import { ReactNode, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

export const mountApp = (page: ReactNode) => {
    initTheme();

    const root = document.getElementById('root');
    if(root === null) return;

    createRoot(root).render(
        <StrictMode>
            {page}
            <OfflineBanner />
        </StrictMode>
    );
};
