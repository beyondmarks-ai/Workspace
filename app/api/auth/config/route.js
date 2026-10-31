import { forwardAuth } from '../../../../lib/auth-proxy.mjs';
export const dynamic = 'force-dynamic';
export const GET = request => forwardAuth(request, '/config');
