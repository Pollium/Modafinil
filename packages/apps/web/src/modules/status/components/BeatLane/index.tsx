import { BeatSample, STATUS_CELL_COUNT, STATUS_CELL_MINUTES } from '@modafinil/contracts/status/domain';
import { cellRange } from '@/modules/status/utils/headline';

const FILL: Record<BeatSample, string> = {
    [BeatSample.Up]: 'bg-foreground/55',
    [BeatSample.Down]: 'bg-[#c98500]',
    [BeatSample.Empty]: 'bg-foreground/[0.09]'
};

const WORD: Record<BeatSample, string> = {
    [BeatSample.Up]: 'up',
    [BeatSample.Down]: 'down',
    [BeatSample.Empty]: 'no sample'
};

const LANE = { gridTemplateColumns: `repeat(${STATUS_CELL_COUNT}, minmax(0, 1fr))` };

interface BeatLaneProps{
    name: string;
    cells: BeatSample[];
    startsAt: string;
    onScrub: (clientX: number, clientY: number, label: string) => void;
    onLeave: () => void;
}

const BeatLane = ({ name, cells, startsAt, onScrub, onLeave }: BeatLaneProps) => (
    <div className='grid h-[1.15rem] gap-px' style={LANE} onPointerLeave={onLeave}>
        {cells.map((sample, index) => {
            const label = `${name} · ${cellRange(index, STATUS_CELL_MINUTES, startsAt)} · ${WORD[sample]}`;

            return (
                <button
                    key={index}
                    type='button'
                    className={`min-w-0 cursor-crosshair border-0 p-0 ${FILL[sample]}`}
                    aria-label={label}
                    onPointerMove={(event) => onScrub(event.clientX, event.clientY, label)}
                />
            );
        })}
    </div>
);

export default BeatLane;
