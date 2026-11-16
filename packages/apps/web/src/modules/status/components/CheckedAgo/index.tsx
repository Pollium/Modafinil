import { checkedLabel } from '@/modules/status/utils/headline';
import { useEffect, useState } from 'react';

const TICK_MS = 1000;

interface CheckedAgoProps{
    at: string | null;
}

const CheckedAgo = ({ at }: CheckedAgoProps) => {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), TICK_MS);
        return () => clearInterval(timer);
    }, []);

    return checkedLabel(at, now);
};

export default CheckedAgo;
