import { gateway } from '@pollium/readable-contracts/gateway';
import { Board } from './domain';

export const statusGateway = gateway<StatusFrames>('/status/live');

export interface BoardFrame{
    type: 'status.board';
    data: Board;
}

export type StatusFrame = BoardFrame;

export type StatusFrames = {
    [T in StatusFrame['type']]: Extract<StatusFrame, { type: T }>['data'];
};
