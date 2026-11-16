import BaseController from '@readable/controllers/BaseController';
import { Route } from '@readable/decorators/controllers/Route';
import { statusRoutes } from '@modafinil/contracts/status/routes';
import { liveBoard } from '../services/LiveBoard';

export default class StatusController extends BaseController{
    @Route(statusRoutes.board)
    board(){
        return liveBoard.board;
    }
}
