import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

// GET: Fetch all CRM data (leads, templates, scraper history, premium locations)
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('ashu_websites');

    // Fetch all documents from collections
    const leads = await db.collection('leads').find({}).toArray();
    const history = await db.collection('history').find({}).toArray();
    const templatesDoc = await db.collection('templates').findOne({ _id: 'global_templates' });
    const premiumHistory = await db.collection('premium_history').find({}).toArray();

    const templates = templatesDoc ? templatesDoc.data : null;

    // Check if the database has ever been initialized with data
    const isInitialized = leads.length > 0 || templates !== null || history.length > 0 || premiumHistory.length > 0;

    return Response.json({
      isInitialized,
      leads,
      templates,
      history,
      premiumHistory
    });
  } catch (error) {
    console.error('Error in GET /api/sync:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// POST: Execute atomic sync actions dispatched by the client
export async function POST(request) {
  try {
    const client = await clientPromise;
    const db = client.db('ashu_websites');
    const { action, data } = await request.json();

    if (!action) {
      return Response.json({ error: 'Action parameter is required' }, { status: 400 });
    }

    switch (action) {
      case 'update_lead': {
        const { lead } = data;
        if (!lead || !lead.id) {
          return Response.json({ error: 'Lead data with ID is required' }, { status: 400 });
        }
        // Remove mongo _id if present in payload to prevent immutability errors
        const updateData = { ...lead };
        delete updateData._id;

        await db.collection('leads').updateOne(
          { id: lead.id },
          { $set: updateData },
          { upsert: true }
        );
        break;
      }

      case 'bulk_add_leads': {
        const { leads } = data;
        if (leads && leads.length > 0) {
          const operations = leads.map(l => {
            const updateData = { ...l };
            delete updateData._id;
            return {
              updateOne: {
                filter: { id: l.id },
                update: { $set: updateData },
                upsert: true
              }
            };
          });
          await db.collection('leads').bulkWrite(operations);
        }
        break;
      }

      case 'update_templates': {
        const { templates } = data;
        await db.collection('templates').updateOne(
          { _id: 'global_templates' },
          { $set: { data: templates } },
          { upsert: true }
        );
        break;
      }

      case 'add_history': {
        const { run } = data;
        if (!run || !run.id) {
          return Response.json({ error: 'History run data with ID is required' }, { status: 400 });
        }
        const updateData = { ...run };
        delete updateData._id;

        await db.collection('history').updateOne(
          { id: run.id },
          { $set: updateData },
          { upsert: true }
        );
        break;
      }

      case 'bulk_add_history': {
        const { history } = data;
        if (history && history.length > 0) {
          const operations = history.map(h => {
            const updateData = { ...h };
            delete updateData._id;
            return {
              updateOne: {
                filter: { id: h.id },
                update: { $set: updateData },
                upsert: true
              }
            };
          });
          await db.collection('history').bulkWrite(operations);
        }
        break;
      }

      case 'clear_history': {
        await db.collection('history').deleteMany({});
        break;
      }

      case 'add_premium_history': {
        const { run } = data;
        if (!run || !run.id) {
          return Response.json({ error: 'Premium history run data with ID is required' }, { status: 400 });
        }
        const updateData = { ...run };
        delete updateData._id;

        await db.collection('premium_history').updateOne(
          { id: run.id },
          { $set: updateData },
          { upsert: true }
        );
        break;
      }

      case 'bulk_add_premium_history': {
        const { history } = data;
        if (history && history.length > 0) {
          const operations = history.map(h => {
            const updateData = { ...h };
            delete updateData._id;
            return {
              updateOne: {
                filter: { id: h.id },
                update: { $set: updateData },
                upsert: true
              }
            };
          });
          await db.collection('premium_history').bulkWrite(operations);
        }
        break;
      }

      case 'clear_premium_history': {
        await db.collection('premium_history').deleteMany({});
        break;
      }

      default:
        return Response.json({ error: `Unknown sync action: ${action}` }, { status: 400 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/sync:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
