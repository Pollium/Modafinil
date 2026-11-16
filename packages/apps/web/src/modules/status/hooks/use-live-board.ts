import { Board } from '@modafinil/contracts/status/domain';
import { statusGateway } from '@modafinil/contracts/status/gateway';
import { Query } from '@modafinil/ui/contracts/api';
import { useQuery } from '@modafinil/ui/hooks/api/use-query';
import { useChannel } from '@modafinil/ui/hooks/socket/use-channel';
import { statusApi } from '@/modules/status/api/api';
import '@/modules/status/contracts/channel';
import { useState } from 'react';

export const useLiveBoard = (): Query<Board> => {
    const loaded = useQuery(statusApi.board);
    const [pushed, setPushed] = useState<Board | null>(null);

    useChannel(statusGateway.channel, { 'status.board': setPushed });

    if(pushed === null) return loaded;

    return {
        data: pushed,
        loading: false,
        error: undefined,
        reload: loaded.reload
    };
};
