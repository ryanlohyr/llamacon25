'use client';

import * as d3 from 'd3';
import { useEffect, useRef } from 'react';

// Define types for nodes and links
interface Node {
  id: string;
  group: number;
  type: 'preference' | 'interest' | 'topic';
  content: string;
  strength: number; // How strong the preference is (1-10)
}

interface Link {
  source: string;
  target: string;
  value: number;
  type: 'related' | 'influences' | 'similar';
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

export const Graph = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const graphData: GraphData = {
    nodes: [
      { id: "Coffee", group: 1, type: 'preference', content: "Strong preference for coffee, especially dark roast", strength: 9 },
      { id: "Tea", group: 1, type: 'preference', content: "Enjoys green tea occasionally", strength: 4 },
      { id: "Jazz", group: 2, type: 'interest', content: "Loves jazz music", strength: 8 },
      { id: "Classical Music", group: 2, type: 'interest', content: "Appreciates classical music", strength: 6 },
      { id: "Rock", group: 2, type: 'interest', content: "Enjoys rock music from the 70s and 80s", strength: 7 },
      { id: "Hiking", group: 3, type: 'interest', content: "Enjoys hiking in mountains", strength: 8 },
      { id: "Camping", group: 3, type: 'interest', content: "Likes weekend camping trips", strength: 7 },
      { id: "Cooking", group: 4, type: 'interest', content: "Passionate about cooking Italian food", strength: 9 },
      { id: "Italian Food", group: 4, type: 'preference', content: "Favorite cuisine is Italian", strength: 10 },
      { id: "Science Fiction", group: 5, type: 'interest', content: "Loves science fiction books and movies", strength: 8 },
      { id: "Fantasy", group: 5, type: 'interest', content: "Enjoys fantasy novels", strength: 7 },
      { id: "Technology", group: 6, type: 'topic', content: "Interested in latest technology trends", strength: 8 },
      { id: "AI", group: 6, type: 'topic', content: "Fascinated by artificial intelligence advances", strength: 9 },
      { id: "Climate", group: 7, type: 'topic', content: "Concerned about climate change", strength: 8 }
    ],
    links: [
      // Connect preferences with related interests
      { source: "Coffee", target: "Tea", value: 3, type: 'similar' },
      { source: "Coffee", target: "Italian Food", value: 2, type: 'related' },
      { source: "Tea", target: "Hiking", value: 1, type: 'related' },
      
      // Music connections
      { source: "Jazz", target: "Classical Music", value: 3, type: 'similar' },
      { source: "Classical Music", target: "Rock", value: 2, type: 'similar' },
      { source: "Jazz", target: "Rock", value: 1, type: 'similar' },
      
      // Outdoor activities connections
      { source: "Hiking", target: "Camping", value: 4, type: 'related' },
      { source: "Camping", target: "Cooking", value: 2, type: 'related' },
      
      // Food connections
      { source: "Cooking", target: "Italian Food", value: 5, type: 'related' },
      { source: "Italian Food", target: "Coffee", value: 3, type: 'influences' },
      
      // Entertainment connections
      { source: "Science Fiction", target: "Fantasy", value: 4, type: 'similar' },
      { source: "Science Fiction", target: "Technology", value: 3, type: 'related' },
      { source: "Fantasy", target: "Jazz", value: 1, type: 'influences' },
      
      // Technology connections
      { source: "Technology", target: "AI", value: 5, type: 'related' },
      { source: "AI", target: "Science Fiction", value: 3, type: 'influences' },
      
      // More cross-domain connections to ensure all connected
      { source: "Climate", target: "Hiking", value: 2, type: 'influences' },
      { source: "Climate", target: "Technology", value: 3, type: 'related' },
      { source: "Rock", target: "Camping", value: 1, type: 'related' },
      { source: "AI", target: "Coffee", value: 1, type: 'influences' },
      { source: "Cooking", target: "Jazz", value: 1, type: 'influences' }
    ]
  };

  // Type definition for D3 drag event
  type DragEvent = d3.D3DragEvent<SVGCircleElement, Node, d3.SimulationNodeDatum & Node>;

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
      .domain(['preference', 'interest', 'topic'])
      .range(['#6495ED', '#FFA07A', '#90EE90']);

    // Create the force simulation
    const simulation = d3.forceSimulation<d3.SimulationNodeDatum & Node>()
      .force('link', d3.forceLink<d3.SimulationNodeDatum & Node, d3.SimulationLinkDatum<d3.SimulationNodeDatum & Node>>().id((d: Node) => d.id))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('x', d3.forceX())
      .force('y', d3.forceY())
      .force('collision', d3.forceCollide().radius((d: d3.SimulationNodeDatum & Node) => d.strength * 2 + 10));

    // Define link color based on type
    const linkColor = d3.scaleOrdinal<string>()
      .domain(['related', 'influences', 'similar'])
      .range(['#999', '#F08080', '#87CEFA']);

    // Create link arrows
    svg.append('defs').selectAll('marker')
      .data(['related', 'influences', 'similar'])
      .join('marker')
      .attr('id', (d: string) => `arrow-${d}`)
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .append('path')
      .attr('d', 'M 0,-5 L 10,0 L 0,5')
      .attr('fill', (d: string) => linkColor(d));

    // Create the links
    const link = svg.append('g')
      .selectAll('line')
      .data(graphData.links)
      .join('line')
      .attr('stroke', (d: Link) => linkColor(d.type))
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', (d: Link) => Math.sqrt(d.value) * 1.5)
      .attr('marker-end', (d: Link) => `url(#arrow-${d.type})`);

    // Create the nodes
    const node = svg.append('g')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .selectAll('circle')
      .data(graphData.nodes)
      .join('circle')
      .attr('r', (d: Node) => 8 + d.strength)
      .attr('fill', (d: Node) => color(d.type))
      .call(drag(simulation));

    // Add tooltips
    node.append('title')
      .text((d: Node) => d.content);

    // Add labels to nodes
    const labels = svg.append('g')
      .selectAll('text')
      .data(graphData.nodes)
      .join('text')
      .text((d: Node) => d.id)
      .attr('font-size', 11)
      .attr('font-weight', 'bold')
      .attr('dx', 15)
      .attr('dy', 4);

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
        .attr('x', (d: d3.SimulationNodeDatum & Node) => d.x!)
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
      <h1>Your Memory</h1>
      <p>This visualization represents your preferences and interests</p>
      <svg ref={svgRef} className="graph-svg"></svg>
    </div>
  );
};