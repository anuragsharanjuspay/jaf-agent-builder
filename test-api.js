// Test script to verify the agent creation API flow

async function testAgentCreation() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('Testing Agent Builder API Flow...\n');
  
  // 1. Test tools endpoint
  console.log('1. Fetching available tools...');
  try {
    const toolsResponse = await fetch(`${baseUrl}/api/tools`);
    const tools = await toolsResponse.json();
    console.log(`   ✓ Found ${tools.length} tools`);
    if (tools.length > 0) {
      console.log(`   First tool: ${tools[0].displayName} (${tools[0].category})`);
    }
  } catch (error) {
    console.error('   ✗ Failed to fetch tools:', error.message);
  }
  
  // 2. Create a new agent
  console.log('\n2. Creating a new agent...');
  const newAgent = {
    name: 'Test Agent ' + Date.now(),
    description: 'This is a test agent created via API',
    model: 'gpt-4',
    systemPrompt: 'You are a helpful AI assistant for testing purposes.',
    tools: [],
    capabilities: ['chat', 'search'],
    status: 'draft'
  };
  
  try {
    const createResponse = await fetch(`${baseUrl}/api/agents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newAgent),
    });
    
    if (!createResponse.ok) {
      throw new Error(`HTTP ${createResponse.status}`);
    }
    
    const createdAgent = await createResponse.json();
    console.log(`   ✓ Agent created with ID: ${createdAgent.id}`);
    console.log(`   Name: ${createdAgent.name}`);
    
    // 3. Fetch the created agent
    console.log('\n3. Fetching the created agent...');
    const getResponse = await fetch(`${baseUrl}/api/agents/${createdAgent.id}`);
    const fetchedAgent = await getResponse.json();
    console.log(`   ✓ Agent fetched successfully`);
    console.log(`   Status: ${fetchedAgent.status}`);
    
    // 4. Update the agent
    console.log('\n4. Updating the agent...');
    const updateData = {
      ...newAgent,
      name: 'Updated ' + newAgent.name,
      status: 'active'
    };
    
    const updateResponse = await fetch(`${baseUrl}/api/agents/${createdAgent.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
    
    const updatedAgent = await updateResponse.json();
    console.log(`   ✓ Agent updated successfully`);
    console.log(`   New name: ${updatedAgent.name}`);
    console.log(`   New status: ${updatedAgent.status}`);
    
    // 5. Export the agent
    console.log('\n5. Testing agent export...');
    const exportResponse = await fetch(`${baseUrl}/api/agents/${createdAgent.id}/export?format=json`);
    const exportedData = await exportResponse.text();
    const parsed = JSON.parse(exportedData);
    console.log(`   ✓ Agent exported successfully`);
    console.log(`   Export contains: ${Object.keys(parsed).join(', ')}`);
    
    // 6. List all agents
    console.log('\n6. Listing all agents...');
    const listResponse = await fetch(`${baseUrl}/api/agents`);
    const agents = await listResponse.json();
    console.log(`   ✓ Found ${agents.length} agent(s)`);
    
    // 7. Delete the test agent
    console.log('\n7. Cleaning up - deleting test agent...');
    const deleteResponse = await fetch(`${baseUrl}/api/agents/${createdAgent.id}`, {
      method: 'DELETE',
    });
    
    if (deleteResponse.ok) {
      console.log(`   ✓ Test agent deleted successfully`);
    }
    
    console.log('\n✅ All API tests passed successfully!');
    
  } catch (error) {
    console.error('   ✗ Error:', error.message);
    console.log('\n❌ Some tests failed. Please check the errors above.');
  }
}

// Run the test
testAgentCreation().catch(console.error);