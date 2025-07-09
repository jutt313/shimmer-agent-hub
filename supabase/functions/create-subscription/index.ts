
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { planType } = await req.json();
    if (!planType) throw new Error("Plan type is required");
    logStep("Plan type received", { planType });

    // Plan configurations
    const planConfigs = {
      starter: { price: 29.97, automations: 5, totalRuns: 2500, stepRuns: 1000, aiAgents: 5 },
      professional: { price: 49.97, automations: 15, totalRuns: 10000, stepRuns: 5000, aiAgents: 15 },
      business: { price: 99.97, automations: 50, totalRuns: 50000, stepRuns: 25000, aiAgents: 50 },
      enterprise: { price: 149.97, automations: 100, totalRuns: 100000, stepRuns: 50000, aiAgents: 100 },
      special: { price: 59.97, automations: 25, totalRuns: 25000, stepRuns: 12500, aiAgents: 25 }
    };

    const config = planConfigs[planType as keyof typeof planConfigs];
    if (!config) throw new Error("Invalid plan type");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      const customer = await stripe.customers.create({ email: user.email });
      customerId = customer.id;
      logStep("New customer created", { customerId });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `YusrAI ${planType.charAt(0).toUpperCase() + planType.slice(1)} Plan`,
              description: `${config.automations} automations, ${config.totalRuns.toLocaleString()} runs/month`,
            },
            unit_amount: Math.round(config.price * 100),
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/dashboard?success=true&plan=${planType}`,
      cancel_url: `${req.headers.get("origin")}/?canceled=true`,
      metadata: {
        user_id: user.id,
        plan_type: planType,
        max_automations: config.automations.toString(),
        max_total_runs: config.totalRuns.toString(),
        max_step_runs: config.stepRuns.toString(),
        max_ai_agents: config.aiAgents.toString(),
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
