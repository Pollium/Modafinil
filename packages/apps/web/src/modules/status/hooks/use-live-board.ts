import { Board } from '@modafinil/contracts/status/domain';
import { statusGateway } from '@modafinil/contracts/status/gateway';
import { statusRoutes } from '@modafinil/contracts/status/routes';
import { useChannel } from '@pollium/readable-react/live/useChannel';
import { Query, useQuery } from '@pollium/readable-react/query/useQuery';

export const useLiveBoard = (): Query<Board> => {
    const board = useQuery(statusRoutes.board);
    useChannel(statusGateway, { 'status.board': board.set });

    return board;
};
