export class FlowExecutor {
  async execute(graph) {
    const executed = new Set();
    const results = new Map();

    const executeNode = async (nodeId) => {
      if (executed.has(nodeId)) {
        return results.get(nodeId);
      }

      const node = graph.get(nodeId);
      
      try {
        // Add visual feedback
        node.node.element.classList.add('executing');
        
        // Get all input results
        const inputResults = await Promise.all(
          node.inputs.map(async inputId => {
            const result = await executeNode(inputId);
            return result;
          })
        );

        // Execute node with all input results
        console.log(`Executing node ${nodeId} with inputs:`, inputResults);
        const result = await node.node.execute(...inputResults);
        console.log(`Node ${nodeId} result:`, result);
        
        executed.add(nodeId);
        results.set(nodeId, result);
        return result;

      } catch (error) {
        console.error(`Error executing node ${nodeId}:`, error);
        throw error;
      } finally {
        // Remove visual feedback
        node.node.element.classList.remove('executing');
      }
    };

    // Find terminal nodes (nodes with no outputs)
    const terminalNodes = Array.from(graph.entries())
      .filter(([_, node]) => node.outputs.length === 0)
      .map(([id]) => id);

    // Execute flow starting from terminal nodes
    const finalResults = await Promise.all(
      terminalNodes.map(nodeId => executeNode(nodeId))
    );

    return finalResults;
  }
}