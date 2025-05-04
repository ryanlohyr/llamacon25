'use client';

import * as d3 from 'd3';
import { useEffect, useRef } from 'react';

// Define types for nodes and links
interface Node {
  id: string;
  group: number;
  type: 'category' | 'question';
  content: string;
  strength?: number;
}

interface Link {
  source: string;
  target: string;
  value: number;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

export const Graph = ({ id }: { id: string }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Type definition for D3 drag event
  type DragEvent = d3.D3DragEvent<SVGCircleElement, Node, d3.SimulationNodeDatum & Node>;

  // Sample data structure
  const graphData: GraphData = {
    nodes: [
      // Categories (larger circles)
      { id: "Programming", group: 1, type: 'category', content: "Programming related topics" },
      { id: "Data Science", group: 2, type: 'category', content: "Data Science topics" },
      { id: "Web Development", group: 3, type: 'category', content: "Web Development topics" },
      
      // Questions for Programming
      { id: "How to learn Python?", group: 1, type: 'question', content: "I want to learn Python programming", strength: 5 },
      { id: "Best practices for clean code?", group: 1, type: 'question', content: "Looking for clean code guidelines", strength: 4 },
      { id: "Debugging techniques?", group: 1, type: 'question', content: "Effective debugging methods", strength: 6 },
      
      // Questions for Data Science
      { id: "Machine learning basics", group: 2, type: 'question', content: "Understanding ML fundamentals", strength: 7 },
      { id: "Data visualization tools", group: 2, type: 'question', content: "Best tools for data viz", strength: 5 },
      { id: "Statistical methods", group: 2, type: 'question', content: "Common statistical approaches", strength: 4 },
      
      // Questions for Web Development
      { id: "React vs Angular", group: 3, type: 'question', content: "Comparing frontend frameworks", strength: 6 },
      { id: "CSS best practices", group: 3, type: 'question', content: "Modern CSS approaches", strength: 5 },
      { id: "Backend technologies", group: 3, type: 'question', content: "Popular backend options", strength: 7 },
      !!id  ? null : { id: "My tailwind styles arent showing", group: 3, type: 'question', content: "I want to learn React programming", strength: 5 }
    ].filter(Boolean),
    links: [
      // Link questions to their categories
      { source: "Programming", target: "How to learn Python?", value: 1 },
      { source: "Programming", target: "Best practices for clean code?", value: 1 },
      { source: "Programming", target: "Debugging techniques?", value: 1 },
      
      { source: "Data Science", target: "Machine learning basics", value: 1 },
      { source: "Data Science", target: "Data visualization tools", value: 1 },
      { source: "Data Science", target: "Statistical methods", value: 1 },
      
      { source: "Web Development", target: "React vs Angular", value: 1 },
      { source: "Web Development", target: "CSS best practices", value: 1 },
      { source: "Web Development", target: "Backend technologies", value: 1 },
      ...(id ? [] : [{ source: "Web Development", target: "My tailwind styles arent showing", value: 1 }]),
      
      // Some cross-category connections
      { source: "Programming", target: "Machine learning basics", value: 1 },
      { source: "Data Science", target: "React vs Angular", value: 1 },
      { source: "Programming", target: "Backend technologies", value: 1 }
    ]
  };

  // Function to fetch graph data from API (could be implemented later)
  // const fetchGraphData = async () => {
  //   try {
  //     const response = await fetch('/api/load-graph');
  //     const data = await response.json();
  //     setGraphData(data);
  //   } catch (error) {
  //     console.error('Failed to fetch graph data:', error);
  //   }
  // };

  useEffect(() => {
    if (!svgRef.current) return;
    
    // Clear any existing graph
    d3.select(svgRef.current).selectAll('*').remove();

    // Set dimensions
    const width = 900;
    const height = 700;

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])
      .attr('style', 'max-width: 100%; height: auto;');

    // Define color scale for node types
    const color = d3.scaleOrdinal<string>()
      .domain(['category', 'question'])
      .range(['#4682B4', '#FF8C00']);

    // Create the force simulation
    const simulation = d3.forceSimulation<d3.SimulationNodeDatum & Node>()
      .force('link', d3.forceLink<d3.SimulationNodeDatum & Node, d3.SimulationLinkDatum<d3.SimulationNodeDatum & Node>>().id((d: Node) => d.id))
      .force('charge', d3.forceManyBody().strength(-500))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('x', d3.forceX())
      .force('y', d3.forceY())
      .force('collision', d3.forceCollide().radius((d: d3.SimulationNodeDatum & Node) => 
        d.type === 'category' ? 50 : (d.strength || 5) * 2 + 10
      ));

    // Create the links
    const link = svg.append('g')
      .selectAll('line')
      .data(graphData.links)
      .join('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', (d: Link) => Math.sqrt(d.value) * 1.5);

    // Create a group for all nodes
    const nodeGroup = svg.append('g')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5);

