const { createClient } = require('@supabase/supabase-js');

const ADMIN_EMAILS = ['info@emotionschocolats.be'];

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const { adminEmail } = JSON.parse(event.body);

        // Vérifier que c'est bien un admin
        if (!ADMIN_EMAILS.includes(adminEmail)) {
            return { statusCode: 403, headers, body: JSON.stringify({ error: 'Accès refusé' }) };
        }

        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY
        );

        // Récupérer tous les abonnements
        const { data: subscriptions, error: subError } = await supabase
            .from('subscriptions')
            .select('*')
            .order('created_at', { ascending: false });

        // Récupérer la liste des utilisateurs via Supabase Auth Admin
        const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

        if (subError) {
            console.error('Erreur subscriptions:', subError);
        }
        if (usersError) {
            console.error('Erreur users:', usersError);
        }

        const subs = subscriptions || [];
        const userList = users || [];

        // Combiner users et subscriptions
        const combined = userList.map(user => {
            const sub = subs.find(s => s.user_id === user.id);
            return {
                email: user.email,
                created_at: user.created_at,
                plan: sub ? sub.plan : 'free',
                status: sub ? sub.status : 'inactive',
                started_at: sub ? sub.started_at : null,
                expires_at: sub ? sub.expires_at : null
            };
        });

        const activeSubs = subs.filter(s => s.status === 'active' && new Date(s.expires_at) > new Date());

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                totalUsers: userList.length,
                activeSubscriptions: activeSubs.length,
                monthlyRevenue: activeSubs.length * 39,
                users: combined
            })
        };

    } catch (error) {
        console.error('Erreur admin-data:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
