import { Pool } from '@neondatabase/serverless';

const ALLOWED_CATEGORIES = new Set([
  '💌 Confession',
  '🍂 Memory',
  '🌿 Question',
  '🌟 Small Victories',
  '🍓 Others',
]);

function corsHeaders(env) {
  const origin = env.ALLOWED_ORIGIN || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(data, env, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(env), 'Content-Type': 'application/json' },
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(env) });
    }

    if (url.pathname !== '/letters') {
      return json({ error: 'Not found' }, env, 404);
    }

    const pool = new Pool({ connectionString: env.DATABASE_URL });

    try {
      if (request.method === 'GET') {
        const { rows } = await pool.query(
          `select id, pen_name, category, message, pinned, created_at
           from letters
           where hidden = false
           order by created_at desc
           limit 500`
        );
        return json(rows, env);
      }

      if (request.method === 'POST') {
        let body;
        try {
          body = await request.json();
        } catch {
          return json({ error: 'Invalid JSON body' }, env, 400);
        }

        const penName = (body.pen_name ? String(body.pen_name) : 'A Wandering Berryfolk')
          .trim()
          .slice(0, 40) || 'A Wandering Berryfolk';
        const category = typeof body.category === 'string' && ALLOWED_CATEGORIES.has(body.category)
          ? body.category
          : null;
        const message = typeof body.message === 'string' ? body.message.trim().slice(0, 600) : '';

        if (!category) {
          return json({ error: 'Choose a valid category' }, env, 400);
        }
        if (!message) {
          return json({ error: 'Message is empty' }, env, 400);
        }

        const { rows } = await pool.query(
          `insert into letters (pen_name, category, message)
           values ($1, $2, $3)
           returning id, pen_name, category, message, pinned, created_at`,
          [penName, category, message]
        );
        return json(rows[0], env, 201);
      }

      return json({ error: 'Method not allowed' }, env, 405);
    } catch (err) {
      console.error(err);
      return json({ error: 'Server error' }, env, 500);
    } finally {
      ctx.waitUntil(pool.end());
    }
  },
};
