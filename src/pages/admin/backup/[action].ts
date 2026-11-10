import type { APIRoute } from 'astro';
import { backupAction } from '../../../server/backup/http';

export const prerender = false;
export const POST: APIRoute = ({ params, request }) => backupAction(params.action, request);
