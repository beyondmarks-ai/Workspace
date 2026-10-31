import { forwardAuth } from '../../../lib/auth-proxy.mjs';
export const dynamic = 'force-dynamic';
export const GET = request => forwardAuth(request);
export const POST = request => forwardAuth(request);
export const PATCH = request => forwardAuth(request);
export const DELETE = request => forwardAuth(request);
