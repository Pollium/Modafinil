import { Endpoint } from '@modafinil/contracts/shared/routing';
import { alova } from './alova';

export const call = <O>(endpoint: Endpoint<never, O>) => alova.Get<O>(endpoint.path);
