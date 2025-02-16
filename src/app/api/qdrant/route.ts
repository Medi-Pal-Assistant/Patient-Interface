import { NextResponse } from 'next/server';
import { qdrantClient, initializeQdrantCollection } from '@/lib/qdrant-server';

const COLLECTION_NAME = 'patient_demographics';

// Initialize Qdrant when the API route module is loaded
initializeQdrantCollection().catch(console.error);

export async function GET() {
  try {
    const collections = await qdrantClient.getCollections();
    return NextResponse.json(collections);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'initializeCollection':
        try {
          const collections = await qdrantClient.getCollections();
          const collectionExists = collections.collections.some(
            (collection) => collection.name === COLLECTION_NAME
          );

          if (!collectionExists) {
            await initializeQdrantCollection();
            return NextResponse.json({ 
              status: 'success', 
              message: 'Qdrant collection created successfully',
              collectionName: COLLECTION_NAME
            });
          } else {
            return NextResponse.json({ 
              status: 'success', 
              message: 'Qdrant collection already exists',
              collectionName: COLLECTION_NAME
            });
          }
        } catch (error) {
          console.error('Initialization error:', error);
          return NextResponse.json({ 
            status: 'error', 
            message: 'Failed to initialize Qdrant collection',
            error: error instanceof Error ? error.message : 'Unknown error'
          }, { status: 500 });
        }

      case 'searchPatient':
        const { firstName, lastName, birthdate, medicare_no } = params;
        const mustConditions = [
          {
            key: 'first_name',
            match: { text: firstName },
          },
          {
            key: 'last_name',
            match: { text: lastName },
          },
          {
            key: 'birthdate',
            match: { text: birthdate },
          },
        ];

        if (medicare_no) {
          mustConditions.push({
            key: 'medicare_no',
            match: { text: medicare_no },
          });
        }

        const searchResult = await qdrantClient.scroll(COLLECTION_NAME, {
          filter: {
            must: mustConditions,
          },
          limit: 1,
        });

        return NextResponse.json(searchResult.points[0]?.payload || null);

      case 'getPatientById':
        const { patientId } = params;
        const result = await qdrantClient.retrieve(COLLECTION_NAME, {
          ids: [patientId],
          with_payload: true,
          with_vector: true,
        });

        return NextResponse.json(result[0]?.payload || null);

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 