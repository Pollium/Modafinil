import { statusGateway, StatusFrames } from '@modafinil/contracts/status/gateway';

declare module '@modafinil/ui/contracts/channel'{
    interface ChannelMap{
        [statusGateway.channel]: StatusFrames;
    }
}
