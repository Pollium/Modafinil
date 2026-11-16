import { Query, QuerySnapshot, Request } from '../../contracts/api';
import { toError } from '../../utils/format/errors';
import { Method } from 'alova';
import { useEffect, useRef, useState } from 'react';

const dispatch = <O>(pending: PromiseLike<O>, force: boolean): PromiseLike<O> =>
    force && pending instanceof Method ? pending.send(true) as Promise<O> : pending;

export const useQuery = <O>(request: Request<O>): Query<O> => {
    const [attempt, setAttempt] = useState(0);
    const [snapshot, setSnapshot] = useState<QuerySnapshot<O> | null>(null);

    const latest = useRef(request);
    const forced = useRef(false);
    const runs = useRef({ issued: 0, landed: 0 });
    useEffect(() => {
        latest.current = request;
    });

    useEffect(() => {
        runs.current.issued += 1;
        const run = runs.current.issued;
        const force = forced.current;
        forced.current = false;

        setSnapshot((previous) => ({
            status: 'loading',
            data: previous?.data ?? null,
            error: undefined
        }));

        const load = async () => {
            try{
                const data = await dispatch(latest.current(), force);
                if(run < runs.current.landed) return;

                runs.current.landed = run;
                setSnapshot({ status: run === runs.current.issued ? 'success' : 'loading', data, error: undefined });
            }catch(cause: unknown){
                if(run !== runs.current.issued) return;

                runs.current.landed = run;
                setSnapshot((previous) => ({
                    status: 'error',
                    data: previous?.data ?? null,
                    error: toError(cause)
                }));
            }
        };

        void load();
    }, [attempt]);

    return {
        loading: snapshot === null || snapshot.status === 'loading',
        data: snapshot?.data ?? null,
        error: snapshot?.error,
        reload: () => {
            forced.current = true;
            setAttempt((value) => value + 1);
        }
    };
};
