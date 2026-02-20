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
        const { adminEmail, userId } = JSON.parse(event.body);

        if (!ADMIN_EMAILS.includes(adminEmail)) {
            return { statusCode: 403, headers, body: JSON.stringify({ error: 'Accès refusé' }) };
        }

        if (!userId) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'userId requis' }) };
        }

        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY
        );

        // Récupérer les données du client en parallèle
        const [lotsResult, mpResult, lossesResult, receptionsResult] = await Promise.all([
            supabase.from('lots').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
            supabase.from('matieres_premieres').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
            supabase.from('losses').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
            supabase.from('receptions').select('id, date, heure, fournisseur, statut, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(20)
        ]);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                totalLots: lotsResult.data ? lotsResult.data.length : 0,
                totalMP: mpResult.data ? mpResult.data.length : 0,
                totalLosses: lossesResult.data ? lossesResult.data.length : 0,
                totalReceptions: receptionsResult.data ? receptionsResult.data.length : 0,
                lots: lotsResult.data || [],
                mp: mpResult.data || [],
                losses: lossesResult.data || [],
                receptions: receptionsResult.data || []
            })
        };

    } catch (error) {
        console.error('Erreur admin-client-data:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
