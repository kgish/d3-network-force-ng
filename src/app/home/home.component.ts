import { AfterViewInit, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs';

// Material
import { MatCardModule } from '@angular/material/card';
import { MatSliderModule } from '@angular/material/slider';

// D3.js
import {
  Selection,
  Simulation,
  SimulationNodeDatum,
  drag,
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  json,
  scaleOrdinal,
  schemeCategory10,
  select
} from 'd3';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  imports: [
    MatCardModule,
    ReactiveFormsModule,
    MatSliderModule
  ],
  styleUrls: [ './home.component.scss' ]
})
export class HomeComponent implements OnInit, AfterViewInit {
  #color = scaleOrdinal(schemeCategory10);
  #destroyRef = inject(DestroyRef);

  svg!: Selection<SVGGElement, unknown, HTMLElement, any>;

  width!: number;
  height!: number;

  // Svg objects
  link!: Selection<SVGLineElement, unknown, SVGElement, any>;
  node!: Selection<SVGCircleElement, unknown, SVGElement, any>;

  // The data - an object with nodes and links
  graph!: any;

  simulation!: Simulation<SimulationNodeDatum, undefined>;

  form!: FormGroup;

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

  constructor() {
  }

  ngOnInit() {
    console.log('ngOnInit()')
    this._initializeForm();
  }

  ngAfterViewInit() {
    console.log('ngAfterViewInit()')
    json("./assets/miserables.json")
      .then(graph => {
        this.graph = graph;
        this._initializeGraph();
      });
  }

  // Convenience function to update everything (run after UI input)
  updateAll() {
    console.log('updateAll()')
    this._updateForces();
    this._updateDisplay();
  }

  // --- Event handlers --- //

  forcePropertyEnable = (name: string, enabled: any) => {
    console.log('forcePropertyEnable()')
    // @ts-ignore
    this.forceProperties[name].enabled = enabled;
    this.updateAll();
  }

  center_XSliderOutput = (event: any) => {
    console.log('center_XSliderOutput()')
    const value = +event.target.value;
    select('#center_XSliderOutput').text(value);
    this.forceProperties.center.x = value;
    this.updateAll();
  }

  center_YSliderOutput = (event: any) => {
    console.log('center_YSliderOutput()')
    const value = +event.target.value;
    select('#center_YSliderOutput').text(value);
    this.forceProperties.center.y = value;
    this.updateAll();
  }

  charge_StrengthSliderOutput = (event: any) => {
    console.log('charge_StrengthSliderOutput()')
    const value = +event.target.value;
    select('#charge_StrengthSliderOutput').text(value);
    this.forceProperties.charge.strength = +value;
    this.updateAll();
  }

  charge_DistanceMinSliderOutput = (event: any) => {
    console.log('charge_DistanceMinSliderOutput()')
    const value = +event.target.value;
    select('#charge_distanceMinSliderOutput').text(value);
    this.forceProperties.charge.distanceMin = +value;
    this.updateAll();
  }

  charge_DistanceMaxSliderOutput = (event: any) => {
    console.log('charge_DistanceMaxSliderOutput()')
    const value = +event.target.value;
    select('#charge_distanceMaxSliderOutput').text(value);
    this.forceProperties.charge.distanceMax = +value;
    this.updateAll();
  }

  collide_StrengthSliderOutput = (event: any) => {
    console.log('collide_StrengthSliderOutput()')
    const value = +event.target.value;
    select('#collide_StrengthSliderOutput').text(value);
    this.forceProperties.collide.strength = +value;
    this.updateAll();
  }

  collide_RadiusSliderOutput = (event: any) => {
    console.log('collide_RadiusSliderOutput()')
    const value = +event.target.value;
    select('#collide_radiusSliderOutput').text(value);
    this.forceProperties.collide.radius = +value;
    this.updateAll();
  }

  collide_IterationsSliderOutput = (event: any) => {
    console.log('collide_IterationsSliderOutput()')
    const value = +event.target.value;
    select('#collide_iterationsSliderOutput').text(value);
    this.forceProperties.collide.iterations = +value;
    this.updateAll();
  }

  forceX_StrengthSliderOutput = (event: any) => {
    console.log('forceX_StrengthSliderOutput()')
    const value = +event.target.value;
    select('#forceX_StrengthSliderOutput').text(value);
    this.forceProperties.forceX.strength = +value;
    this.updateAll();
  }

  forceX_XSliderOutput = (event: any) => {
    console.log('forceX_XSliderOutput()')
    const value = +event.target.value;
    select('#forceX_XSliderOutput').text(value);
    this.forceProperties.forceX.x = +value;
    this.updateAll();
  }

  forceY_StrengthSliderOutput = (event: any) => {
    console.log('forceY_StrengthSliderOutput()')
    const value = +event.target.value;
    select('#forceY_StrengthSliderOutput').text(value);
    this.forceProperties.forceY.strength = +value;
    this.updateAll();
  }

  forceY_YSliderOutput = (event: any) => {
    console.log('forceY_YSliderOutput()')
    const value = +event.target.value;
    select('#forceY_YSliderOutput').text(value);
    this.forceProperties.forceY.y = +value;
    this.updateAll();
  }

  link_DistanceSliderOutput = (event: any) => {
    console.log('link_DistanceSliderOutput()')
    const value = +event.target.value;
    select('#link_DistanceSliderOutput').text(value);
    this.forceProperties.link.distance = +value;
    this.updateAll();
  }

