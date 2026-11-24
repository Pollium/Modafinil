import { Endpoint } from '@pollium/readable-contracts/routing';
import { alova } from './alova';

export const call = <O>(endpoint: Endpoint<never, O>) => alova.Get<O>(endpoint.path);
