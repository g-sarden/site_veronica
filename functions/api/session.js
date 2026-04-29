import {accessErrorResponse, json, requireAccess} from '../_shared/access.js';

export async function onRequestGet({request, env}) {
  try {
    const session = await requireAccess(request, env);
    return json({
      ok: true,
      email: session.email || null
    });
  } catch (error) {
    return accessErrorResponse(error);
  }
}
