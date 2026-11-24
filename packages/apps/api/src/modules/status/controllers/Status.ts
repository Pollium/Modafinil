import BaseController, { Route } from '@pollium/readable/http/Controller';
import { statusRoutes } from '@modafinil/contracts/status/routes';
import { liveBoard } from '../services/LiveBoard';

export default class StatusController extends BaseController{
    @Route(statusRoutes.board)
    board(){
        return liveBoard.board;
    }
}
