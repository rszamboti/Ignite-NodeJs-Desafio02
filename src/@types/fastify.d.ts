// FastifyRequestContext
import 'fastify';

declare module 'fastify' {
    export interface FastifyRequest {
        user?: {
            id: string,
            sessionId: string,
            name: string,
            email: string,
            created_at: string,
            updated_at: string
        }
    }
}