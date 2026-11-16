import { Handler } from '../contracts/routing';
import { routesByController } from '../decorators/controllers/Route';
import { RouteError } from '../errors/Route';
import { FastifyInstance } from 'fastify';

export default abstract class BaseController{
    async register(app: FastifyInstance, prefix: string){
        const mount = async (scope: FastifyInstance) => {
            for(const route of routesByController.get(this.constructor)){
                const handler = this.#wrap(route.handlerName);
                const url = route.absolute ? this.#relativeTo(route.path, prefix) : route.path;

                scope.route({
                    method: route.method,
                    url,
                    handler
                });
            }
        };

        if(prefix === ''){
            await mount(app);
            return;
        }

        await app.register(mount, { prefix });
    }

    #relativeTo(path: string, prefix: string){
        if(path !== prefix && !path.startsWith(`${prefix}/`)){
            throw RouteError.PrefixMismatch(path);
        }
        return path.slice(prefix.length) || '/';
    }

    #wrap(handlerName: string | symbol): Handler{
        const method = (Reflect.get(this, handlerName) as () => unknown).bind(this);

        return async () => ({ data: await method() });
    }
}
