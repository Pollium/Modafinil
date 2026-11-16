import { Handler } from '../contracts/routing';
import { routesByController } from '../decorators/controllers/Route';
import { FastifyInstance } from 'fastify';

export default abstract class BaseController{
    register(app: FastifyInstance){
        for(const route of routesByController.get(this.constructor)){
            app.route({
                method: route.method,
                url: route.path,
                handler: this.#wrap(route.handlerName)
            });
        }
    }

    #wrap(handlerName: string | symbol): Handler{
        const method = (Reflect.get(this, handlerName) as () => unknown).bind(this);

        return async () => ({ data: await method() });
    }
}
