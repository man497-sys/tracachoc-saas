const { createMollieClient } = require('@mollie/api-client');

exports.handler = async (event) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const mollieClient = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY });
        const { userId, userEmail, plan } = JSON.parse(event.body);

        if (!userId || !userEmail) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'userId et userEmail requis' }) };
        }

        // Créer d'abord un client Mollie (nécessaire pour les abonnements)
        let customer;
        
        // Chercher si le client existe déjà
        const customers = await mollieClient.customers.page();
        customer = customers.find(c => c.email === userEmail);
        
        if (!customer) {
            customer = await mollieClient.customers.create({
                name: userEmail.split('@')[0],
                email: userEmail,
                metadata: JSON.stringify({ supabase_user_id: userId })
            });
        }

        // Créer un premier paiement pour obtenir un mandat (nécessaire pour les abonnements récurrents)
        const payment = await mollieClient.payments.create({
            amount: {
                currency: 'EUR',
                value: '39.00'
            },
            description: 'TRACACHOC Pro - Abonnement mensuel',
            redirectUrl: `${process.env.URL || 'https://tracachoc-app.netlify.app'}/?payment=success&userId=${userId}`,
            cancelUrl: `${process.env.URL || 'https://tracachoc-app.netlify.app'}/?payment=cancelled`,
            webhookUrl: `${process.env.URL || 'https://tracachoc-app.netlify.app'}/.netlify/functions/mollie-webhook`,
            customerId: customer.id,
            sequenceType: 'first', // Premier paiement pour mandat récurrent
            metadata: JSON.stringify({
                supabase_user_id: userId,
                plan: plan || 'pro',
                type: 'subscription_first_payment'
            })
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                checkoutUrl: payment.getCheckoutUrl(),
                paymentId: payment.id
            })
        };

    } catch (error) {
        console.error('Erreur Mollie:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
