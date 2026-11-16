import BeatLane from '@/modules/status/components/BeatLane';
import BoardSkeleton from '@/modules/status/components/BoardSkeleton';
import CheckedAgo from '@/modules/status/components/CheckedAgo';
import QueryState from '@modafinil/ui/components/QueryState';
import { statusApi } from '@/modules/status/api/api';
import { Board } from '@modafinil/contracts/status/domain';
import { useQuery } from '@modafinil/ui/hooks/api/use-query';
import { useThemeStore } from '@modafinil/ui/store/theme';
import { HEADLINE, percent } from '@/modules/status/utils/headline';
import { useRef, useState } from 'react';

const HOURS = ['24h', '18h', '12h', '6h', 'now'] as const;

interface Scrub{
    x: number;
    y: number;
    label: string;
}

const StatusPage = () => {
    const board = useQuery(statusApi.board);
    const theme = useThemeStore((state) => state.theme);
    const toggle = useThemeStore((state) => state.toggle);
    const tracks = useRef<HTMLDivElement>(null);
    const [scrub, setScrub] = useState<Scrub | null>(null);

    const onScrub = (clientX: number, clientY: number, label: string) => {
        const left = tracks.current?.getBoundingClientRect().left ?? 0;
        setScrub({ x: clientX - left, y: clientY, label });
    };

    return (
        <main className='min-h-dvh overflow-x-hidden bg-canvas px-6 py-5 text-foreground'>
            <div className='mx-auto w-full max-w-6xl animate-enter'>
                <nav className='flex items-baseline justify-between pb-16 pt-1'>
                    <p className='text-[0.8125rem] font-medium tracking-tight'>{import.meta.env.VITE_STATUS_NAME}</p>
                    <button
                        type='button'
                        className='text-xs text-muted transition-colors hover:text-foreground'
                        onClick={toggle}
                    >
                        {theme === 'dark' ? 'Light' : 'Dark'}
                    </button>
                </nav>

                <QueryState
                    query={board}
                    skeleton={<BoardSkeleton />}
                    errorTitle='Could not read status'
                    errorDescription='The status service did not answer. This page keeps trying and shows the board once it does.'
                >
                    {(data: Board) => (
                        <>
                            <header className='grid items-end gap-8 border-b border-foreground/[0.08] pb-12 max-sm:grid-cols-1 sm:grid-cols-[1fr_auto]'>
                                <h1 className='m-0 text-[clamp(2.75rem,6vw,5rem)] font-medium leading-[0.92] tracking-[-0.055em]'>
                                    {HEADLINE[data.headline]}
                                </h1>
                                <div className='text-right tabular-nums max-sm:text-left'>
                                    <strong className='block text-[clamp(1.75rem,3vw,2.5rem)] font-medium tracking-[-0.04em]'>
                                        {percent(data.uptime)}
                                    </strong>
                                    <span className='mt-1.5 block text-xs text-muted'>
                                        last 24 hours · <CheckedAgo at={data.checkedAt} />
                                    </span>
                                </div>
                            </header>

                            <div className='grid grid-cols-[9.5rem_1fr_3.25rem] gap-3 pt-4 text-[0.6875rem] tabular-nums text-muted max-sm:grid-cols-[6.25rem_1fr_3.25rem]'>
                                <span />
                                <div className='flex justify-between'>
                                    {HOURS.map((hour) => <span key={hour}>{hour}</span>)}
                                </div>
                                <span />
                            </div>

                            <div ref={tracks} className='relative'>
                                {scrub === null ? null : (
                                    <div
                                        className='pointer-events-none absolute inset-y-0 z-10 w-px bg-foreground'
                                        style={{ left: scrub.x }}
                                    />
                                )}
                                {data.monitors.map((monitor) => (
                                    <article
                                        key={monitor.id}
                                        className='grid min-h-[3.25rem] grid-cols-[9.5rem_1fr_3.25rem] items-center gap-3 shadow-[inset_0_1px_0_color-mix(in_oklab,var(--foreground)_8%,transparent)] first-of-type:shadow-none max-sm:grid-cols-[6.25rem_1fr_3.25rem]'
                                    >
                                        <div className='min-w-0 py-3.5'>
                                            <b className='block text-[0.9375rem] font-medium tracking-tight'>{monitor.name}</b>
                                            {monitor.blurb === null ? null : (
                                                <small className='mt-0.5 block text-xs font-normal text-muted max-sm:hidden'>
                                                    {monitor.blurb}
                                                </small>
                                            )}
                                        </div>
                                        <BeatLane
                                            name={monitor.name}
                                            cells={monitor.cells}
                                            startsAt={data.startsAt}
                                            onScrub={onScrub}
                                            onLeave={() => setScrub(null)}
                                        />
                                        <div className='text-right text-[0.8125rem] tabular-nums tracking-tight'>
                                            {percent(monitor.uptime)}
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </>
                    )}
                </QueryState>
            </div>

            {scrub === null ? null : (
                <div
                    className='pointer-events-none fixed z-20 -translate-x-1/2 -translate-y-[calc(100%+0.7rem)] bg-foreground px-2.5 py-1.5 text-[0.6875rem] tabular-nums tracking-tight text-canvas'
                    style={{ left: scrub.x + (tracks.current?.getBoundingClientRect().left ?? 0), top: scrub.y }}
                >
                    {scrub.label}
                </div>
            )}
        </main>
    );
};

export default StatusPage;
