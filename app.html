const { createMollieClient } = require('@mollie/api-client');
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method not allowed' };
    }

    try {
        const mollieClient = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY });
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY
        );

        // Mollie envoie l'id du paiement
        const { id: paymentId } = JSON.parse(event.body || '{}') || {};
        
        // Récupérer les paramètres du formulaire si c'est un POST form-encoded
        const params = new URLSearchParams(event.body);
        const actualPaymentId = paymentId || params.get('id');

        if (!actualPaymentId) {
            return { statusCode: 400, body: 'Payment ID requis' };
        }

        const payment = await mollieClient.payments.get(actualPaymentId);
        const metadata = JSON.parse(payment.metadata || '{}');
        const userId = metadata.supabase_user_id;

        console.log(`📦 Webhook Mollie - Payment ${actualPaymentId} - Status: ${payment.status} - User: ${userId}`);

        if (payment.status === 'paid' && userId) {
            // Calculer la date d'expiration (30 jours)
            const now = new Date();
            const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

            // Mettre à jour l'abonnement dans Supabase
            const { error } = await supabase
                .from('subscriptions')
                .upsert({
                    user_id: userId,
                    plan: metadata.plan || 'pro',
                    status: 'active',
                    mollie_customer_id: payment.customerId,
                    mollie_payment_id: actualPaymentId,
                    started_at: now.toISOString(),
                    expires_at: expiresAt.toISOString(),
                    updated_at: now.toISOString()
                }, {
                    onConflict: 'user_id'
                });

            if (error) {
                console.error('❌ Erreur Supabase:', error);
            } else {
                console.log(`✅ Abonnement activé pour ${userId} jusqu'au ${expiresAt.toISOString()}`);
            }

            // Créer l'abonnement récurrent Mollie si premier paiement réussi
            if (metadata.type === 'subscription_first_payment' && payment.customerId) {
                try {
                    const subscription = await mollieClient.customerSubscriptions.create({
                        customerId: payment.customerId,
                        amount: {
                            currency: 'EUR',
                            value: '39.00'
                        },
                        interval: '1 month',
                        description: 'TRACACHOC Pro - Abonnement mensuel',
                        webhookUrl: `${process.env.URL || 'https://tracachoc-app.netlify.app'}/.netlify/functions/mollie-webhook`,
                        metadata: JSON.stringify({
                            supabase_user_id: userId,
                            plan: 'pro',
                            type: 'recurring'
                        })
                    });
                    console.log(`🔄 Abonnement récurrent créé: ${subscription.id}`);
                } catch (subError) {
                    console.error('⚠️ Erreur création abonnement récurrent:', subError.message);
                    // Le premier paiement a quand même fonctionné
                }
            }
        }

        return { statusCode: 200, body: 'OK' };

    } catch (error) {
        console.error('❌ Erreur webhook:', error);
        return { statusCode: 500, body: error.message };
    }
};
