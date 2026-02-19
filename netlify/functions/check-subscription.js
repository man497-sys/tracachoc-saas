const { createClient } = require('@supabase/supabase-js');

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
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY
        );

        const { userId } = JSON.parse(event.body);

        if (!userId) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'userId requis' }) };
        }

        const { data: subscription, error } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error || !subscription) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    active: false,
                    plan: 'free',
                    message: 'Aucun abonnement trouvé'
                })
            };
        }

        // Vérifier si l'abonnement est encore actif
        const now = new Date();
        const expiresAt = new Date(subscription.expires_at);
        const isActive = subscription.status === 'active' && expiresAt > now;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                active: isActive,
                plan: isActive ? subscription.plan : 'free',
                expiresAt: subscription.expires_at,
                status: subscription.status
            })
        };

    } catch (error) {
        console.error('Erreur check-subscription:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
