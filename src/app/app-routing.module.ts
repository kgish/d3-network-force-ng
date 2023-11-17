import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Resolvers
import { GraphResolver } from './resolvers/graph.resolver';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home.component').then(mod => mod.HomeComponent),
    resolve: { graph: GraphResolver }
  },
  { path: '**', redirectTo: '', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
