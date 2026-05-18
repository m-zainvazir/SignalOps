import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getDb, saveDb, logAction, Product } from '@/lib/db';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { unstructuredText } = body;

    if (!unstructuredText) {
      return NextResponse.json({ error: 'Missing unstructured text' }, { status: 400 });
    }
    
    if (!apiKey) {
       return NextResponse.json({ error: 'Missing GEMINI_API_KEY environment variable. Please set it.' }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const db = getDb();
    const agentTrace = [];

    // --- AGENT 1: Ingestion & Extraction ---
    agentTrace.push({ agent: 'Ingestion Agent', status: 'Running', details: 'Extracting entities and signals from input.' });
    
    const extractionPrompt = `
      You are an Ingestion & Extraction Agent. Extract key signals from the following unstructured text.
      Return ONLY a JSON object with this structure: { "entities": string[], "event": string, "impacted_items": string[], "delay_days": number }
      
      Text: "${unstructuredText}"
    `;
    
    let extractedData;
    try {
      const result1 = await model.generateContent(extractionPrompt);
      const text1 = result1.response.text().replace(/```json/g, '').replace(/```/g, '');
      extractedData = JSON.parse(text1);
      agentTrace.push({ agent: 'Ingestion Agent', status: 'Completed', result: extractedData });
    } catch (e) {
      return NextResponse.json({ error: `Extraction failed: ${e instanceof Error ? e.message : String(e)}`, trace: agentTrace }, { status: 500 });
    }

    // --- AGENT 2: Impact Analyst ---
    agentTrace.push({ agent: 'Impact Analyst', status: 'Running', details: 'Querying mock system state and analyzing business impact.' });
    
    const impactPrompt = `
      You are an Impact Analyst Agent.
      Current Inventory System State:
      ${JSON.stringify(db.inventory, null, 2)}
      
      Extracted Signals:
      ${JSON.stringify(extractedData, null, 2)}
      
      Determine the business impact. If a product shipment is delayed, calculate if it will stock out based on the daily burn rate and current stock. 
      Return ONLY a JSON object: { "impact_summary": string, "at_risk_products": string[], "estimated_revenue_loss": number, "days_until_stockout": number }
    `;
    
    let impactData;
    try {
      const result2 = await model.generateContent(impactPrompt);
      const text2 = result2.response.text().replace(/```json/g, '').replace(/```/g, '');
      impactData = JSON.parse(text2);
      agentTrace.push({ agent: 'Impact Analyst', status: 'Completed', result: impactData });
    } catch (e) {
      return NextResponse.json({ error: `Impact Analysis failed: ${e instanceof Error ? e.message : String(e)}`, trace: agentTrace }, { status: 500 });
    }

    // --- AGENT 3: Action Planner ---
    agentTrace.push({ agent: 'Action Planner', status: 'Running', details: 'Formulating action recommendations based on impact.' });
    
    const actionPrompt = `
      You are an Action Planner Agent.
      Impact Analysis:
      ${JSON.stringify(impactData, null, 2)}
      
      System State:
      ${JSON.stringify(db.inventory, null, 2)}
      
      Propose a concrete action to mitigate this issue. 
      Return ONLY a JSON array of actionable objects with the structure:
      [
        {
           "action_type": "EXPEDITE_SHIPPING" | "UPDATE_STATUS",
           "product_id": "string",
           "parameters": { "quantity": number, "new_status": "string" }
        }
      ]
    `;
    
    let actionPlan;
    try {
      const result3 = await model.generateContent(actionPrompt);
      const text3 = result3.response.text().replace(/```json/g, '').replace(/```/g, '');
      actionPlan = JSON.parse(text3);
      agentTrace.push({ agent: 'Action Planner', status: 'Completed', result: actionPlan });
    } catch (e) {
      return NextResponse.json({ error: `Action Planning failed: ${e instanceof Error ? e.message : String(e)}`, trace: agentTrace }, { status: 500 });
    }

    // --- AGENT 4: Execution Agent ---
    agentTrace.push({ agent: 'Execution Agent', status: 'Running', details: 'Simulating broker execution and mutating system state.' });
    
    const dbBefore = JSON.parse(JSON.stringify(db.inventory)); // clone for before/after comparison
    
    try {
      for (const action of actionPlan) {
        if (action.action_type === 'EXPEDITE_SHIPPING') {
           // Simulate API Call to broker
           const product = db.inventory.find((p: Product) => p.id === action.product_id);
           if (product) {
              product.nextShipmentDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Air freight arrives in 3 days
              logAction('EXPEDITE_SHIPPING', `Requested air freight for ${action.parameters.quantity} units of ${product.name}`);
           }
        } else if (action.action_type === 'UPDATE_STATUS') {
           const product = db.inventory.find((p: Product) => p.id === action.product_id);
           if (product) {
              product.status = action.parameters.new_status;
              logAction('UPDATE_STATUS', `Updated status of ${product.name} to ${product.status}`);
           }
        }
      }
      
      // Save changes to DB
      saveDb(db);
      
      agentTrace.push({ 
        agent: 'Execution Agent', 
        status: 'Completed', 
        result: {
           message: 'Actions executed successfully on system state.',
           actions_executed: actionPlan
        } 
      });
      
    } catch (e) {
      return NextResponse.json({ error: `Execution failed: ${e instanceof Error ? e.message : String(e)}`, trace: agentTrace }, { status: 500 });
    }

    return NextResponse.json({
       success: true,
       trace: agentTrace,
       system_state: {
         before: dbBefore,
         after: db.inventory
       }
    });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
