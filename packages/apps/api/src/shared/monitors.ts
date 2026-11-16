import { ConfigError } from '@readable/errors/ConfigError';
import typia, { IValidation, tags } from 'typia';

export interface MonitorConfig{
    id: string & tags.MinLength<1>;
    name: string & tags.MinLength<1>;
    url: string & tags.Format<'uri'> & tags.Pattern<'^https?://'>;
    blurb?: string;
    anyStatus?: boolean;
}

type MonitorList = MonitorConfig[] & tags.MinItems<1>;

const INPUT = '$input';

const validate = typia.createValidateEquals<MonitorList>();

const parse = (raw: string): unknown => {
    try{
        return JSON.parse(raw);
    }catch{
        throw ConfigError.InvalidEnv('MONITORS is not JSON');
    }
};

const faultOf = ({ path, expected }: IValidation.IError): string =>
    `MONITORS${path.slice(INPUT.length)} must be ${expected}`;

const repeatedId = (monitors: MonitorConfig[]): string | undefined =>
    monitors.find((monitor, index) => monitors.findIndex((other) => other.id === monitor.id) !== index)?.id;

export const monitorsFrom = (raw: string): MonitorConfig[] => {
    const parsed = validate(parse(raw));
    if(!parsed.success) throw ConfigError.InvalidEnv(parsed.errors.map(faultOf).join('; '));

    const repeated = repeatedId(parsed.data);
    if(repeated !== undefined) throw ConfigError.InvalidEnv(`MONITORS has the id ${repeated} more than once`);

    return parsed.data;
};
