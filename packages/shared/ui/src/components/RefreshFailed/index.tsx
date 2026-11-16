import { chromeCopy } from '../../services/chrome-copy';
import { Button } from '@heroui/react';

interface RefreshFailedProps{
    onRetry: () => void;
}

const RefreshFailed = ({ onRetry }: RefreshFailedProps) => (
    <div role='alert' className='flex flex-wrap items-center gap-2 text-[0.8125rem] text-[var(--danger)]'>
        <span>{chromeCopy.refreshFailed}</span>
        <Button size='sm' variant='ghost' onPress={onRetry}>{chromeCopy.retry}</Button>
    </div>
);

export default RefreshFailed;