  link_IterationsSliderOutput = (event: any) => {
    console.log('link_IterationsSliderOutput()')
    const value = +event.target.value;
    select('#link_IterationsSliderOutput').text(value);
    this.forceProperties.link.iterations = +value;
    this.updateAll();
  }

  private _initializeForm = () => {
    console.log('_initializeForm()')
    this.form = new FormGroup<any>({
      center: new FormGroup({
        x: new FormControl(0.5),
        y: new FormControl(0.5)
      }),
      charge: new FormGroup({
        enabled: new FormControl(true),
        strength: new FormControl(-30),
        distanceMin: new FormControl(1),
        distanceMax: new FormControl(2000)
      }),
      collide: new FormGroup({
        enabled: new FormControl(true),
        strength: new FormControl(0.7),
        iterations: new FormControl(1),
        radius: new FormControl(5)
      }),
      forceX: new FormGroup({
        enabled: new FormControl(false),
        strength: new FormControl(0.1),
        x: new FormControl(0.5)
      }),
      forceY: new FormGroup({
        enabled: new FormControl(false),
        strength: new FormControl(0.1),
        y: new FormControl(0.5)
      }),
      link: new FormGroup({
        enabled: new FormControl(false),
        distance: new FormControl(30),
        iterations: new FormControl(1)
      })
    });

    this._initializeFormChanges();
  }

  private _initializeFormChanges = () => {
    console.log('_initializeFormChanges()')
    this.form.valueChanges
      .pipe(
        debounceTime(200),
        takeUntilDestroyed(this.#destroyRef),
      )
      .subscribe(value => this._handleFormChange(value))
  }

  private _handleFormChange = (value: any) => {
    console.log(`_handleFormChange() value='${ JSON.stringify(value) }'`);
  }

  private _initializeGraph = () => {
    console.log('_initializeGraph() 1')
    this.svg = select("svg");
    this._setWidthAndHeight();

    // Load the data, see: https://github.com/d3/d3/blob/main/CHANGES.md#changes-in-d3-50
    console.log('_initializeGraph() 2')
    console.log('_initializeGraph() 3')
    this._initializeDisplay();
    console.log('_initializeGraph() 4')
    this._initializeSimulation();
    console.log('_initializeGraph() 5')
  }

  // Set up the simulation and event to update locations after each tick
  private _initializeSimulation = () => {
    console.log('_initializeSimulation()')
    this.simulation = forceSimulation();
    this.simulation.nodes(this.graph.nodes);
    this._initializeForces();
    this.simulation.on("tick", this._ticked);
  }

  // Add forces to the simulation
  private _initializeForces = () => {
    console.log('_initializeForces()')
    // add forces and associate each with a name
    this.simulation
      .force("link", forceLink())
      .force("charge", forceManyBody())
      .force("collide", forceCollide())
      .force("center", forceCenter())
      .force("forceX", forceX())
      .force("forceY", forceY());
    // apply properties to each of the forces
    this._updateForces();
  }

  // Apply new force properties
  private _updateForces = () => {
    console.log('_updateForces()')
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
    console.log('_initializeDisplay()')
    // Set the data and properties of link lines
    this.link = this.svg.append("g")
      .attr("class", "links")
      .attr("stroke", "darkgray")
      .selectAll("line")
      .data(this.graph.links)
      .enter().append("line");

    // Set the data and properties of node circles
    this.node = this.svg.append("g")
      .attr("class", "nodes")
      .selectAll("circle")
      .data(this.graph.nodes)

      .enter().append("circle")
      .style('fill', (d: any) => this.#color(d.group))
      .style('cursor', 'pointer')
      // @ts-ignore
      .call(drag()
        .on("start", (e: any, d: any) => this._dragStart(e, d))
        .on("drag", (e: any, d: any) => this._dragOngoing(e, d))
        .on("end", (e: any, d: any) => this._dragEnd(e, d))
      );

    // Node tooltip
    this.node.append("title").text((d: any) => d.id);

    this._initializeOnWindowResize();

    // Visualize the graph
    this._updateDisplay();
  }

  private _initializeOnWindowResize = () => {
    console.log('_initializeOnWindowResize()')
    select(window).on("resize", () => this._handleOnWindowResize());
  }

  private _handleOnWindowResize = () => {
    console.log('_handleOnWindowResize()')
    // Update dimensions and size-related forces
    this._setWidthAndHeight();
    this._updateForces();
  }

  private _setWidthAndHeight = () => {
    console.log('_setWidthAndHeight()')
    // Update dimensions (width and height)
    const node = this.svg.node();
    this.width = +node!.getBoundingClientRect().width;
    this.height = +node!.getBoundingClientRect().height;
  }

  // Update the display based on the forces (but not positions)
  private _updateDisplay = () => {
    console.log('_updateDisplay()')
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

    select('#alpha_value').style('flex-basis', (this.simulation.alpha() * 100) + '%');
  }

  //--- UI EVENTS ---//

  private _dragStart = (event: any, d: SimulationNodeDatum) => {
    if (!event.active) {
      if (this.simulation) {
        this.simulation.alphaTarget(0.3).restart();
      }
    }
    d.fx = d.x;
    d.fy = d.y;
  }

  private _dragOngoing = (event: any, d: SimulationNodeDatum) => {
    d.fx = event.x;
    d.fy = event.y;
  }

  private _dragEnd = (event: any, d: SimulationNodeDatum) => {
    if (!event.active) {
      if (this.simulation) {
        this.simulation.alphaTarget(0.0001);
      }
    }
    d.fx = null;
    d.fy = null;
  }
}
