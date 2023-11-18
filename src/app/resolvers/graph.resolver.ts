import { ResolveFn } from '@angular/router';
import { from } from "rxjs";

import { json } from "d3";

export const GraphResolver: ResolveFn<any> = (_route, _state) => from(json("./assets/data/miserables.json"));
