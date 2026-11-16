import { Board } from './domain';

export const statusGateway = {
    channel: '/status/live'
} as const;

export interface BoardFrame{
    type: 'status.board';
    data: Board;
}

export type StatusFrame = BoardFrame;

export type StatusFrames = {
    [T in StatusFrame['type']]: Extract<StatusFrame, { type: T }>['data'];
};
