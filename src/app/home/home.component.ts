import { AfterViewInit, Component } from '@angular/core';

import * as d3 from 'd3';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  imports: [
    MatCardModule
  ],
  styleUrls: [ './home.component.scss' ]
})
export class HomeComponent implements AfterViewInit {
  svg!: d3.Selection<SVGGElement, unknown, HTMLElement, any>;

  width!: number;
  height!: number;

  // svg objects
  link!: d3.Selection<SVGLineElement, unknown, SVGElement, any>;
  node!: d3.Selection<SVGCircleElement, unknown, SVGElement, any>;

  // the data - an object with nodes and links
  graph!: any;

  simulation!: d3.Simulation<d3.SimulationNodeDatum, undefined>;

  // Values for all forces
  private forceProperties = {
    center: {
      x: 0.5,
      y: 0.5
    },
    charge: {
      enabled: true,
      strength: -30,
      distanceMin: 1,
      distanceMax: 2000
    },
    collide: {
      enabled: true,
      strength: 0.7,
      iterations: 1,
      radius: 5
    },
    forceX: {
      enabled: false,
      strength: 0.1,
      x: 0.5
    },
    forceY: {
      enabled: false,
      strength: 0.1,
      y: 0.5
    },
    link: {
      enabled: true,
      distance: 30,
      iterations: 1
    }
  };

  ngAfterViewInit() {
    setTimeout(async () => await this._initializeGraph(), 0)
  }

  // Convenience function to update everything (run after UI input)
  updateAll() {
    this._updateForces();
    this._updateDisplay();
  }

  // --- Event handlers --- //

  forcePropertyEnable = (name: string, enabled: any) => {
    // @ts-ignore
    this.forceProperties[name].enabled = enabled;
    this.updateAll();
  }

  center_XSliderOutput = (event: any) => {
    const value = +event.target.value;
    d3.select('#center_XSliderOutput').text(value);
    this.forceProperties.center.x = value;
    this.updateAll();
  }

  center_YSliderOutput = (event: any) => {
    const value = +event.target.value;
    d3.select('#center_YSliderOutput').text(value);
    this.forceProperties.center.y = value;
    this.updateAll();
  }

  charge_StrengthSliderOutput = (event: any) => {
    const value = +event.target.value;
    d3.select('#charge_StrengthSliderOutput').text(value);
    this.forceProperties.charge.strength = +value;
    this.updateAll();
  }

  charge_distanceMinSliderOutput = (event: any) => {
    const value = +event.target.value;
    d3.select('#charge_distanceMinSliderOutput').text(value);
    this.forceProperties.charge.distanceMin = +value;
    this.updateAll();
  }

  charge_distanceMaxSliderOutput = (event: any) => {
    const value = +event.target.value;
    d3.select('#charge_distanceMaxSliderOutput').text(value);
    this.forceProperties.charge.distanceMax = +value;
    this.updateAll();
  }

  collide_StrengthSliderOutput = (event: any) => {
    const value = +event.target.value;
    d3.select('#collide_StrengthSliderOutput').text(value);
    this.forceProperties.collide.strength = +value;
    this.updateAll();
  }

  collide_radiusSliderOutput = (event: any) => {
    const value = +event.target.value;
    d3.select('#collide_radiusSliderOutput').text(value);
    this.forceProperties.collide.radius = +value;
    this.updateAll();
  }

  collide_iterationsSliderOutput = (event: any) => {
    const value = +event.target.value;
    d3.select('#collide_iterationsSliderOutput').text(value);
    this.forceProperties.collide.iterations = +value;
    this.updateAll();
  }

  forceX_StrengthSliderOutput = (event: any) => {
    const value = +event.target.value;
    d3.select('#forceX_StrengthSliderOutput').text(value);
    this.forceProperties.forceX.strength = +value;
    this.updateAll();
  }

  forceX_XSliderOutput = (event: any) => {
    const value = +event.target.value;
    d3.select('#forceX_XSliderOutput').text(value);
    this.forceProperties.forceX.x = +value;
    this.updateAll();
  }

  forceY_StrengthSliderOutput = (event: any) => {
    const value = +event.target.value;
    d3.select('#forceY_StrengthSliderOutput').text(value);
    this.forceProperties.forceY.strength = +value;
    this.updateAll();
  }

  forceY_YSliderOutput = (event: any) => {
    const value = +event.target.value;
    d3.select('#forceY_YSliderOutput').text(value);
    this.forceProperties.forceY.y = +value;
    this.updateAll();
  }

  link_DistanceSliderOutput = (event: any) => {
    const value = +event.target.value;
    d3.select('#link_DistanceSliderOutput').text(value);
    this.forceProperties.link.distance = +value;
    this.updateAll();
  }

  link_IterationsSliderOutput = (event: any) => {
    const value = +event.target.value;
    d3.select('#link_IterationsSliderOutput').text(value);
    this.forceProperties.link.iterations = +value;
    this.updateAll();
  }

  private _initializeGraph = async () => {
    this.svg = d3.select("svg");
    this._setWidthAndHeight();

    // Load the data, see: https://github.com/d3/d3/blob/main/CHANGES.md#changes-in-d3-50
    this.graph = await d3.json("./assets/miserables.json");
    this._initializeDisplay();
    this._initializeSimulation();
  }

  // Set up the simulation and event to update locations after each tick
  private _initializeSimulation = () => {
    this.simulation = d3.forceSimulation();
    this.simulation.nodes(this.graph.nodes);
    this._initializeForces();
    this.simulation.on("tick", this._ticked);
  }

