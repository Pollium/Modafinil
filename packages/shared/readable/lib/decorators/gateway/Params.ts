import { SOCKET, GatewayContext } from '../../gateway/create-context';
import { createParamDecorator } from '../controllers/Params';

export const Socket = (): ParameterDecorator =>
    createParamDecorator((req) => (req as GatewayContext)[SOCKET]);
