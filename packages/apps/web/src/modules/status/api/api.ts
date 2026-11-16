import { statusRoutes } from '@modafinil/contracts/status/routes';
import { call } from '@modafinil/ui/api/call';

export const statusApi = {
    board: () => call(statusRoutes.board)
};
