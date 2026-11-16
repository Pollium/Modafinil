import ClassMetadata from '../../utils/ClassMetadata';

export const connectHandlersByGateway = new ClassMetadata<string | symbol>();

export const OnConnect = (): MethodDecorator => {
    return (target, handlerName) => {
        connectHandlersByGateway.append(target.constructor, handlerName);
    };
};
