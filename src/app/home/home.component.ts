import { AfterViewInit, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
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
  scaleOrdinal,
  schemeCategory10,
  select
} from 'd3';
import { ActivatedRoute } from "@angular/router";

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

  constructor(
    private formBuilder: FormBuilder,
    private activatedRoute: ActivatedRoute
  ) {
  }

  ngOnInit() {
    this.graph = this.activatedRoute.snapshot.data['graph'];
    console.log('ngOnInit() before _initializeForm')
    this._initializeForm();
    console.log('ngOnInit() after _initializeForm')
  }

  ngAfterViewInit() {
    console.log('ngAfterViewInit() before _initializeGraph')
    this._initializeGraph();
    console.log('ngAfterViewInit() after _initializeGraph')
  }

  // Convenience function to update everything (run after UI input)
  updateAll() {
    console.log('updateAll() before _updateForces');
    this._updateForces(this.form.value);
    console.log('updateAll() after _updateForces');
    console.log('updateAll() before _updateDisplay');
    this._updateDisplay();
    console.log('updateAll() after _updateDisplay');
  }

  private _initializeForm = () => {
    console.log('_initializeForm() before this.formBuilder');
    this.form = this.formBuilder.group({
      center: this.formBuilder.group({
        x: 0.5,
        y: 0.5
      }),
      charge: this.formBuilder.group({
        enabled: true,
        strength: -30,
        distanceMin: 1,
        distanceMax: 2000
      }),
      collide: this.formBuilder.group({
        enabled: true,
        strength: 0.7,
        radius: 5,
        iterations: 1,
      }),
      forceX: this.formBuilder.group({
        enabled: false,
        strength: 0.1,
        x: 0.5
      }),
      forceY: this.formBuilder.group({
        enabled: false,
        strength: 0.1,
        y: 0.5
      }),
      link: this.formBuilder.group({
        enabled: true,
        distance: 30,
        iterations: 1
      })
    });
    console.log('_initializeForm() after this.formBuilder');

    console.log('_initializeForm() before _initializeFormChanges');
    this._initializeFormChanges();
    console.log('_initializeForm() after _initializeFormChanges');
  }

  private _initializeFormChanges = () => {
    console.log('_initializeFormChanges() before form.valueChanges')
    this.form.valueChanges
      .pipe(
        debounceTime(200),
        takeUntilDestroyed(this.#destroyRef),
      )
      .subscribe(value => {
        console.log('_initializeFormChanges() before _handleFormChanges')
        this._handleFormChange(value);
        console.log('_initializeFormChanges() after _handleFormChanges')
      })
    console.log('_initializeFormChanges() after form.valueChanges')
  }

  private _handleFormChange = (value: any) => {
    console.log('_handleFormChange() before _updateForces');
    this._updateForces(value);
    console.log('_handleFormChange() after _updateForces');
  }

  private _initializeGraph = () => {
    console.log('_initializeGraph() before select')
    this.svg = select("svg");
    console.log('_initializeGraph() after select')
    console.log('_initializeGraph() before _setWidthAndHeight')
    this._setWidthAndHeight();
    console.log('_initializeGraph() after _setWidthAndHeight')

    // Load the data, see: https://github.com/d3/d3/blob/main/CHANGES.md#changes-in-d3-50
    console.log('_initializeGraph() before _initializeDisplay')
    this._initializeDisplay();
    console.log('_initializeGraph() after _initializeDisplay')
    console.log('_initializeGraph() before _initializeSimulation')
    this._initializeSimulation();
    console.log('_initializeGraph() after _initializeSimulation')
  }

  // Set up the simulation and event to update locations after each tick
  private _initializeSimulation = () => {
    console.log('_initializeSimulation() before forceSimulation')
    this.simulation = forceSimulation();
    console.log('_initializeSimulation() after forceSimulation')
    console.log('_initializeSimulation() before nodes')
    this.simulation.nodes(this.graph.nodes);
    console.log('_initializeSimulation() after nodes')
    console.log('_initializeSimulation() before _initializeForces')
    this._initializeForces();
    console.log('_initializeSimulation() after _initializeForces')
    console.log('_initializeSimulation() before simulation.on')
    this.simulation.on("tick", this._ticked);
    console.log('_initializeSimulation() after simulation.on')
  }

  // Add forces to the simulation
  private _initializeForces = () => {
    console.log('_initializeForces() before simulation.force')
    // add forces and associate each with a name
    this.simulation
      .force("link", forceLink())
      .force("charge", forceManyBody())
      .force("collide", forceCollide())
      .force("center", forceCenter())
      .force("forceX", forceX())
      .force("forceY", forceY());
    console.log('_initializeForces() after simulation.force')
    // apply properties to each of the forces
    console.log('_initializeForces() before _updateForces')
    this._updateForces(this.form.value);
    console.log('_initializeForces() after _updateForces')
  }

  // Apply new force properties
  private _updateForces = (forces: any) => {
    console.log('_updateForces() before simulation.force')
    // get each force by name and update the properties
    this.simulation.force("center")!
      // @ts-ignore
      .x(this.width * forces.center.x)
      .y(this.height * forces.center.y);
    this.simulation.force("charge")!
      // @ts-ignore
      .strength(forces.charge.strength * (forces.charge.enabled ? 1 : 0))
      .distanceMin(forces.charge.distanceMin)
      .distanceMax(forces.charge.distanceMax);
    this.simulation.force("collide")!
      // @ts-ignore
      .strength(forces.collide.strength * (forces.collide.enabled ? 1 : 0))
      .radius(forces.collide.radius)
      .iterations(forces.collide.iterations);
    this.simulation.force("forceX")!
      // @ts-ignore
      .strength(forces.forceX.strength * (forces.forceX.enabled ? 1 : 0))
      .x(this.width * forces.forceX.x);
    this.simulation.force("forceY")!
      // @ts-ignore
      .strength(forces.forceY.strength * (forces.forceY.enabled ? 1 : 0))
      .y(this.height * forces.forceY.y);
    this.simulation.force("link")!
      // @ts-ignore
      .id(d => d.id)
      .distance(forces.link.distance)
      .iterations(forces.link.iterations)
      .links(forces.link.enabled ? this.graph.links : []);
    console.log('_updateForces() after simulation.force')

    // Updates ignored until this is run
    // Restarts the simulation (important if simulation has already slowed down)
    console.log('_updateForces() before simulation.alpha')
    this.simulation.alpha(1).restart();
    console.log('_updateForces() after simulation.alpha')
  }

  //--- DISPLAY ---//

  private _initializeDisplay = () => {
    console.log('_initializeDisplay() before link')
    // Set the data and properties of link lines
    this.link = this.svg.append("g")
      .attr("class", "links")
      .attr("stroke", "darkgray")
      .selectAll("line")
      .data(this.graph.links)
      .enter().append("line");
    console.log('_initializeDisplay() after link')

    console.log('_initializeDisplay() before node')
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
    console.log('_initializeDisplay() after node')

    // Node tooltip
    console.log('_initializeDisplay() before node.append')
    this.node.append("title").text((d: any) => d.id);
    console.log('_initializeDisplay() after node.append')

    console.log('_initializeDisplay() before _initializeOnWindowResize')
    this._initializeOnWindowResize();
    console.log('_initializeDisplay() after _initializeOnWindowResize')

    // Visualize the graph
    console.log('_initializeDisplay() before _updateDisplay')
    this._updateDisplay();
    console.log('_initializeDisplay() after _updateDisplay')
  }

  private _initializeOnWindowResize = () => {
    console.log('_initializeOnWindowResize() before select')
    select(window).on("resize", () => this._handleOnWindowResize());
    console.log('_initializeOnWindowResize() after select')
  }

  private _handleOnWindowResize = () => {
    // Update dimensions and size-related forces
    console.log('_handleOnWindowResize() before _setWidthAndHeight')
    this._setWidthAndHeight();
    console.log('_handleOnWindowResize() after _setWidthAndHeight')
    console.log('_handleOnWindowResize() before _updateForces')
    this._updateForces(this.form.value);
    console.log('_handleOnWindowResize() after _updateForces')
  }

  private _setWidthAndHeight = () => {
    console.log('_setWidthAndHeight() before')
    // Update dimensions (width and height)
    const node = this.svg.node();
    this.width = +node!.getBoundingClientRect().width;
    this.height = +node!.getBoundingClientRect().height;
    console.log('_setWidthAndHeight() after')
  }

  // Update the display based on the forces (but not positions)
  private _updateDisplay = () => {
    console.log('_updateDisplay() before node')
    this.node
      .attr("r", this.forceProperties.collide.radius)
      .attr("stroke", this.forceProperties.charge.strength > 0 ? "blue" : "red")
      .attr("stroke-width", this.forceProperties.charge.enabled ? Math.abs(this.forceProperties.charge.strength) / 15 : 0);
    console.log('_updateDisplay() after node')

    console.log('_updateDisplay() before link')
    this.link
      .attr("stroke-width", this.forceProperties.link.enabled ? 1 : .5)
      .attr("opacity", this.forceProperties.link.enabled ? 1 : 0);
    console.log('_updateDisplay() after link')
  }

  tcount = 0;
  // Update the display positions after each simulation tick
  private _ticked = () => {
    const debug = ++this.tcount < 2;
    debug && console.log('_ticked() before link')
    this.link
      .attr("x1", (d: any) => d.source.x)
      .attr("y1", (d: any) => d.source.y)
      .attr("x2", (d: any) => d.target.x)
      .attr("y2", (d: any) => d.target.y);
    debug && console.log('_ticked() after link')

    debug && console.log('_ticked() before node')
    this.node
      .attr("cx", (d: any) => d.x)
      .attr("cy", (d: any) => d.y);
    debug && console.log('_ticked() after node')

    debug && console.log('_ticked() before select')
    select('#alpha_value').style('flex-basis', (this.simulation.alpha() * 100) + '%');
    debug && console.log('_ticked() after select')
  }

  //--- DRAG EVENTS ---//

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
