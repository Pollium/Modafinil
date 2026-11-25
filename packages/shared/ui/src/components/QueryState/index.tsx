import ErrorState from '../ErrorState';
import RefreshFailed from '../RefreshFailed';
import { Query } from '@pollium/readable-react/query/useQuery';
import { QueryState as ReadableQueryState } from '@pollium/readable-react/states/QueryState';
import { ReactNode } from 'react';

interface QueryStateProps<T>{
    query: Query<T>;
    skeleton: ReactNode;
    errorTitle: string;
    errorDescription: string;
    children: (data: T) => ReactNode;
}

const QueryState = <T,>({ query, skeleton, errorTitle, errorDescription, children }: QueryStateProps<T>) => (
    <ReadableQueryState
        query={query}
        loading={skeleton}
        failed={(_, retry) => <ErrorState title={errorTitle} description={errorDescription} onRetry={retry} />}
        stale={(_, retry) => <RefreshFailed onRetry={retry} />}
    >
        {children}
    </ReadableQueryState>
);

export default QueryState;
