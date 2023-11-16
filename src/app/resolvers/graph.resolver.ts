import { ResolveFn } from '@angular/router';
import { from } from "rxjs";

import { json } from "d3";

export const GraphResolver: ResolveFn<any> = (route, state) => from(json("./assets/miserables.json"));