  // Add forces to the simulation
  private _initializeForces = () => {
    // add forces and associate each with a name
    this.simulation
      .force("link", d3.forceLink())
      .force("charge", d3.forceManyBody())
      .force("collide", d3.forceCollide())
      .force("center", d3.forceCenter())
      .force("forceX", d3.forceX())
      .force("forceY", d3.forceY());
    // apply properties to each of the forces
    this._updateForces();
  }

  // Apply new force properties
  private _updateForces = () => {
    // get each force by name and update the properties
    this.simulation.force("center")!
      // @ts-ignore
      .x(this.width * this.forceProperties.center.x)
      .y(this.height * this.forceProperties.center.y);
    this.simulation.force("charge")!
      // @ts-ignore
      .strength(this.forceProperties.charge.strength * (this.forceProperties.charge.enabled ? 1 : 0))
      .distanceMin(this.forceProperties.charge.distanceMin)
      .distanceMax(this.forceProperties.charge.distanceMax);
    this.simulation.force("collide")!
      // @ts-ignore
      .strength(this.forceProperties.collide.strength * (this.forceProperties.collide.enabled ? 1 : 0))
      .radius(this.forceProperties.collide.radius)
      .iterations(this.forceProperties.collide.iterations);
    this.simulation.force("forceX")!
      // @ts-ignore
      .strength(this.forceProperties.forceX.strength * (this.forceProperties.forceX.enabled ? 1 : 0))
      .x(this.width * this.forceProperties.forceX.x);
    this.simulation.force("forceY")!
      // @ts-ignore
      .strength(this.forceProperties.forceY.strength * (this.forceProperties.forceY.enabled ? 1 : 0))
      .y(this.height * this.forceProperties.forceY.y);
    this.simulation.force("link")!
      // @ts-ignore
      .id(d => d.id)
      .distance(this.forceProperties.link.distance)
      .iterations(this.forceProperties.link.iterations)
      .links(this.forceProperties.link.enabled ? this.graph.links : []);

    // updates ignored until this is run
    // restarts the simulation (important if simulation has already slowed down)
    this.simulation.alpha(1).restart();
  }

  //--- DISPLAY ---//

  private _initializeDisplay = () => {
    // set the data and properties of link lines
    this.link = this.svg.append("g")
      .attr("class", "links")
      .attr("stroke", "darkgray")
      .selectAll("line")
      .data(this.graph.links)
      .enter().append("line");

    // set the data and properties of node circles
    this.node = this.svg.append("g")
      .attr("class", "nodes")
      .selectAll("circle")
      .data(this.graph.nodes)
      .enter().append("circle")
      .call(d3.drag())
      // .on("start", (event: any, d: any) => this._dragStart(event, d))
      // .on("drag", (event: any, d: any) => this._dragOngoing(event, d))
      // .on("end", (event: any, d: any) => this._dragEnd(event, d));
      .on("start", this._dragStart)
      .on("drag", this._dragOngoing)
      .on("end", this._dragEnd);

    // node tooltip
    this.node.append("title").text((d: any) => d.id);

    this._initializeOnWindowResize();

    // visualize the graph
    this._updateDisplay();
  }

  private _initializeOnWindowResize = () => d3.select(window).on("resize", () => this._handleWindowOnResize());

  private _handleWindowOnResize = () => {
    // Update dimensions and size-related forces
    this._setWidthAndHeight();
    this._updateForces();
  }

  private _setWidthAndHeight = () => {
    // Update dimensions (width and height)
    const node = this.svg.node();
    this.width = +node!.getBoundingClientRect().width;
    this.height = +node!.getBoundingClientRect().height;
  }

  // Update the display based on the forces (but not positions)
  private _updateDisplay = () => {
    this.node
      .attr("r", this.forceProperties.collide.radius)
      .attr("stroke", this.forceProperties.charge.strength > 0 ? "blue" : "red")
      .attr("stroke-width", this.forceProperties.charge.enabled ? Math.abs(this.forceProperties.charge.strength) / 15 : 0);

    this.link
      .attr("stroke-width", this.forceProperties.link.enabled ? 1 : .5)
      .attr("opacity", this.forceProperties.link.enabled ? 1 : 0);
  }

  // Update the display positions after each simulation tick
  private _ticked = () => {
    this.link
      .attr("x1", (d: any) => d.source.x)
      .attr("y1", (d: any) => d.source.y)
      .attr("x2", (d: any) => d.target.x)
      .attr("y2", (d: any) => d.target.y);

    this.node
      .attr("cx", (d: any) => d.x)
      .attr("cy", (d: any) => d.y);

    d3.select('#alpha_value').style('flex-basis', (this.simulation.alpha() * 100) + '%');
  }

  //--- UI EVENTS ---//

  // private _dragStart = (event: any, d: any) => {
  //   if (!event.active) {
  private _dragStart = (d: any) => {
    console.log('_dragStart()');
    if (!d3.event.active) {
      if (this.simulation) {
        this.simulation.alphaTarget(0.3).restart();
      }
    }
    d.fx = d.x;
    d.fy = d.y;
  }

  // private _dragOngoing = (event: any, d: any) => {
  //   d.fx = event.x;
  //   d.fy = event.y;
  // }
  private _dragOngoing = (d: any) => {
    console.log('_dragOngoing()');
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  // private _dragEnd = (event: any, d: any) => {
  //   if (!event.active) {
  private _dragEnd = (d: any) => {
    console.log('_dragEnd()');
    if (!d3.event.active) {
      if (this.simulation) {
        this.simulation.alphaTarget(0.0001);
      }
    }
    d.fx = null;
    d.fy = null;
  }
}
