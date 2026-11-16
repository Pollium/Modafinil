import BaseController from '@readable/controllers/BaseController';
import { Controller } from '@readable/decorators/controllers/Controller';
import { Route } from '@readable/decorators/controllers/Route';
import { statusRoutes } from '@modafinil/contracts/status/routes';
import { liveBoard } from '../services/LiveBoard';

@Controller('')
export default class StatusController extends BaseController{
    @Route(statusRoutes.board)
    board(){
        return liveBoard.board;
    }
}