    // Create the nodes
    const node = nodeGroup.selectAll('circle')
      .data(graphData.nodes)
      .join('circle')
      .attr('r', (d: Node) => d.type === 'category' ? 40 : (d.strength || 5) * 2)
      .attr('fill', (d: Node) => color(d.type))
      .attr('opacity', (d: Node) => d.type === 'category' ? 0.8 : 1)
      .call(drag(simulation));

    // Add tooltips
    node.append('title')
      .text((d: Node) => d.content);

    // Add labels to nodes
    const labels = svg.append('g')
      .selectAll('text')
      .data(graphData.nodes)
      .join('text')
      .text((d: Node) => {
        // Limit question text length
        if (d.type === 'question' && d.id.length > 20) {
          return d.id.substring(0, 17) + '...';
        }
        return d.id;
      })
      .attr('font-size', (d: Node) => d.type === 'category' ? 14 : 11)
      .attr('font-weight', (d: Node) => d.type === 'category' ? 'bold' : 'normal')
      .attr('dx', (d: Node) => d.type === 'category' ? 0 : 15)
      .attr('dy', (d: Node) => d.type === 'category' ? 5 : 4)
      .attr('text-anchor', (d: Node) => d.type === 'category' ? 'middle' : 'start');

    // Update positions on simulation tick
    simulation.nodes(graphData.nodes as (d3.SimulationNodeDatum & Node)[]);
    (simulation.force('link') as d3.ForceLink<d3.SimulationNodeDatum & Node, d3.SimulationLinkDatum<d3.SimulationNodeDatum & Node>>)
      .links(graphData.links as d3.SimulationLinkDatum<d3.SimulationNodeDatum & Node>[]);

    simulation.on('tick', () => {
      link
        .attr('x1', (d: d3.SimulationLinkDatum<d3.SimulationNodeDatum & Node>) => d.source.x!)
        .attr('y1', (d: d3.SimulationLinkDatum<d3.SimulationNodeDatum & Node>) => d.source.y!)
        .attr('x2', (d: d3.SimulationLinkDatum<d3.SimulationNodeDatum & Node>) => d.target.x!)
        .attr('y2', (d: d3.SimulationLinkDatum<d3.SimulationNodeDatum & Node>) => d.target.y!);

      node
        .attr('cx', (d: d3.SimulationNodeDatum & Node) => d.x!)
        .attr('cy', (d: d3.SimulationNodeDatum & Node) => d.y!);

      labels
        .attr('x', (d: d3.SimulationNodeDatum & Node) => {
          // Position category labels in the center of the node
          return d.type === 'category' ? d.x! : d.x! + 15;
        })
        .attr('y', (d: d3.SimulationNodeDatum & Node) => d.y!);
    });

    // Drag function for interactive nodes
    function drag(simulation: d3.Simulation<d3.SimulationNodeDatum, undefined>) {
      function dragstarted(event: DragEvent, d: d3.SimulationNodeDatum & Node) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }

      function dragged(event: DragEvent, d: d3.SimulationNodeDatum & Node) {
        d.fx = event.x;
        d.fy = event.y;
      }

      function dragended(event: DragEvent, d: d3.SimulationNodeDatum & Node) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }

      return d3.drag<SVGCircleElement, Node>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended);
    }

    // Clean up function
    return () => {
      simulation.stop();
    };
  }, []);

  return (
    <div className="graph-container">
      <h1>Knowledge Graph</h1>
      <p>This visualization represents categories and related questions</p>
      <svg ref={svgRef} className="graph-svg"></svg>
    </div>
  );
};