import { AfterViewInit, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from "@angular/router";
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs';

// Material
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from "@angular/material/progress-bar";
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

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  imports: [
    MatCardModule,
    MatProgressBarModule,
    MatSliderModule,
    ReactiveFormsModule
  ],
  styleUrls: ['./home.component.scss']
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

  alpha = 100;

  form!: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private activatedRoute: ActivatedRoute
  ) {
  }

  ngOnInit() {
    this.graph = this.activatedRoute.snapshot.data['graph'];
    this._initializeForm();
  }

  ngAfterViewInit() {
    this._initializeGraph();
  }

  // Convenience function to update everything (run after UI input)
  updateAll() {
    this._updateForces(this.form.value);
    this._updateDisplay();
  }

  private _initializeForm = () => {
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
        iterations: 1
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

    this._initializeFormChanges();
  };

  private _initializeFormChanges = () => {
    this.form.valueChanges
      .pipe(
        debounceTime(200),
        takeUntilDestroyed(this.#destroyRef),
      )
      .subscribe(value => this._handleFormChange(value));
  };

  private _handleFormChange = (value: any) => {
    this._updateForces(value);
  };

  private _initializeGraph = () => {
    this.svg = select('svg');
    this._setWidthAndHeight();

    // Load the data, see: https://github.com/d3/d3/blob/main/CHANGES.md#changes-in-d3-50
    this._initializeDisplay();
    this._initializeSimulation();
  };

  // Set up the simulation and event to update locations after each tick
  private _initializeSimulation = () => {
    this.simulation = forceSimulation();
    this.simulation.nodes(this.graph.nodes);
    this._initializeForces();
    this.simulation.on('tick', this._ticked);
  };

  // Add forces to the simulation
  private _initializeForces = () => {
    // add forces and associate each with a name
    this.simulation
      .force('link', forceLink())
      .force('charge', forceManyBody())
      .force('collide', forceCollide())
      .force('center', forceCenter())
      .force('forceX', forceX())
      .force('forceY', forceY());
    // apply properties to each of the forces
    this._updateForces(this.form.value);
  };

  // Apply new force properties
  private _updateForces = (forces: any) => {
    // Get each force by name and update the properties
    this.simulation.force('center')!
      // @ts-ignore
      .x(this.width * forces.center.x)
      .y(this.height * forces.center.y);
    this.simulation.force('charge')!
      // @ts-ignore
      .strength(forces.charge.strength * (forces.charge.enabled ? 1 : 0))
      .distanceMin(forces.charge.distanceMin)
      .distanceMax(forces.charge.distanceMax);
    this.simulation.force('collide')!
      // @ts-ignore
      .strength(forces.collide.strength * (forces.collide.enabled ? 1 : 0))
      .radius(forces.collide.radius)
      .iterations(forces.collide.iterations);
    this.simulation.force('forceX')!
      // @ts-ignore
      .strength(forces.forceX.strength * (forces.forceX.enabled ? 1 : 0))
      .x(this.width * forces.forceX.x);
    this.simulation.force('forceY')!
      // @ts-ignore
      .strength(forces.forceY.strength * (forces.forceY.enabled ? 1 : 0))
      .y(this.height * forces.forceY.y);
    this.simulation.force('link')!
      // @ts-ignore
      .id(d => d.id)
      .distance(forces.link.distance)
      .iterations(forces.link.iterations)
      .links(forces.link.enabled ? this.graph.links : []);

    // Updates ignored until this is run
    // Restarts the simulation (important if simulation has already slowed down)
    this.simulation.alpha(1).restart();
  };

  // --- DISPLAY ---//

  private _initializeDisplay = () => {
    // Set the data and properties of link lines
    this.link = this.svg.append('g')
      .attr('class', 'links')
      .attr('stroke', 'darkgray')
      .selectAll('line')
      .data(this.graph.links)
      .enter().append('line');

    // Set the data and properties of node circles
    this.node = this.svg.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(this.graph.nodes)

      .enter().append('circle')
      .style('fill', (d: any) => this.#color(d.group))
      .style('cursor', 'pointer')
      // @ts-ignore
      .call(drag()
        .on('start', (e: any, d: any) => {
          this._dragStart(e, d);
        })
        .on('drag', (e: any, d: any) => {
          this._dragOngoing(e, d);
        })
        .on('end', (e: any, d: any) => {
          this._dragEnd(e, d);
        })
      );

    // Node tooltip
    this.node.append('title').text((d: any) => d.id);

    this._initializeOnWindowResize();

    // Visualize the graph
    this._updateDisplay();
  };

  private _initializeOnWindowResize = () => {
    select(window).on('resize', () => {
      this._handleOnWindowResize();
    });
  };

  private _handleOnWindowResize = () => {
    // Update dimensions and size-related forces
    this._setWidthAndHeight();
    this._updateForces(this.form.value);
  };

  private _setWidthAndHeight = () => {
    // Update dimensions (width and height)
    const node = this.svg.node();
    this.width = +node!.getBoundingClientRect().width;
    this.height = +node!.getBoundingClientRect().height;
  };

  // Update the display based on the forces (but not positions)
  private _updateDisplay = () => {
    const force = this.form.value;
    this.node
      .attr('r', force.collide.radius)
      .attr('stroke', force.charge.strength > 0 ? 'blue' : 'red')
      .attr('stroke-width', force.charge.enabled ? Math.abs(force.charge.strength) / 15 : 0);

    this.link
      .attr('stroke-width', force.link.enabled ? 1 : 0.5)
      .attr('opacity', force.link.enabled ? 1 : 0);
  };

  // Update the display positions after each simulation tick
  private _ticked = () => {
    this.link
      .attr('x1', (d: any) => d.source.x)
      .attr('y1', (d: any) => d.source.y)
      .attr('x2', (d: any) => d.target.x)
      .attr('y2', (d: any) => d.target.y);

    this.node
      .attr('cx', (d: any) => d.x)
      .attr('cy', (d: any) => d.y);

    this.alpha = Math.round(this.simulation.alpha() * 100);
  };

  // --- DRAG EVENTS --- //

  private _dragStart = (event: any, d: SimulationNodeDatum) => {
    if (!event.active) {
      if (this.simulation) {
        this.simulation.alphaTarget(0.3).restart();
      }
    }
    d.fx = d.x;
    d.fy = d.y;
  };

  private _dragOngoing = (event: any, d: SimulationNodeDatum) => {
    d.fx = event.x;
    d.fy = event.y;
  };

  private _dragEnd = (event: any, d: SimulationNodeDatum) => {
    if (!event.active) {
      if (this.simulation) {
        this.simulation.alphaTarget(0.0001);
      }
    }
    d.fx = null;
    d.fy = null;
  };
}
